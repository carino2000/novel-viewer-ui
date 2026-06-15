import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Loader2, SlidersHorizontal, X } from 'lucide-react'
import { apiFetch } from '../api'

const BG_THEMES = {
  cream: {
    bg: '#faf6ef', text: '#2e2416', subText: '#9a8a74',
    headerBg: '#f3ede2', border: '#e8e0d0', headerText: '#4a3f30',
    btn: '#e8e0d0', btnHover: '#ddd5c5', navBtn: '#8b7355',
    divider: '#c8bca8', spinner: '#a09080', trackBg: '#e8e0d0',
  },
  sepia: {
    bg: '#f5ead5', text: '#3a2810', subText: '#8a6a50',
    headerBg: '#ede0c0', border: '#d4bfa0', headerText: '#3a2810',
    btn: '#d4bfa0', btnHover: '#c8b090', navBtn: '#7a5a35',
    divider: '#b89870', spinner: '#9a7a60', trackBg: '#d4bfa0',
  },
  white: {
    bg: '#fafafa', text: '#1a1a1a', subText: '#888888',
    headerBg: '#f2f2f2', border: '#e0e0e0', headerText: '#333333',
    btn: '#e4e4e4', btnHover: '#d4d4d4', navBtn: '#555555',
    divider: '#d0d0d0', spinner: '#999999', trackBg: '#e4e4e4',
  },
  night: {
    bg: '#1a1815', text: '#c8b99e', subText: '#7a6a54',
    headerBg: '#201e18', border: '#352f24', headerText: '#c8b99e',
    btn: '#2d2920', btnHover: '#3a3428', navBtn: '#4a3f30',
    divider: '#4a3f30', spinner: '#7a6a54', trackBg: '#2d2920',
  },
}

const LINE_HEIGHTS = { tight: 1.7, normal: 2.15, loose: 2.7 }

const FONTS = [
  { key: 'notoSerif',    label: '노토 세리프', sub: '명조체',   family: "'Noto Serif KR', serif" },
  { key: 'notoSans',     label: '노토 산스',   sub: '고딕',     family: "'Noto Sans KR', sans-serif" },
  { key: 'pretendard',   label: '프리텐다드',  sub: '모던 고딕', family: "'Pretendard', sans-serif" },
  { key: 'nanumGothic',  label: '나눔고딕',    sub: '고딕',     family: "'Nanum Gothic', sans-serif" },
]

export default function NovelViewer({ novelId, novelInfo, progress, onProgressChange, onNavVisibilityChange }) {
  const [episodeData, setEpisodeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uiVisible, setUiVisible] = useState(true)
  const [overscrollProgress, setOverscrollProgress] = useState(0)
  const [readProgress, setReadProgress] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [jumpEpisode, setJumpEpisode] = useState('')
  const [settings, setSettings] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('readerSettings') || 'null')
      if (s && s.bgColor && BG_THEMES[s.bgColor]) {
        return {
          fontSize: s.fontSize || 20,
          lineHeight: s.lineHeight in LINE_HEIGHTS ? s.lineHeight : 'normal',
          bgColor: s.bgColor,
          fontFamily: FONTS.some(f => f.key === s.fontFamily) ? s.fontFamily : 'notoSerif',
        }
      }
    } catch {}
    return { fontSize: 20, lineHeight: 'normal', bgColor: 'cream', fontFamily: 'notoSerif' }
  })

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
  const OVERSCROLL_THRESHOLD = 80

  const currentEpisode = progress?.currentEpisode ?? 1
  const totalEpisodes = novelInfo?.totalEpisodes ?? 1
  const theme = BG_THEMES[settings.bgColor] ?? BG_THEMES.cream
  const lh = LINE_HEIGHTS[settings.lineHeight] ?? 2.15
  const currentFont = FONTS.find(f => f.key === settings.fontFamily) ?? FONTS[0]

  const updateSettings = (patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem('readerSettings', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const openSettings = () => {
    setJumpEpisode(String(currentEpisode))
    setShowSettings(true)
  }

  const handleJump = () => {
    const n = parseInt(jumpEpisode)
    if (n >= 1 && n <= totalEpisodes && n !== currentEpisode) {
      navigate(n)
    }
    setShowSettings(false)
  }

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
    setShowSettings(false)
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
    if (showSettings) {
      setShowSettings(false)
      return
    }
    const next = !uiVisible
    setUiVisible(next)
    onNavVisibilityChange?.(next)
  }

  const handleScroll = () => {
    const container = scrollRef.current
    if (!container) return

    const scrollable = container.scrollHeight - container.clientHeight
    if (scrollable > 0) setReadProgress((container.scrollTop / scrollable) * 100)

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
    const prog = Math.min(delta / OVERSCROLL_THRESHOLD, 1)
    setOverscrollProgress(prog)
    if (prog >= 1 && !hasVibratedRef.current) {
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
    setShowSettings(false)
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
    <div className="relative h-full overflow-hidden" style={{ backgroundColor: theme.bg }}>

      {/* ── 헤더 오버레이 ── */}
      <div
        ref={headerRef}
        className={`absolute top-0 inset-x-0 z-20 transition-transform duration-300 ${uiVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div
          className="flex items-center gap-2 px-3 sm:px-5 py-3 border-b"
          style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
        >
          {/* 설정 버튼 (좌측) */}
          <button
            onClick={openSettings}
            className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-opacity hover:opacity-70"
            style={{ backgroundColor: theme.btn, color: theme.headerText }}
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>

          {/* 소설 제목 */}
          <h1
            className="flex-1 min-w-0 text-base font-semibold tracking-wide truncate"
            style={{ fontFamily: "'Pretendard', sans-serif", color: theme.headerText }}
          >
            {novelInfo?.title ?? ''}
          </h1>

          {/* 화수 네비게이션 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => navigate(currentEpisode - 1)}
              disabled={loading || !episodeData?.hasPrev}
              className="w-9 h-9 flex items-center justify-center rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-opacity hover:opacity-70"
              style={{ backgroundColor: theme.btn, color: theme.headerText }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-center tabular-nums"
              style={{ backgroundColor: theme.btn, color: theme.subText, fontFamily: "'Pretendard', sans-serif", minWidth: '4.5rem' }}
            >
              {currentEpisode} / {totalEpisodes}화
            </span>
            <button
              onClick={() => navigate(currentEpisode + 1)}
              disabled={loading || !episodeData?.hasNext}
              className="w-9 h-9 flex items-center justify-center rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-opacity hover:opacity-70"
              style={{ backgroundColor: theme.btn, color: theme.headerText }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 읽기 진행도 바 (항상 최상단 고정) ── */}
      <div className="absolute top-0 inset-x-0 z-30 h-0.75 bg-black/10">
        <div
          className="h-full bg-[#c8824a] transition-[width] duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* ── 하단 버튼 오버레이 ── */}
      <div
        className={`absolute bottom-0 inset-x-0 z-20 transition-transform duration-300 ${uiVisible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div
          className="flex items-center justify-center gap-4 px-4 sm:px-7 py-4 border-t"
          style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
        >
          <button
            onClick={() => navigate(currentEpisode - 1)}
            disabled={loading || !episodeData?.hasPrev}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-white text-base font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-opacity hover:opacity-80"
            style={{ backgroundColor: theme.navBtn, fontFamily: "'Pretendard', sans-serif" }}
          >
            <ChevronLeft className="w-5 h-5" />
            이전화
          </button>
          <button
            onClick={() => navigate(currentEpisode + 1)}
            disabled={loading || !episodeData?.hasNext}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-white text-base font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-opacity hover:opacity-80"
            style={{ backgroundColor: theme.navBtn, fontFamily: "'Pretendard', sans-serif" }}
          >
            다음화
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── 독서 설정 백드롭 (z-[60] — 모바일 nav z-50 위) ── */}
      <div
        className={`absolute inset-0 z-60 bg-black/40 transition-opacity duration-300 ${showSettings ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowSettings(false)}
      />

      {/* ── 독서 설정 드로어 (우측 슬라이드, z-[70]) ── */}
      <div
        className={`absolute top-0 left-0 h-full z-70 w-72 sm:w-80 shadow-2xl transition-transform duration-300 overflow-y-auto ${showSettings ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: theme.headerBg }}
      >
        {/* 드로어 헤더 */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b sticky top-0"
          style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}
        >
          <h3 className="font-semibold text-base" style={{ color: theme.headerText }}>독서 설정</h3>
          <button
            onClick={() => setShowSettings(false)}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-opacity hover:opacity-70"
            style={{ backgroundColor: theme.btn, color: theme.headerText }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 드로어 내용 */}
        <div className="px-5 py-5 pb-28 md:pb-6 space-y-6">

          {/* 화수 이동 */}
          <div>
            <p className="text-xs font-medium mb-3" style={{ color: theme.subText }}>화수 이동</p>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={totalEpisodes}
                value={jumpEpisode}
                onChange={e => setJumpEpisode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJump()}
                className="flex-1 text-center rounded-xl px-3 py-2.5 text-sm border outline-none"
                style={{
                  backgroundColor: theme.btn,
                  color: theme.headerText,
                  borderColor: theme.border,
                  fontFamily: "'Pretendard', sans-serif",
                  fontSize: '16px',
                }}
              />
              <button
                onClick={handleJump}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-80 shrink-0"
                style={{ backgroundColor: theme.navBtn }}
              >
                이동
              </button>
            </div>
            <p className="text-[10px] mt-1.5 text-right" style={{ color: theme.subText }}>
              1 – {totalEpisodes}화
            </p>
          </div>

          {/* 배경 테마 */}
          <div>
            <p className="text-xs font-medium mb-3" style={{ color: theme.subText }}>배경</p>
            <div className="flex gap-2">
              {Object.entries(BG_THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ bgColor: key })}
                  className="flex-1 h-9 rounded-xl border-2 transition-all duration-200 relative"
                  style={{
                    backgroundColor: t.bg,
                    borderColor: settings.bgColor === key ? '#6366f1' : t.border,
                    transform: settings.bgColor === key ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  {settings.bgColor === key && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-1.5">
              {['크림', '세피아', '밝게', '야간'].map(label => (
                <p key={label} className="flex-1 text-center text-[10px]" style={{ color: theme.subText }}>{label}</p>
              ))}
            </div>
          </div>

          {/* 글자 크기 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium" style={{ color: theme.subText }}>글자 크기</p>
              <p className="text-xs font-semibold" style={{ color: theme.headerText }}>{settings.fontSize}px</p>
            </div>
            <input
              type="range"
              min={14}
              max={24}
              step={1}
              value={settings.fontSize}
              onChange={e => updateSettings({ fontSize: Number(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#6366f1', backgroundColor: theme.trackBg }}
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px]" style={{ color: theme.subText }}>작게</span>
              <span className="text-[10px]" style={{ color: theme.subText }}>크게</span>
            </div>
          </div>

          {/* 줄 간격 */}
          <div>
            <p className="text-xs font-medium mb-3" style={{ color: theme.subText }}>줄 간격</p>
            <div className="flex gap-2">
              {[['tight', '좁게'], ['normal', '보통'], ['loose', '넓게']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ lineHeight: key })}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200 border"
                  style={{
                    backgroundColor: settings.lineHeight === key ? '#6366f1' : theme.btn,
                    color: settings.lineHeight === key ? 'white' : theme.headerText,
                    borderColor: settings.lineHeight === key ? '#6366f1' : 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 폰트 */}
          <div>
            <p className="text-xs font-medium mb-3" style={{ color: theme.subText }}>폰트</p>
            <div className="flex flex-col gap-1.5">
              {FONTS.map(font => (
                <button
                  key={font.key}
                  onClick={() => updateSettings({ fontFamily: font.key })}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-200 text-left"
                  style={{
                    backgroundColor: settings.fontFamily === font.key ? '#6366f1' : theme.btn,
                    borderColor: settings.fontFamily === font.key ? '#6366f1' : 'transparent',
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{
                      fontFamily: font.family,
                      color: settings.fontFamily === font.key ? 'white' : theme.headerText,
                    }}
                  >
                    {font.label}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: settings.fontFamily === font.key ? 'rgba(255,255,255,0.6)' : theme.subText }}
                  >
                    {font.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 읽기 현황 */}
          <div className="pt-4 border-t" style={{ borderColor: theme.border }}>
            <p className="text-xs font-medium mb-3" style={{ color: theme.subText }}>읽기 현황</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: `${currentEpisode}화`, label: '현재 위치' },
                { value: `${totalEpisodes}화`, label: '전체 화수' },
                { value: `${Math.round(readProgress)}%`, label: '이번 화' },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: theme.btn }}>
                  <p className="text-base font-bold" style={{ color: theme.headerText }}>{value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: theme.subText }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── 본문 스크롤 영역 ── */}
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
          <div className="flex items-center justify-center h-full gap-2" style={{ color: theme.spinner }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm" style={{ fontFamily: "'Pretendard', sans-serif" }}>
              불러오는 중
            </span>
          </div>
        ) : (
          <div className="max-w-xl mx-auto px-5 sm:px-8 pb-24">
            {/* 에피소드 제목 */}
            <div style={{ paddingTop: headerHeightRef.current + 16 }} className="pb-5 text-center">
              <p
                className="text-xs tracking-[0.15em] uppercase mb-2"
                style={{ fontFamily: "'Pretendard', sans-serif", color: theme.subText }}
              >
                제 {currentEpisode}화
              </p>
              <h2
                className="text-xl font-bold leading-snug"
                style={{ fontFamily: currentFont.family, color: theme.text }}
              >
                {episodeData.episode.title}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-10 h-px" style={{ backgroundColor: theme.divider }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.divider }} />
                <div className="w-10 h-px" style={{ backgroundColor: theme.divider }} />
              </div>
            </div>

            {/* 본문 줄들 */}
            {lines.map((line, i) =>
              line.trim() === '' ? (
                <div key={i} ref={el => { lineRefs.current[i] = el }} className="h-4" />
              ) : (
                <p
                  key={i}
                  ref={el => { lineRefs.current[i] = el }}
                  className="font-bold mb-0.5 break-keep"
                  style={{
                    fontFamily: currentFont.family,
                    wordBreak: 'keep-all',
                    color: theme.text,
                    fontSize: `${settings.fontSize}px`,
                    lineHeight: lh,
                  }}
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
                    className="text-sm select-none"
                    style={{ fontFamily: "'Pretendard', sans-serif", color: theme.subText }}
                  >
                    {overscrollProgress >= 1 ? '손을 떼면 다음화로 이동합니다' : '━━━  다음화로 계속  ━━━'}
                  </p>
                  <div className="w-36 h-1 rounded-full overflow-hidden" style={{ backgroundColor: theme.trackBg }}>
                    <div
                      className="h-full rounded-full transition-[width] duration-100"
                      style={{ width: `${overscrollProgress * 100}%`, backgroundColor: theme.navBtn }}
                    />
                  </div>
                </>
              ) : (
                <p
                  className="text-sm select-none"
                  style={{ fontFamily: "'Pretendard', sans-serif", color: theme.subText }}
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
