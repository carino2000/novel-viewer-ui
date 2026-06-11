import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Loader2, BookOpen } from 'lucide-react'
import { apiFetch } from '../../api'

export default function SummaryTab({ novelId, currentEpisode, aiVersion }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [targetEpisode, setTargetEpisode] = useState(null)

  // 기본: 직전 화 요약
  useEffect(() => {
    setTargetEpisode(currentEpisode > 1 ? currentEpisode - 1 : null)
  }, [currentEpisode])

  useEffect(() => {
    if (!novelId || !targetEpisode) {
      setSummary(null)
      setLoading(false)
      return
    }
    setLoading(true)
    apiFetch(`/api/summary?novelId=${novelId}&episodeNumber=${targetEpisode}`)
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [novelId, targetEpisode, aiVersion])

  const canGoPrev = targetEpisode > 1
  const canGoNext = targetEpisode < currentEpisode - 1

  return (
    <div className="flex flex-col h-full">
      {/* 화 번호 네비게이터 */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <button
          onClick={() => setTargetEpisode((e) => Math.max(1, e - 1))}
          disabled={!targetEpisode || !canGoPrev}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          {targetEpisode ? (
            <>
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-white/60">{targetEpisode}화 요약</span>
            </>
          ) : (
            <span className="text-white/25 text-xs">화 선택</span>
          )}
        </div>

        <button
          onClick={() => setTargetEpisode((e) => e + 1)}
          disabled={!targetEpisode || !canGoNext}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-full gap-2 text-white/30">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">불러오는 중</span>
          </div>
        ) : !targetEpisode ? (
          <div className="flex flex-col items-center justify-center h-full text-white/25 gap-1.5">
            <p className="text-sm">첫 번째 화입니다.</p>
            <p className="text-xs">직전 에피소드 요약이 없습니다.</p>
          </div>
        ) : summary ? (
          <div className="bg-[#16161f] border border-white/6 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-white/6">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-xs text-white/40 font-medium">
                {targetEpisode}화 · AI 요약
              </span>
            </div>
            <p className="text-white/70 text-sm leading-[1.9] whitespace-pre-line">
              {summary.summaryText}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white/25 gap-1.5">
            <p className="text-sm">{targetEpisode}화 요약이 없습니다.</p>
            <p className="text-xs">AI 업데이트 버튼을 눌러주세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
