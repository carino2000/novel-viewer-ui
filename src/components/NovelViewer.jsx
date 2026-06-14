import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { apiFetch } from '../api'

export default function NovelViewer({ novelId, novelInfo, progress, onProgressChange, onNavVisibilityChange }) {
  const [episodeData, setEpisodeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uiVisible, setUiVisible] = useState(true)
  const scrollRef = useRef(null)
  const headerRef = useRef(null)
  const headerHeightRef = useRef(52)
  const lineRefs = useRef({})
  const shouldRestoreScroll = useRef(false)
  const scrollTimer = useRef(null)
  const lastScrollY = useRef(0)
  const overscrollRef = useRef(0)
  const atBottomTouchY = useRef(null)
  const navigatingRef = useRef(false)
  const hasVibratedRef = useRef(false)
  const [overscrollProgress, setOverscrollProgress] = useState(0)
  const OVERSCROLL_THRESHOLD = 80

  const currentEpisode = progress?.currentEpisode ?? 1
  const totalEpisodes = novelInfo?.totalEpisodes ?? 1

  // 헤더 높이 측정 (ref만 — state 업데이트 없음, 리렌더 없음)
  useLayoutEffect(() => {
    if (!headerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      headerHeightRef.current = entry.contentRect.height
    })
    ro.observe(headerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!novelId || !progress) return
    lineRefs.current = {}
    setLoading(true)
    setUiVisible(true)
    onNavVisibilityChange?.(true)
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
    if (!scrollRef.current) return
    if (idx === 0) {
      scrollRef.current.scrollTop = 0
    } else {
      const el = lineRefs.current[idx]
      scrollRef.current.scrollTop = el ? el.offsetTop - headerHeightRef.current : 0
    }
  }, [loading])

  const handleTap = (e) => {
    if (window.innerWidth >= 768) return
    if (e.target.closest('button, a, input')) return
    if (!uiVisible) {
      setUiVisible(true)
      onNavVisibilityChange?.(true)
    }
  }

  const handleScroll = () => {
    const container = scrollRef.current
    if (!container) return

    if (window.innerWidth < 768) {
      const currentY = container.scrollTop
      if (currentY < 10) {
        setUiVisible(true)
        onNavVisibilityChange?.(true)
      } else if (currentY > lastScrollY.current + 5) {
        setUiVisible(false)
        onNavVisibilityChange?.(false)
      } else if (currentY < lastScrollY.current - 5) {
        setUiVisible(true)
        onNavVisibilityChange?.(true)
      }
      lastScrollY.current = currentY
    }

    clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      if (!novelId) return
      const containerTop = container.getBoundingClientRect().top
      const threshold = headerHeightRef.current
      let idx = 0
      const indices = Object.keys(lineRefs.current).map(Number).sort((a, b) => a - b)
      for (const i of indices) {
        const el = lineRefs.current[i]
        if (!el) continue
        if (el.getBoundingClientRect().top - containerTop >= threshold) {
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

  const handleTouchStart = () => {
    atBottomTouchY.current = null
    hasVibratedRef.current = false
  }

  const handleTouchMove = (e) => {
    if (navigatingRef.current || !episodeData?.hasNext) return
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 5
    if (!atBottom) {
      atBottomTouchY.current = null
      if (overscrollRef.current > 0) { overscrollRef.current = 0; setOverscrollProgress(0) }
      return
    }
    if (atBottomTouchY.current === null) atBottomTouchY.current = e.touches[0].clientY
    const delta = Math.max(0, atBottomTouchY.current - e.touches[0].clientY)
    overscrollRef.current = delta
    const progress = Math.min(delta / OVERSCROLL_THRESHOLD, 1)
    setOverscrollProgress(progress)
    if (progress >= 1 && !hasVibratedRef.current) {
      navigator.vibrate?.([15])
      hasVibratedRef.current = true
    }
  }

  const handleTouchEnd = async () => {
    if (navigatingRef.current) return
    if (overscrollRef.current >= OVERSCROLL_THRESHOLD && episodeData?.hasNext) {
      navigatingRef.current = true
      navigator.vibrate?.([30, 30, 50])
      overscrollRef.current = 0
      setOverscrollProgress(0)
      await navigate(currentEpisode + 1)
      navigatingRef.current = false
    } else {
      overscrollRef.current = 0
      setOverscrollProgress(0)
    }
    atBottomTouchY.current = null
    hasVibratedRef.current = false
  }

  const navigate = async (newEpisode) => {
    overscrollRef.current = 0
    setOverscrollProgress(0)
    setUiVisible(true)
    onNavVisibilityChange?.(true)
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
    <div className="relative h-full overflow-hidden bg-[#faf6ef]">

      {/* ── 헤더 오버레이: 글자 위에 얹혀있다 사라지는 방식 (paddingTop 없음) ── */}
      <div
        ref={headerRef}
        className={`absolute top-0 inset-x-0 z-20 transition-transform duration-300 ${uiVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="flex items-center justify-between px-4 sm:px-7 py-4 border-b border-[#e8e0d0] bg-[#f3ede2]">
          <h1
            className="text-lg font-semibold text-[#4a3f30] tracking-wide truncate flex-1 min-w-0 mr-3"
            style={{ fontFamily: "'Pretendard', sans-serif" }}
          >
            {novelInfo?.title ?? ''}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(currentEpisode - 1)}
              disabled={loading || !episodeData?.hasPrev}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#e8e0d0] hover:bg-[#ddd5c5] text-[#4a3f30] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span
              className="text-sm text-[#7a6a54] font-medium px-3.5 py-2 bg-[#e8e0d0] rounded-xl min-w-24 text-center"
              style={{ fontFamily: "'Pretendard', sans-serif" }}
            >
              {currentEpisode} / {totalEpisodes}화
            </span>
            <button
              onClick={() => navigate(currentEpisode + 1)}
              disabled={loading || !episodeData?.hasNext}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#e8e0d0] hover:bg-[#ddd5c5] text-[#4a3f30] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 하단 버튼 오버레이 ── */}
      <div className={`absolute bottom-0 inset-x-0 z-20 transition-transform duration-300 ${uiVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center justify-center gap-3 px-4 sm:px-7 py-4 border-t border-[#e8e0d0] bg-[#f3ede2]">
          <button
            onClick={() => navigate(currentEpisode - 1)}
            disabled={loading || !episodeData?.hasPrev}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-[#8b7355] hover:bg-[#7a6344] text-white text-base font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: "'Pretendard', sans-serif" }}
          >
            <ChevronLeft className="w-5 h-5" />
            이전화
          </button>
          <button
            onClick={() => navigate(currentEpisode + 1)}
            disabled={loading || !episodeData?.hasNext}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-[#8b7355] hover:bg-[#7a6344] text-white text-base font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: "'Pretendard', sans-serif" }}
          >
            다음화
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── 본문 스크롤 영역: 패딩 없음, 헤더가 글자 위에 올라탐 ── */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto"
        onScroll={handleScroll}
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full gap-2 text-[#a09080]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm" style={{ fontFamily: "'Pretendard', sans-serif" }}>
              불러오는 중
            </span>
          </div>
        ) : (
          <div className="max-w-xl mx-auto px-5 sm:px-8 pb-24">
            {/* 에피소드 제목 — 헤더 높이만큼 상단 여백 후 시작 */}
            <div style={{ paddingTop: headerHeightRef.current + 16 }} className="pb-5 text-center">
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
            {/* 본문 줄들 */}
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
                  className="text-[#2e2416] text-[20px] font-bold leading-[2.15] mb-0.5 break-keep"
                  style={{ fontFamily: "'Noto Serif KR', serif", wordBreak: 'keep-all' }}
                >
                  {line}
                </p>
              )
            )}

            {/* 화 전환 인디케이터 */}
            <div className="flex flex-col items-center gap-3 pt-10 pb-6">
              {episodeData?.hasNext ? (
                <>
                  <p
                    className="text-sm text-[#b0a090] select-none"
                    style={{ fontFamily: "'Pretendard', sans-serif" }}
                  >
                    {overscrollProgress >= 1 ? '손을 떼면 다음화로 이동합니다' : '━━━  다음화로 계속  ━━━'}
                  </p>
                  <div className="w-36 h-1 bg-[#e8e0d0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8b7355] rounded-full transition-[width] duration-100"
                      style={{ width: `${overscrollProgress * 100}%` }}
                    />
                  </div>
                </>
              ) : (
                <p
                  className="text-sm text-[#b0a090] select-none"
                  style={{ fontFamily: "'Pretendard', sans-serif" }}
                >
                  ━━━  완결  ━━━
                </p>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
