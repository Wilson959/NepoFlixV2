"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { extractSpotlights } from "../../components/anime/spotlightData.jsx"
import { fetchAnimeData } from "../../components/anime/animeData.jsx"
import { AnimeCard } from "../../components/anime/ui/card.jsx"
import AnimeHeader from "../../components/anime/ui/header.jsx"
import { AnimeSpotlightSkeleton } from "../../components/Skeletons.jsx"

export default function AnimeHome() {
  const [spotlights, setSpotlights] = useState([])
  const [currentSpotlightIndex, setCurrentSpotlightIndex] = useState(0)
  const [currentCategory, setCurrentCategory] = useState("trending")
  const [animeData, setAnimeData] = useState([])
  const [sidebarData, setSidebarData] = useState({
    recentlyAdded: [],
    recentlyUpdated: [],
    topUpcoming: [],
  })
  const [loading, setLoading] = useState(true)
  const [spotlightLoading, setSpotlightLoading] = useState(true)
  const [sidebarLoading, setSidebarLoading] = useState(true)
  const spotlightInterval = useRef(null)
  const loadedCategories = useRef(new Set())

  useEffect(() => {
    document.body.style.backgroundColor = "var(--color-anime-background)"
    document.body.style.fontFamily = "Inter, sans-serif"

    loadInitialData()

    return () => {
      if (spotlightInterval.current) {
        clearInterval(spotlightInterval.current)
      }
    }
  }, [])

  useEffect(() => {
    if (spotlights.length > 1) {
      startSpotlightInterval()
    }
    return () => {
      if (spotlightInterval.current) {
        clearInterval(spotlightInterval.current)
      }
    }
  }, [spotlights])
  //
  const loadInitialData = async () => {
    try {
      // Load spotlight and trending data first (most important)
      const [spotlightData, trendingData] = await Promise.all([extractSpotlights(), fetchAnimeData("top-airing")])

      setSpotlights(spotlightData || [])
      setSpotlightLoading(false)
      setAnimeData(trendingData?.results || [])
      loadedCategories.current.add("trending")
      setLoading(false)

      // Load sidebar data in the background (less critical)
      loadSidebarData()
    } catch (error) {
      console.error("Error loading initial data:", error)
      setSpotlightLoading(false)
      setLoading(false)
    }
  }

  const loadSidebarData = async () => {
    try {
      setSidebarLoading(true)

      // Load sidebar data sequentially to reduce server load
      const recentlyAddedData = await fetchAnimeData("recently-added")
      setSidebarData((prev) => ({
        ...prev,
        recentlyAdded: recentlyAddedData?.results?.slice(0, 5) || [],
      }))

      const recentlyUpdatedData = await fetchAnimeData("recently-updated")
      setSidebarData((prev) => ({
        ...prev,
        recentlyUpdated: recentlyUpdatedData?.results?.slice(0, 5) || [],
      }))

      const topUpcomingData = await fetchAnimeData("top-upcoming")
      setSidebarData((prev) => ({
        ...prev,
        topUpcoming: topUpcomingData?.results?.slice(0, 5) || [],
      }))
    } catch (error) {
      console.error("Error loading sidebar data:", error)
    } finally {
      setSidebarLoading(false)
    }
  }

  const loadAnimeData = async (category) => {
    // Check if we already have this category loaded
    if (loadedCategories.current.has(category)) {
      return
    }

    setLoading(true)
    let endpoint = ""

    switch (category) {
      case "trending":
        endpoint = "top-airing"
        break
      case "popular":
        endpoint = "most-popular"
        break
      case "toprated":
        endpoint = "most-favorite"
        break
      default:
        endpoint = "top-airing"
    }

    try {
      const { results } = await fetchAnimeData(endpoint)
      setAnimeData(results || [])
      loadedCategories.current.add(category)
    } catch (error) {
      console.error(`Error loading ${category} anime:`, error)
      setAnimeData([])
    } finally {
      setLoading(false)
    }
  }

  const startSpotlightInterval = () => {
    if (spotlightInterval.current) {
      clearInterval(spotlightInterval.current)
    }
    spotlightInterval.current = setInterval(() => {
      setCurrentSpotlightIndex((prev) => (prev + 1) % spotlights.length)
    }, 7000)
  }

  const showNextSpotlight = () => {
    setCurrentSpotlightIndex((prev) => (prev + 1) % spotlights.length)
    startSpotlightInterval()
  }

  const showPreviousSpotlight = () => {
    setCurrentSpotlightIndex((prev) => (prev - 1 + spotlights.length) % spotlights.length)
    startSpotlightInterval()
  }

  const handleCategoryChange = (category) => {
    setCurrentCategory(category)
    loadAnimeData(category)
  }

  const currentSpotlight = spotlights[currentSpotlightIndex]

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="group">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-[3/4] bg-gradient-to-br from-gray-700/50 to-gray-600/50"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg"></div>
              <div className="h-3 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg w-3/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderSidebarSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4 flex items-center gap-4 animate-pulse"
        >
          <div className="flex-shrink-0 w-12 h-16 bg-gradient-to-br from-gray-700/50 to-gray-600/50 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg w-3/4"></div>
            <div className="h-2 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg w-1/2"></div>
            <div className="flex gap-2">
              <div className="h-5 w-8 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-full"></div>
              <div className="h-5 w-12 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderSidebarAnimeItem = (anime, index) => (
    <Link key={anime.id} to={`/anime/${anime.id}`} className="group block">
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4 flex items-center gap-4 hover:bg-gray-700/40 hover:border-gray-600/50 transition-all duration-300 group-hover:scale-[1.02]">
        <div className="flex-shrink-0">
          <img
            src={anime.poster || "https://placehold.co/48x64/1f2937/9ca3af/?text=No+Image&font=inter"}
            alt={anime.title}
            className="w-12 h-16 object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-blue-300 transition-colors duration-200">
            {anime.title}
          </h4>
          <p className="text-xs text-gray-400 font-medium">{anime.tvInfo?.showType || "Anime"}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
              HD
            </span>
            {anime.tvInfo?.sub && (
              <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="bg-blue-400 text-blue-900 px-1 py-0.5 rounded-sm text-[0.5rem] font-bold">CC</span>
                {anime.tvInfo.sub}
              </span>
            )}
            {anime.tvInfo?.dub && (
              <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="bg-purple-400 text-purple-900 px-1 py-0.5 rounded-sm text-[0.5rem] font-bold">
                  DUB
                </span>
                {anime.tvInfo.dub}
              </span>
            )}
            {anime.duration && (
              <span className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full font-medium">
                {anime.duration}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white overflow-x-hidden">
      <AnimeHeader />

      <main className="pt-20 p-4 sm:p-6 lg:p-8">
        {spotlightLoading || !currentSpotlight ? (
          <AnimeSpotlightSkeleton />
        ) : (
          <section
            className="relative bg-cover bg-center rounded-3xl overflow-hidden h-[60vh] lg:h-[70vh] mb-8 shadow-2xl"
            style={{
              backgroundImage: `url('${currentSpotlight?.poster || "https://placehold.co/1200x500/1f2937/9ca3af/?text=Loading...&font=inter"}')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-900/60 to-gray-900/20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-transparent to-transparent"></div>

            <div className="absolute bottom-0 left-0 p-6 sm:p-8 lg:p-12 w-full lg:w-3/5 xl:w-1/2 z-10">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent leading-tight">
                {currentSpotlight?.title || "Loading..."}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-200 mb-8 font-normal leading-relaxed line-clamp-4">
                {currentSpotlight?.description
                  ? `${currentSpotlight.description.substring(0, 250)}${currentSpotlight.description.length > 250 ? "..." : ""}`
                  : "Loading description..."}
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link
                  to={`/anime/${currentSpotlight?.id || ""}`}
                  className="bg-white text-gray-900 px-8 py-3 text-lg font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  Watch Now
                </Link>
                <Link
                  to={`/anime/${currentSpotlight?.id || ""}`}
                  className="bg-gray-800/40 backdrop-blur-sm border border-gray-600/50 text-white px-8 py-3 text-lg font-semibold rounded-2xl hover:bg-gray-700/50 hover:border-gray-500/70 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  More Info
                </Link>
              </div>
            </div>

            <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 lg:bottom-12 lg:right-12 flex gap-3 z-10">
              <button
                onClick={showPreviousSpotlight}
                className="bg-gray-800/40 backdrop-blur-sm border border-gray-600/50 text-white p-3 rounded-2xl hover:bg-gray-700/50 hover:border-gray-500/70 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={showNextSpotlight}
                className="bg-gray-800/40 backdrop-blur-sm border border-gray-600/50 text-white p-3 rounded-2xl hover:bg-gray-700/50 hover:border-gray-500/70 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </section>
        )}

        <div className="flex flex-col xl:flex-row gap-8">
          <div className="flex-1">
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-3xl p-6 sm:p-8">
              <div className="flex space-x-1 mb-8 p-1 bg-gray-800/50 rounded-2xl border border-gray-700/30">
                {[
                  { key: "trending", label: "Trending" },
                  { key: "popular", label: "Popular" },
                  { key: "toprated", label: "Top Rated" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleCategoryChange(tab.key)}
                    className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-all duration-300 ${
                      currentCategory === tab.key
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {loading ? (
                renderSkeletonGrid()
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {animeData.map((anime, index) => (
                    <AnimeCard key={anime.id} animeData={anime} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="xl:w-80">
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-3xl p-6 sm:p-8 space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  Recently Added
                </h3>
                {sidebarLoading ? (
                  renderSidebarSkeleton()
                ) : (
                  <div className="space-y-4">
                    {sidebarData.recentlyAdded.map((anime, index) => renderSidebarAnimeItem(anime, index))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                  Recently Updated
                </h3>
                {sidebarLoading ? (
                  renderSidebarSkeleton()
                ) : (
                  <div className="space-y-4">
                    {sidebarData.recentlyUpdated.map((anime, index) => renderSidebarAnimeItem(anime, index))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                  Top Upcoming
                </h3>
                {sidebarLoading ? (
                  renderSidebarSkeleton()
                ) : (
                  <div className="space-y-4">
                    {sidebarData.topUpcoming.map((anime, index) => renderSidebarAnimeItem(anime, index))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
