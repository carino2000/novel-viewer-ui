import { useState, useEffect } from 'react'
import { Loader2, BookOpen, ChevronDown } from 'lucide-react'
import { apiFetch } from '../../api'

export default function SummaryTab({ novelId, aiVersion }) {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    if (!novelId) return
    setLoading(true)
    apiFetch(`/api/summary?novelId=${novelId}`)
      .then((data) => {
        const list = data ?? []
        setSummaries(list)
        // 가장 최신 요약(첫 번째)은 기본 펼침
        if (list.length > 0) setOpenId(list[0].summaryId)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [novelId, aiVersion])

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id))

  return (
    <div className="h-full overflow-y-auto px-4 pb-4 pt-3">
      {loading ? (
        <div className="flex items-center justify-center h-full gap-2 text-white/30">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-base">불러오는 중</span>
        </div>
      ) : summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-white/25 gap-2">
          <p className="text-base">저장된 요약이 없습니다.</p>
          <p className="text-sm">AI 업데이트 버튼을 눌러주세요.</p>
        </div>
      ) : (
        <div className="space-y-2">
        {summaries.map((s) => {
          const isOpen = openId === s.summaryId
          return (
            <div
              key={s.summaryId}
              className="bg-[#16161f] border border-white/6 rounded-2xl overflow-hidden transition-all duration-200"
            >
              {/* 헤더 — 항상 표시 */}
              <button
                onClick={() => toggle(s.summaryId)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-base text-white/70 font-medium">
                    {s.episodeNumber}화 요약
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* 본문 — 펼쳤을 때만 */}
              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-white/6">
                  <p className="text-white/75 text-base leading-[1.95] whitespace-pre-line">
                    {s.summaryText}
                  </p>
                </div>
              )}
            </div>
          )
        })}
        </div>
      )}
    </div>
  )
}
