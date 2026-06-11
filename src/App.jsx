import { useState, useEffect } from 'react'
import { BookOpen, User, ChevronRight, Loader2 } from 'lucide-react'
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
          <div className="flex flex-col gap-3 w-96">
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
    <div className="flex h-screen overflow-hidden bg-[#0c0c15]">
      <div className="w-[58%] h-full overflow-hidden border-r border-white/[0.06]">
        <NovelViewer
          novelId={novelId}
          novelInfo={novelInfo}
          progress={progress}
          onProgressChange={setProgress}
        />
      </div>
      <div className="w-[42%] h-full overflow-hidden">
        <SidePanel
          novelId={novelId}
          progress={progress}
          onProgressChange={setProgress}
        />
      </div>
    </div>
  )
}
