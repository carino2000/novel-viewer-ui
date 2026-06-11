import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { apiFetch } from '../api'

export default function NovelViewer({ novelId, novelInfo, progress, onProgressChange }) {
  const [episodeData, setEpisodeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)
  const lineRefs = useRef({})
  const shouldRestoreScroll = useRef(false)
  const scrollTimer = useRef(null)

  const currentEpisode = progress?.currentEpisode ?? 1
  const totalEpisodes = novelInfo?.totalEpisodes ?? 1

  useEffect(() => {
    if (!novelId || !progress) return
    lineRefs.current = {}
    setLoading(true)
    shouldRestoreScroll.current = true
    apiFetch(`/api/episode?novelId=${novelId}&episodeNumber=${currentEpisode}`)
      .then(setEpisodeData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [novelId, currentEpisode])

  useEffect(() => {
    if (loading || !shouldRestoreScroll.current) return
    shouldRestoreScroll.current = false
    const idx = progress?.paragraphIndex ?? 0
    const el = lineRefs.current[idx]
    if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'start' })
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [loading])

  const handleScroll = () => {
    clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      const container = scrollRef.current
      if (!container || !novelId) return
      const containerTop = container.getBoundingClientRect().top
      let idx = 0
      const indices = Object.keys(lineRefs.current).map(Number).sort((a, b) => a - b)
      for (const i of indices) {
        const el = lineRefs.current[i]
        if (!el) continue
        if (el.getBoundingClientRect().top - containerTop >= 0) {
          idx = i
          break
        }
      }
      apiFetch('/api/reading-progress', {
        method: 'PUT',
        body: JSON.stringify({ novelId, paragraphIndex: idx }),
      })
        .then(onProgressChange)
        .catch(console.error)
    }, 1000)
  }

  const navigate = async (newEpisode) => {
    try {
      const updated = await apiFetch('/api/reading-progress', {
        method: 'PUT',
        body: JSON.stringify({ novelId, currentEpisode: newEpisode, paragraphIndex: 0 }),
      })
      onProgressChange(updated)
    } catch (e) {
      console.error(e)
    }
  }

  const lines = episodeData?.episode?.content?.split('\n') ?? []

  return (
    <div className="flex flex-col h-full bg-[#faf6ef]">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-7 py-3.5 border-b border-[#e8e0d0] bg-[#f3ede2] shrink-0">
        <h1
          className="text-base font-semibold text-[#4a3f30] tracking-wide truncate max-w-36"
          style={{ fontFamily: "'Pretendard', sans-serif" }}
        >
          {novelInfo?.title ?? ''}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(currentEpisode - 1)}
            disabled={loading || !episodeData?.hasPrev}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#e8e0d0] hover:bg-[#ddd5c5] text-[#4a3f30] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className="text-xs text-[#7a6a54] font-medium px-3 py-1.5 bg-[#e8e0d0] rounded-lg min-w-20 text-center"
            style={{ fontFamily: "'Pretendard', sans-serif" }}
          >
            {currentEpisode} / {totalEpisodes}화
          </span>
          <button
            onClick={() => navigate(currentEpisode + 1)}
            disabled={loading || !episodeData?.hasNext}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#e8e0d0] hover:bg-[#ddd5c5] text-[#4a3f30] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 화 제목 */}
      {!loading && episodeData && (
        <div className="px-10 pt-9 pb-5 shrink-0 text-center">
          <p
            className="text-xs text-[#9a8a74] tracking-[0.15em] uppercase mb-2"
            style={{ fontFamily: "'Pretendard', sans-serif" }}
          >
            제 {currentEpisode}화
          </p>
          <h2
            className="text-xl font-bold text-[#2c2416] leading-snug"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            {episodeData.episode.title}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-10 h-px bg-[#c8bca8]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#c8bca8]" />
            <div className="w-10 h-px bg-[#c8bca8]" />
          </div>
        </div>
      )}

      {/* 본문 스크롤 영역 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-10 pb-8"
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full gap-2 text-[#a09080]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm" style={{ fontFamily: "'Pretendard', sans-serif" }}>
              불러오는 중
            </span>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            {lines.map((line, i) =>
              line.trim() === '' ? (
                <div
                  key={i}
                  ref={(el) => { lineRefs.current[i] = el }}
                  className="h-4"
                />
              ) : (
                <p
                  key={i}
                  ref={(el) => { lineRefs.current[i] = el }}
                  className="text-[#2e2416] text-[16.5px] leading-[2.05] mb-0.5 break-keep"
                  style={{ fontFamily: "'Noto Serif KR', serif", wordBreak: 'keep-all' }}
                >
                  {line}
                </p>
              )
            )}
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="flex items-center justify-center gap-3 px-7 py-3.5 border-t border-[#e8e0d0] bg-[#f3ede2] shrink-0">
        <button
          onClick={() => navigate(currentEpisode - 1)}
          disabled={loading || !episodeData?.hasPrev}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#8b7355] hover:bg-[#7a6344] text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ fontFamily: "'Pretendard', sans-serif" }}
        >
          <ChevronLeft className="w-4 h-4" />
          이전화
        </button>
        <button
          onClick={() => navigate(currentEpisode + 1)}
          disabled={loading || !episodeData?.hasNext}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#8b7355] hover:bg-[#7a6344] text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ fontFamily: "'Pretendard', sans-serif" }}
        >
          다음화
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
