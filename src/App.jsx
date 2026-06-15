import { useState, useEffect, useRef } from 'react'
import { BookOpen, User, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import NovelViewer from './components/NovelViewer'
import SidePanel from './components/SidePanel'
import { apiFetch } from './api'

export default function App() {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [novelId, setNovelId] = useState(null)
  const [novelInfo, setNovelInfo] = useState(null)
  const [progress, setProgress] = useState(null)
  const [selecting, setSelecting] = useState(false)
  const [mobileView, setMobileView] = useState('reader')
  const [navVisible, setNavVisible] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [panelResetCount, setPanelResetCount] = useState(0)
  const swipeStartX = useRef(null)
  const swipeStartY = useRef(null)

  const handleMobileViewChange = (view) => {
    if (view === 'panel' && mobileView === 'reader') {
      setPanelResetCount(c => c + 1)
    }
    setMobileView(view)
    setNavVisible(true)
  }

  const handleSwipeTouchStart = (e) => {
    if (window.innerWidth >= 768 || mobileView !== 'panel') return
    swipeStartX.current = e.touches[0].clientX
    swipeStartY.current = e.touches[0].clientY
  }

  const handleSwipeTouchEnd = (e) => {
    if (window.innerWidth >= 768) return
    if (swipeStartX.current === null) return
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    const dy = e.changedTouches[0].clientY - swipeStartY.current
    swipeStartX.current = null
    swipeStartY.current = null
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    if (dx > 0) handleMobileViewChange('reader')
  }

  useEffect(() => {
    apiFetch('/api/novel')
      .then(setNovels)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSelectNovel = async (novel) => {
    setSelecting(true)
    try {
      const prog = await apiFetch(`/api/reading-progress?novelId=${novel.novelId}`)
      setNovelInfo(novel)
      setNovelId(novel.novelId)
      setProgress(prog)
    } catch (e) {
      console.error(e)
    } finally {
      setSelecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0c0c15]">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    )
  }

  if (!novelId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0c0c15] relative overflow-hidden">
        {/* 배경 그라디언트 오브 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-10">
          {/* 로고 */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">Novel Viewer</h1>
              <p className="text-sm text-white/40 mt-1">읽을 소설을 선택하세요</p>
            </div>
          </div>

          {/* 소설 목록 */}
          <div className="flex flex-col gap-3 w-full max-w-sm px-4 sm:px-0">
            {novels.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">소설 데이터가 없습니다.</p>
            ) : (
              novels.map((novel) => (
                <button
                  key={novel.novelId}
                  onClick={() => handleSelectNovel(novel)}
                  disabled={selecting}
                  className="group relative bg-[#13131e] hover:bg-[#1a1a28] border border-white/[0.07] hover:border-indigo-500/40 rounded-2xl p-5 text-left transition-all duration-200 disabled:opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-white font-semibold text-lg leading-tight">{novel.title}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3 text-white/30" />
                        <span className="text-white/40 text-xs">{novel.author}</span>
                        <span className="text-white/20 text-xs">·</span>
                        <span className="text-white/40 text-xs">총 {novel.totalEpisodes}화</span>
                      </div>
                      {novel.description && (
                        <p className="text-white/35 text-xs mt-2.5 leading-relaxed line-clamp-2">
                          {novel.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-indigo-400 transition-colors shrink-0 mt-1 ml-3" />
                  </div>
                  {/* 호버 시 좌측 강조 바 */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 group-hover:h-12 bg-indigo-500 rounded-full transition-all duration-300" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex h-full overflow-hidden bg-[#0c0c15]"
      onTouchStart={handleSwipeTouchStart}
      onTouchEnd={handleSwipeTouchEnd}
    >
      {/* 소설 뷰어 - 모바일에서도 항상 렌더링 */}
      <div className="flex flex-col w-full md:w-[58%] md:border-r md:border-white/6 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          <NovelViewer
            novelId={novelId}
            novelInfo={novelInfo}
            progress={progress}
            onProgressChange={setProgress}
            onNavVisibilityChange={setNavVisible}
          />
        </div>
      </div>

      {/* 사이드 패널 - 모바일에서 absolute 오버레이, 우측 슬라이드 트랜지션 */}
      <div
        className={`
          absolute inset-0 z-30 md:relative md:inset-auto md:z-auto
          flex flex-col md:w-[42%] overflow-hidden
          transition-transform duration-300 ease-in-out
          ${mobileView === 'panel' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
      >
        <SidePanel
          novelId={novelId}
          progress={progress}
          onProgressChange={setProgress}
          onAiLoadingChange={setAiLoading}
          resetSignal={panelResetCount}
        />
      </div>

      {/* 모바일 하단 탭 네비게이션 */}
      <nav className={`md:hidden fixed bottom-0 inset-x-0 z-50 flex h-20 bg-[#0c0c15]/95 backdrop-blur-md transition-transform duration-300 ${navVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <button
          onClick={() => handleMobileViewChange('reader')}
          className={`flex-1 flex flex-col items-center justify-center gap-2 transition-colors ${
            mobileView === 'reader' ? 'text-indigo-400' : 'text-white/30'
          }`}
        >
          <BookOpen className="w-7 h-7" />
          <span className="text-base font-medium">읽기</span>
        </button>
        <button
          onClick={() => handleMobileViewChange('panel')}
          className={`flex-1 relative flex flex-col items-center justify-center gap-2 transition-colors ${
            mobileView === 'panel' ? 'text-indigo-400' : 'text-white/30'
          }`}
        >
          {aiLoading && mobileView === 'reader' && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg shadow-indigo-500/40">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>AI 분석 중</span>
            </div>
          )}
          <Sparkles className="w-7 h-7" />
          <span className="text-base font-medium">분석</span>
        </button>
      </nav>
    </div>
  )
}
