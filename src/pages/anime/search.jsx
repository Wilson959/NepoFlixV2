"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { searchAnime } from "../../components/anime/search.jsx"
import AnimeHeader from "../../components/anime/ui/header.jsx"

export default function AnimeSearch() {
  const [searchParams] = useSearchParams()
  const [searchResults, setSearchResults] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const lastSearchRef = useRef({ query: "", page: 0 })

  useEffect(() => {
    document.body.style.backgroundColor = "var(--color-anime-background)"

    const searchQuery = searchParams.get("q")
    const page = Number.parseInt(searchParams.get("page")) || 1

    // Prevent duplicate requests for the same query and page
    if (searchQuery && (searchQuery !== lastSearchRef.current.query || page !== lastSearchRef.current.page)) {
      setQuery(searchQuery)
      setCurrentPage(page)
      performSearch(searchQuery, page)
      lastSearchRef.current = { query: searchQuery, page }
    }
  }, [searchParams])

  const performSearch = async (searchQuery, page = 1) => {
    if (!searchQuery || searchQuery.trim() === "") return

    setLoading(true)
    try {
      const { totalPages: total, results } = await searchAnime(searchQuery, page)
      setSearchResults(results)
      setTotalPages(total)
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const renderSearchResults = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {Array.from({ length: 20 }).map((_, index) => (
            <div key={index} className="group">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-700/50 to-gray-800/50"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg w-3/4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 w-12 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-full"></div>
                    <div className="h-6 w-16 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (!searchResults || searchResults.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
            <p className="text-gray-400 leading-relaxed">
              Try searching with different keywords or check your spelling
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {searchResults.map((anime, index) => (
          <Link key={anime.id || index} to={`/anime/${anime.id}`} className="group block">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl overflow-hidden hover:bg-gray-700/50 hover:border-gray-600/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 ease-out group-hover:scale-[1.02]">
              <div className="relative overflow-hidden">
                <img
                  src={
                    anime.poster ||
                    `https://placehold.co/300x400/1f2937/9ca3af/?text=${encodeURIComponent(anime.title || "Unknown")}&font=inter`
                  }
                  alt={anime.title || "Anime"}
                  className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {anime.tvInfo?.quality && anime.tvInfo.quality.includes("HD") && (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/90 backdrop-blur-sm text-white rounded-full border border-emerald-400/30">
                      HD
                    </span>
                  )}
                  {anime.tvInfo?.sub && (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-blue-500/90 backdrop-blur-sm text-white rounded-full border border-blue-400/30">
                      SUB {anime.tvInfo.sub}
                    </span>
                  )}
                  {anime.tvInfo?.dub && (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-purple-500/90 backdrop-blur-sm text-white rounded-full border border-purple-400/30">
                      DUB {anime.tvInfo.dub}
                    </span>
                  )}
                  {anime.tvInfo?.eps && (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-gray-600/90 backdrop-blur-sm text-white rounded-full border border-gray-500/30">
                      {anime.tvInfo.eps} EPS
                    </span>
                  )}
                  {anime.duration && (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-orange-500/90 backdrop-blur-sm text-white rounded-full border border-orange-400/30">
                      {anime.duration}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-blue-300 transition-colors duration-200">
                  {anime.title || "Unknown Anime"}
                </h3>
                {anime.japanese_title && (
                  <p className="text-xs text-gray-400 line-clamp-1 font-medium">{anime.japanese_title}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    )
  }

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5

    let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1)
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 1)
    }

    if (currentPage > 1) {
      pages.push(
        <Link
          key="prev"
          to={`/anime/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
          className="flex items-center justify-center w-10 h-10 bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-200 text-gray-300 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>,
      )
    }

    if (startPage > 1) {
      pages.push(
        <Link
          key="1"
          to={`/anime/search?q=${encodeURIComponent(query)}&page=1`}
          className="flex items-center justify-center w-10 h-10 bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-200 text-gray-300 hover:text-white font-medium"
        >
          1
        </Link>,
      )

      if (startPage > 2) {
        pages.push(
          <span key="dots1" className="flex items-center px-2 text-gray-500">
            ...
          </span>,
        )
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage
      pages.push(
        <Link
          key={i}
          to={`/anime/search?q=${encodeURIComponent(query)}&page=${i}`}
          className={`flex items-center justify-center w-10 h-10 rounded-xl font-medium transition-all duration-200 ${
            isActive
              ? "bg-blue-500 text-white border border-blue-400/50 shadow-lg shadow-blue-500/25"
              : "bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 hover:bg-gray-700/50 hover:border-gray-600/50 text-gray-300 hover:text-white"
          }`}
        >
          {i}
        </Link>,
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="dots2" className="flex items-center px-2 text-gray-500">
            ...
          </span>,
        )
      }

      pages.push(
        <Link
          key={totalPages}
          to={`/anime/search?q=${encodeURIComponent(query)}&page=${totalPages}`}
          className="flex items-center justify-center w-10 h-10 bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-200 text-gray-300 hover:text-white font-medium"
        >
          {totalPages}
        </Link>,
      )
    }

    if (currentPage < totalPages) {
      pages.push(
        <Link
          key="next"
          to={`/anime/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
          className="flex items-center justify-center w-10 h-10 bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-200 text-gray-300 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>,
      )
    }

    return <div className="flex items-center justify-center gap-2">{pages}</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
      <AnimeHeader />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {query && (
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Search Results for "{query}"
            </h1>
            <p className="text-gray-400 text-lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                `Found ${searchResults.length} results`
              )}
              {totalPages > 1 && !loading && (
                <span className="text-gray-500">
                  {" "}
                  • Page {currentPage} of {totalPages}
                </span>
              )}
            </p>
          </div>
        )}

        <div className="min-h-[60vh] mb-12">{renderSearchResults()}</div>

        <div className="flex justify-center">{renderPaginationControls()}</div>
      </div>
    </div>
  )
}
