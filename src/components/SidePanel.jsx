import { useState, useEffect } from 'react'
import { Users, FileText, StickyNote, GitBranch, Sparkles, Loader2 } from 'lucide-react'
import CharacterTab from './tabs/CharacterTab'
import SummaryTab from './tabs/SummaryTab'
import MemoTab from './tabs/MemoTab'
import RelationTab from './tabs/RelationTab'

const TABS = [
  { id: 'character', label: '인물', Icon: Users },
  { id: 'summary', label: '요약', Icon: FileText },
  { id: 'memo', label: '메모', Icon: StickyNote },
  { id: 'relation', label: '관계도', Icon: GitBranch },
]

export default function SidePanel({ novelId, progress, onProgressChange, onAiLoadingChange, resetSignal }) {
  const [activeTab, setActiveTab] = useState('character')
  const [toast, setToast] = useState(false)

  useEffect(() => {
    setActiveTab('character')
  }, [resetSignal])

  const currentEpisode = progress?.currentEpisode ?? 1

  const handleAiUpdate = () => {
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  return (
    <div className="relative flex flex-col h-full bg-[#0f0f18] pb-20 md:pb-0">

      {/* 개발중 토스트 */}
      {toast && (
        <div className="absolute top-4 inset-x-4 z-50 flex items-center gap-3 bg-[#1e1c2e] border border-indigo-500/20 rounded-2xl px-4 py-3.5 shadow-2xl shadow-black/50">
          <span className="text-xl shrink-0">🚧</span>
          <div>
            <p className="text-sm font-semibold text-white/90">준비 중인 기능이에요</p>
            <p className="text-xs text-white/40 mt-0.5">AI 분석 서비스를 곧 만나보실 수 있어요</p>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 p-2 border-b border-white/6 shrink-0 bg-[#0c0c15]">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
              activeTab === id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* AI 업데이트 버튼 (메모 탭 제외) */}
      {activeTab !== 'memo' && (
        <div className="px-4 pt-3 pb-1 shrink-0">
          <button
            onClick={handleAiUpdate}
            className="w-full py-3 rounded-xl text-base font-medium transition-all duration-200 flex items-center justify-center gap-2
              bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
              text-white shadow-lg shadow-indigo-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI 업데이트</span>
          </button>
          {progress?.lastUpdatedEpisode != null && (
            <p className="text-[11px] text-white/25 text-center mt-1.5">
              마지막 업데이트: {progress.lastUpdatedEpisode}화
            </p>
          )}
        </div>
      )}

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'character' && (
          <CharacterTab novelId={novelId} aiVersion={0} />
        )}
        {activeTab === 'summary' && (
          <SummaryTab novelId={novelId} aiVersion={0} />
        )}
        {activeTab === 'memo' && (
          <MemoTab novelId={novelId} currentEpisode={currentEpisode} />
        )}
        {activeTab === 'relation' && (
          <RelationTab relations={progress?.relations} />
        )}
      </div>
    </div>
  )
}
