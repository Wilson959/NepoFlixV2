"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { fetchAnimeInfo, fetchEpisodesList } from "../../components/anime/animeData.jsx"
import { getSourceUrl, getDefaultSource, animeSources } from "./sources.jsx"
import { extractSeasonNumber, findTmdbIdForSeason } from "../../components/anime/animeDetailsData.jsx"
import { fetchEpisodeThumbnails } from "../../components/anime/episodeThumbnails.jsx"
import AnimeHeader from "../../components/anime/ui/header.jsx"
import AnimeDetailsModal from "../../components/anime/ui/animeDetailsModal.jsx"

export default function AnimeDetails() {
  const { id } = useParams()
  const [animeData, setAnimeData] = useState(null)
  const [episodesData, setEpisodesData] = useState(null)
  const [currentEpisode, setCurrentEpisode] = useState(null)
  const [currentSource, setCurrentSource] = useState(getDefaultSource())
  const [currentLanguage, setCurrentLanguage] = useState("sub")
  const [currentSeason, setCurrentSeason] = useState(1)
  const [loading, setLoading] = useState(true)
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [episodeThumbnails, setEpisodeThumbnails] = useState({})
  const loadedSeasons = useRef(new Set())
  const thumbnailsLoaded = useRef(false)

  useEffect(() => {
    document.body.style.backgroundColor = "var(--color-anime-background)"
    // Reset state when navigating to a new anime
    setEpisodeThumbnails({})
    thumbnailsLoaded.current = false
    loadedSeasons.current.clear()
    loadAnimeData()
  }, [id])

  useEffect(() => {
    // Only fetch thumbnails once per anime and if we have the required data
    if (animeData && episodesData?.episodes && !thumbnailsLoaded.current) {
      fetchEpisodeThumbnailsData()
      thumbnailsLoaded.current = true
    }
  }, [animeData, episodesData])

  const fetchEpisodeThumbnailsData = async () => {
    if (!animeData?.title || !episodesData?.episodes) return

    try {
      console.log("Fetching episode thumbnails for:", animeData.title)

      // Use the current season's title for better TMDB matching
      const searchQuery =
        animeData.seasons && animeData.seasons.length > 0 ? animeData.seasons[0].name : animeData.title

      // Get enhanced TMDB data for the current season
      const tmdbSearchResult = await findTmdbIdForSeason(searchQuery)

      if (tmdbSearchResult?.tmdbId) {
        console.log("Found TMDB data for initial load:", tmdbSearchResult)

        const thumbnails = await fetchEpisodeThumbnails(
          episodesData.episodes.length,
          tmdbSearchResult.seasonNumber,
          searchQuery,
        )

        if (thumbnails) {
          console.log("Successfully fetched initial thumbnails:", thumbnails.length)
          const thumbnailsMap = {}
          thumbnails.forEach((thumb) => {
            if (thumb.thumbnail) {
              thumbnailsMap[thumb.episode_no] = {
                thumbnail: thumb.thumbnail,
                name: thumb.name,
                description: thumb.description,
                tmdbId: tmdbSearchResult.tmdbId,
              }
            }
          })
          setEpisodeThumbnails(thumbnailsMap)
        } else {
          console.log("No thumbnails found for initial load")
        }
      } else {
        console.log("No TMDB match found for initial load")
      }
    } catch (error) {
      console.error("Error fetching episode thumbnails:", error)
    }
  }

  const loadAnimeData = async () => {
    try {
      setLoading(true)

      const [animeInfo, episodesList] = await Promise.all([fetchAnimeInfo(id), fetchEpisodesList(id)])

      if (!animeInfo) {
        throw new Error("Failed to fetch anime data")
      }

      setAnimeData(animeInfo)
      setEpisodesData(episodesList)
      loadedSeasons.current.add(id)

      if (episodesList?.episodes && episodesList.episodes.length > 0) {
        setCurrentEpisode(episodesList.episodes[0])
      }

      // Set initial season
      if (animeInfo.seasons && animeInfo.seasons.length > 0) {
        const firstSeasonNumber = extractSeasonNumber(animeInfo.seasons[0].name)
        setCurrentSeason(firstSeasonNumber)
      }
    } catch (err) {
      console.error("Error loading anime details:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSeasonChange = async (seasonRoute) => {
    if (!seasonRoute || seasonRoute === "") return

    try {
      setEpisodesLoading(true)
      setEpisodeThumbnails({}) // Clear existing thumbnails
      thumbnailsLoaded.current = false // Reset thumbnail loading flag

      // Extract season ID from route
      const seasonId = seasonRoute

      // Fetch new episodes data for the selected season
      const [newAnimeInfo, newEpisodesData] = await Promise.all([fetchAnimeInfo(seasonId), fetchEpisodesList(seasonId)])

      if (newAnimeInfo && newEpisodesData) {
        // Update anime data with new season info
        setAnimeData((prevData) => ({
          ...prevData,
          ...newAnimeInfo,
          seasons: prevData.seasons, // Keep original seasons list
        }))

        setEpisodesData(newEpisodesData)
        loadedSeasons.current.add(seasonRoute)

        // Reset to first episode of new season
        if (newEpisodesData.episodes && newEpisodesData.episodes.length > 0) {
          setCurrentEpisode(newEpisodesData.episodes[0])
        }

        // Update current season
        const seasonNumber = extractSeasonNumber(newAnimeInfo.title)
        setCurrentSeason(seasonNumber)

        // Fetch new TMDB data and episode thumbnails for the new season
        await fetchSeasonSpecificTmdbData(newAnimeInfo, newEpisodesData.episodes)
      }
    } catch (error) {
      console.error("Error changing season:", error)
    } finally {
      setEpisodesLoading(false)
    }
  }

  const fetchSeasonSpecificTmdbData = async (seasonAnimeData, episodes) => {
    if (!seasonAnimeData?.title || !episodes?.length) return

    try {
      console.log("Fetching season-specific TMDB data for:", seasonAnimeData.title)

      // Use the new season's title to search for TMDB data
      const searchQuery = seasonAnimeData.title
      const seasonNumber = extractSeasonNumber(seasonAnimeData.title)

      // Search for TMDB ID using the season's title
      const tmdbSearchResult = await findTmdbIdForSeason(searchQuery)

      if (tmdbSearchResult?.tmdbId) {
        console.log(`Found TMDB match for "${searchQuery}":`, tmdbSearchResult.tmdbId)

        // Fetch episode thumbnails using the new TMDB data
        const thumbnails = await fetchEpisodeThumbnails(
          episodes.length,
          tmdbSearchResult.seasonNumber || seasonNumber,
          searchQuery,
        )

        if (thumbnails) {
          console.log("Successfully fetched thumbnails for new season:", thumbnails.length)
          const thumbnailsMap = {}
          thumbnails.forEach((thumb) => {
            if (thumb.thumbnail) {
              thumbnailsMap[thumb.episode_no] = {
                thumbnail: thumb.thumbnail,
                name: thumb.name,
                description: thumb.description,
                tmdbId: tmdbSearchResult.tmdbId,
              }
            }
          })
          setEpisodeThumbnails(thumbnailsMap)
          thumbnailsLoaded.current = true
        } else {
          console.log("No thumbnails found for new season")
        }
      } else {
        console.log("No TMDB match found for new season")
      }
    } catch (error) {
      console.error("Error fetching season-specific TMDB data:", error)
    }
  }

  const handleServerClick = (sourceId, language) => {
    const source = animeSources.find((src) => src.id === sourceId)
    if (source) {
      setCurrentSource(source)
      setCurrentLanguage(language)
    }
  }

  const handleEpisodeClick = (episode) => {
    setCurrentEpisode(episode)
  }

  const getIframeSrc = () => {
    if (!currentEpisode || !animeData) return "about:blank"

    const animeDataWithSeason = {
      ...animeData,
      season: animeData.seasons && animeData.seasons.length > 0 ? extractSeasonNumber(animeData.seasons[0].name) : "1",
    }

    return getSourceUrl(currentSource.id, currentLanguage, currentEpisode, animeDataWithSeason)
  }

  const renderSeasonOptions = (seasons) => {
    if (!seasons || seasons.length === 0) {
      return <option value="">No seasons available</option>
    }

    return seasons.map((season, index) => (
      <option key={index} value={season.route}>
        {season.name}
      </option>
    ))
  }

  const SkeletonEpisode = () => (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-24 h-16 bg-gradient-to-br from-gray-700/50 to-gray-600/50 rounded-xl"></div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg w-3/4"></div>
          <div className="h-3 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg w-1/2"></div>
        </div>
      </div>
    </div>
  )

  const renderEpisodesList = (episodes) => {
    if (episodesLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonEpisode key={index} />
          ))}
        </div>
      )
    }

    if (!episodes || episodes.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-700/50 to-gray-600/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-400 text-lg">No episodes available</p>
        </div>
      )
    }

    return episodes.map((episode, index) => {
      const episodeNumber = Number.parseInt(episode.episode_no)
      const thumbnailData = episodeThumbnails[episodeNumber]
      const thumbnail =
        thumbnailData?.thumbnail ||
        episode.thumbnail ||
        "https://placehold.co/320x180/1f2937/9ca3af/?text=Episode&font=inter"

      return (
        <div
          key={episode.episodeid || index}
          onClick={() => handleEpisodeClick(episode)}
          className={`group bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl overflow-hidden hover:bg-gray-700/40 hover:border-gray-600/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer ${
            currentEpisode?.episodeid === episode.episodeid
              ? "ring-2 ring-blue-500/50 bg-blue-500/10 border-blue-500/30"
              : ""
          }`}
          data-episode-id={episode.id}
          data-epid={episode.epid}
          data-episode-no={episode.episode_no}
          data-episodeid={episode.episodeid}
          data-tmdbid={thumbnailData?.tmdbId || ""}
          data-description={thumbnailData?.description || ""}
        >
          <div className="flex flex-col sm:flex-row">
            <div className="relative flex-shrink-0 w-full sm:w-32 md:w-40">
              <img
                src={thumbnail || "/placeholder.svg"}
                alt={thumbnailData?.name || episode.title || episode.japanese_title || `Episode ${episode.episode_no}`}
                className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = "https://placehold.co/320x180/1f2937/9ca3af/?text=Episode&font=inter"
                }}
              />
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-lg">
                EP {episode.episode_no}
              </div>
            </div>
            <div className="flex-1 p-4 space-y-2">
              <h3 className="font-semibold text-white leading-tight line-clamp-2 group-hover:text-blue-300 transition-colors duration-200">
                {thumbnailData?.name || episode.title || episode.japanese_title || `Episode ${episode.episode_no}`}
                {episode.filler && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-300 rounded-full border border-yellow-500/30">
                    Filler
                  </span>
                )}
              </h3>
              {thumbnailData?.description && (
                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{thumbnailData.description}</p>
              )}
            </div>
          </div>
        </div>
      )
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <div className="text-white">Loading anime details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen w-full flex-col gap-4">
        <h2 className="text-2xl font-bold text-white">Failed to load anime details</h2>
        <p className="text-white/80">{error}</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-anime-card-bg border border-anime-border/10 rounded-lg text-white hover:bg-anime-card-hover transition duration-200"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (!animeData) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <div className="text-white">No anime data found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
      <AnimeHeader />
      {showModal && <AnimeDetailsModal animeData={animeData} onClose={() => setShowModal(false)} />}

      <div className="flex flex-col xl:flex-row gap-6 w-full min-h-screen pt-24 p-4 sm:p-6">
        <div className="flex-1 flex flex-col gap-6">
          <div className="w-full">
            <iframe
              className="w-full h-[50vh] xl:h-[60vh] rounded-2xl border border-gray-700/30 shadow-2xl shadow-black/50"
              src={getIframeSrc()}
              allowFullScreen
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {animeData.title}
                </h2>
                <p className="text-gray-300 leading-relaxed line-clamp-4">
                  {animeData.animeInfo?.Overview || "No description available"}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full py-3 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl text-blue-300 font-medium hover:bg-blue-500/30 hover:border-blue-400/50 transition-all duration-200 hover:scale-[1.02]"
                >
                  View Details
                </button>
              </div>
            </div>

            <div className="lg:w-96">
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6 space-y-6">
                <h3 className="text-xl font-semibold text-center">Servers</h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
                    <span className="text-sm font-medium text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">SUB</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {animeSources.map((source) => (
                      <button
                        key={`${source.id}-sub`}
                        onClick={() => handleServerClick(source.id, "sub")}
                        className={`py-2.5 px-4 rounded-xl font-medium transition-all duration-200 ${
                          source.id === currentSource.id && currentLanguage === "sub"
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105"
                            : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white border border-gray-600/30"
                        }`}
                      >
                        {source.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
                    <span className="text-sm font-medium text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">DUB</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {animeSources.map((source) => (
                      <button
                        key={`${source.id}-dub`}
                        onClick={() => handleServerClick(source.id, "dub")}
                        className={`py-2.5 px-4 rounded-xl font-medium transition-all duration-200 ${
                          source.id === currentSource.id && currentLanguage === "dub"
                            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25 scale-105"
                            : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white border border-gray-600/30"
                        }`}
                      >
                        {source.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:w-96">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl h-full flex flex-col">
            <div className="p-6 border-b border-gray-700/30">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Episodes</h2>
                {animeData.seasons && animeData.seasons.length > 1 && (
                  <div className="relative">
                    <select
                      className="appearance-none bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-2 pr-10 text-white cursor-pointer outline-none hover:bg-gray-600/50 transition-all duration-200 focus:ring-2 focus:ring-blue-500/50"
                      defaultValue=""
                      onChange={(e) => handleSeasonChange(e.target.value)}
                    >
                      {renderSeasonOptions(animeData.seasons)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-600/50 scrollbar-track-transparent">
              {renderEpisodesList(episodesData?.episodes || [])}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
