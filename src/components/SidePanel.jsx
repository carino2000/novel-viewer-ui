import { useState, useEffect } from 'react'
import { Users, FileText, StickyNote, GitBranch, Sparkles, Loader2 } from 'lucide-react'
import CharacterTab from './tabs/CharacterTab'
import SummaryTab from './tabs/SummaryTab'
import MemoTab from './tabs/MemoTab'
import RelationTab from './tabs/RelationTab'
import { apiFetch } from '../api'

const TABS = [
  { id: 'character', label: '인물', Icon: Users },
  { id: 'summary', label: '요약', Icon: FileText },
  { id: 'memo', label: '메모', Icon: StickyNote },
  { id: 'relation', label: '관계도', Icon: GitBranch },
]

export default function SidePanel({ novelId, progress, onProgressChange, onAiLoadingChange, resetSignal }) {
  const [activeTab, setActiveTab] = useState('character')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiVersion, setAiVersion] = useState(0)

  useEffect(() => {
    setActiveTab('character')
  }, [resetSignal])

  const currentEpisode = progress?.currentEpisode ?? 1

  const setAiLoadingBoth = (val) => {
    setAiLoading(val)
    onAiLoadingChange?.(val)
  }

  const handleAiUpdate = async () => {
    if (aiLoading) return
    setAiLoadingBoth(true)
    try {
      await apiFetch(`/api/ai/update?novelId=${novelId}`, { method: 'POST' })
      const newProgress = await apiFetch(`/api/reading-progress?novelId=${novelId}`)
      onProgressChange(newProgress)
      setAiVersion((v) => v + 1)
    } catch (e) {
      alert(`AI 업데이트 실패: ${e.message}`)
    } finally {
      setAiLoadingBoth(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f18] pb-20 md:pb-0">
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
            disabled={aiLoading}
            className="w-full py-3 rounded-xl text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed
              bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
              disabled:from-indigo-800 disabled:to-violet-800 disabled:text-white/40
              text-white shadow-lg shadow-indigo-500/20"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI 분석 중... (최대 60초)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>AI 업데이트</span>
              </>
            )}
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
          <CharacterTab novelId={novelId} aiVersion={aiVersion} />
        )}
        {activeTab === 'summary' && (
          <SummaryTab
            novelId={novelId}
            aiVersion={aiVersion}
          />
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
