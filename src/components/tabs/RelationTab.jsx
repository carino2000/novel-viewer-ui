import { useState } from 'react'
import { Search, X, ArrowRight } from 'lucide-react'

const RELATION_STYLES = [
  { keywords: ['동료', '동기', '친구', '우호'], style: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  { keywords: ['적대', '라이벌', '적', '원수'], style: 'bg-red-500/15 text-red-300 border-red-500/25' },
  { keywords: ['악연', '앙숙'],                 style: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  { keywords: ['스승', '제자', '사제'],         style: 'bg-violet-500/15 text-violet-300 border-violet-500/25' },
  { keywords: ['연인', '애인', '짝사랑'],       style: 'bg-pink-500/15 text-pink-300 border-pink-500/25' },
]

function getRelationStyle(relation) {
  if (!relation) return 'bg-white/5 text-white/40 border-white/10'
  for (const { keywords, style } of RELATION_STYLES) {
    if (keywords.some((k) => relation.includes(k))) return style
  }
  return 'bg-white/5 text-white/40 border-white/10'
}

function initial(name) {
  return name?.[0] ?? '?'
}

export default function RelationTab({ relations }) {
  const [query, setQuery] = useState('')

  const filtered = (relations ?? []).filter(
    (r) => !query || r.from.includes(query) || r.to.includes(query) || r.relation.includes(query)
  )

  return (
    <div className="flex flex-col h-full">
      {/* 검색바 */}
      <div className="px-4 py-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input
            type="text"
            placeholder="인물명 또는 관계 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/4 border border-white/8 hover:border-white/15 focus:border-indigo-500/50 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder:text-white/25 outline-none transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 관계 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {!relations ? (
          <div className="flex flex-col items-center justify-center h-full text-white/25 gap-1.5">
            <p className="text-sm">아직 관계 정보가 없습니다.</p>
            <p className="text-xs">AI 업데이트 버튼을 눌러주세요.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/25">
            <p className="text-sm">
              {query ? `"${query}" 검색 결과 없음` : '관계 정보가 없습니다.'}
            </p>
          </div>
        ) : (
          <>
            {query && (
              <p className="text-[11px] text-white/25 px-1 pb-1">{filtered.length}건 검색됨</p>
            )}
            {filtered.map((rel, i) => (
              <div
                key={i}
                className="bg-[#16161f] border border-white/6 hover:border-white/10 rounded-xl p-3.5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {/* from 아바타 */}
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <span className="text-indigo-300 text-xs font-bold">{initial(rel.from)}</span>
                  </div>

                  <span className="text-white text-sm font-semibold">{rel.from}</span>

                  <ArrowRight className="w-3.5 h-3.5 text-white/20 shrink-0" />

                  {/* to 아바타 */}
                  <div className="w-8 h-8 rounded-lg bg-slate-600/20 border border-slate-500/20 flex items-center justify-center shrink-0">
                    <span className="text-slate-300 text-xs font-bold">{initial(rel.to)}</span>
                  </div>

                  <span className="text-white text-sm font-semibold">{rel.to}</span>

                  <span
                    className={`ml-auto text-[11px] px-2 py-0.5 rounded-full font-medium border shrink-0 ${getRelationStyle(rel.relation)}`}
                  >
                    {rel.relation}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
