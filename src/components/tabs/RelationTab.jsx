import { useState } from 'react'
import { Search, X, ArrowRight, List, GitBranch } from 'lucide-react'

const RELATION_STYLES = [
  { keywords: ['동료', '동기', '친구', '우호'], style: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  { keywords: ['적대', '라이벌', '적', '원수'], style: 'bg-red-500/15 text-red-300 border-red-500/25' },
  { keywords: ['악연', '앙숙'],                 style: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  { keywords: ['스승', '제자', '사제'],         style: 'bg-violet-500/15 text-violet-300 border-violet-500/25' },
  { keywords: ['연인', '애인', '짝사랑'],       style: 'bg-pink-500/15 text-pink-300 border-pink-500/25' },
]

const EDGE_COLORS = {
  동료: '#60a5fa', 동기: '#60a5fa', 친구: '#60a5fa', 우호: '#60a5fa',
  적대: '#f87171', 라이벌: '#f87171', 적: '#f87171', 원수: '#f87171',
  악연: '#fbbf24', 앙숙: '#fbbf24',
  스승: '#a78bfa', 제자: '#a78bfa', 사제: '#a78bfa',
  연인: '#f472b6', 애인: '#f472b6', 짝사랑: '#f472b6',
}

function getRelationStyle(relation) {
  if (!relation) return 'bg-white/5 text-white/40 border-white/10'
  for (const { keywords, style } of RELATION_STYLES) {
    if (keywords.some(k => relation.includes(k))) return style
  }
  return 'bg-white/5 text-white/40 border-white/10'
}

function getEdgeColor(relation) {
  if (!relation) return '#6b7280'
  for (const [kw, color] of Object.entries(EDGE_COLORS)) {
    if (relation.includes(kw)) return color
  }
  return '#6b7280'
}

function RelationGraph({ relations }) {
  const [selected, setSelected] = useState(null)

  const chars = [...new Set(relations.flatMap(r => [r.from, r.to]))]
  const n = chars.length

  if (n === 0) return (
    <p className="text-center text-white/25 text-sm py-10">관계 정보가 없습니다.</p>
  )

  const W = 320, H = 300
  const cx = W / 2, cy = H / 2
  const R = n === 1 ? 0 : Math.min(cx, cy) - 52
  const NODE_R = 19

  const pos = {}
  chars.forEach((name, i) => {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2
    pos[name] = {
      x: n === 1 ? cx : cx + R * Math.cos(angle),
      y: n === 1 ? cy : cy + R * Math.sin(angle),
    }
  })

  const selectedRels = selected
    ? relations.filter(r => r.from === selected || r.to === selected)
    : []

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs mx-auto block">
        {/* 엣지 */}
        {relations.map((rel, i) => {
          const from = pos[rel.from]
          const to = pos[rel.to]
          if (!from || !to) return null

          const color = getEdgeColor(rel.relation)
          const active = !selected || rel.from === selected || rel.to === selected

          /* 베지어 제어점: 중심 방향으로 약간 굽힘 */
          const mx = (from.x + to.x) / 2
          const my = (from.y + to.y) / 2
          const dx = cx - mx
          const dy = cy - my
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          const qx = mx + (dx / len) * 22
          const qy = my + (dy / len) * 22

          return (
            <path
              key={i}
              d={`M${from.x},${from.y} Q${qx},${qy} ${to.x},${to.y}`}
              stroke={color}
              strokeWidth={active ? 2 : 1}
              fill="none"
              opacity={active ? 0.7 : 0.07}
              className="transition-all duration-200"
            />
          )
        })}

        {/* 노드 */}
        {chars.map(name => {
          const { x, y } = pos[name]
          const isSel = selected === name
          const isConn = !selected || selected === name ||
            relations.some(r =>
              (r.from === selected && r.to === name) ||
              (r.to === selected && r.from === name)
            )

          return (
            <g
              key={name}
              onClick={() => setSelected(isSel ? null : name)}
              style={{ cursor: 'pointer', opacity: isConn ? 1 : 0.2 }}
              className="transition-all duration-200"
            >
              <circle
                cx={x} cy={y} r={isSel ? NODE_R + 4 : NODE_R}
                fill={isSel ? '#4f46e5' : '#1e1c2e'}
                stroke={isSel ? '#818cf8' : '#3d3a55'}
                strokeWidth={isSel ? 2.5 : 1.5}
                className="transition-all duration-200"
              />
              <text
                x={x} y={y}
                textAnchor="middle" dominantBaseline="central"
                fill={isSel ? '#ffffff' : '#a5b4fc'}
                fontSize={12} fontWeight="700"
                fontFamily="Pretendard, sans-serif"
              >
                {name[0]}
              </text>
              <text
                x={x} y={y + NODE_R + 12}
                textAnchor="middle"
                fill={isSel ? '#c7d2fe' : '#6b7280'}
                fontSize={9.5}
                fontFamily="Pretendard, sans-serif"
              >
                {name.length > 5 ? name.slice(0, 4) + '…' : name}
              </text>
            </g>
          )
        })}
      </svg>

      {/* 선택된 인물의 관계 상세 */}
      {selected && selectedRels.length > 0 && (
        <div className="mx-4 mt-1 space-y-1.5">
          {selectedRels.map((rel, i) => {
            const other = rel.from === selected ? rel.to : rel.from
            const isOut = rel.from === selected
            const color = getEdgeColor(rel.relation)
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 bg-white/3 border border-white/6 rounded-xl px-3.5 py-2.5"
              >
                <span className="text-sm font-semibold text-white/85 truncate">{other}</span>
                <span className="text-white/20 text-xs shrink-0">{isOut ? '→' : '←'}</span>
                <span
                  className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0"
                  style={{ color, backgroundColor: color + '22' }}
                >
                  {rel.relation}
                </span>
              </div>
            )
          })}
          <p className="text-center text-[10px] text-white/15 pb-1">
            같은 인물을 다시 탭하면 해제됩니다
          </p>
        </div>
      )}
    </div>
  )
}

export default function RelationTab({ relations }) {
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState('list')

  const filtered = (relations ?? []).filter(
    r => !query || r.from.includes(query) || r.to.includes(query) || r.relation.includes(query)
  )

  if (!relations) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/25 gap-2">
        <p className="text-base">아직 관계 정보가 없습니다.</p>
        <p className="text-sm">AI 업데이트 버튼을 눌러주세요.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 검색바 + 뷰 토글 */}
      <div className="px-4 py-2 shrink-0 flex gap-2">
        {viewMode === 'list' && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              type="text"
              placeholder="인물명 또는 관계 검색..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-white/4 border border-white/8 hover:border-white/15 focus:border-indigo-500/50 rounded-xl pl-10 pr-9 py-2.5 text-base text-white placeholder:text-white/25 outline-none transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        {viewMode === 'graph' && <div className="flex-1" />}

        <div className="flex rounded-xl overflow-hidden border border-white/8 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2.5 transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-white/35 hover:text-white/60'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-2.5 transition-colors ${viewMode === 'graph' ? 'bg-indigo-600 text-white' : 'text-white/35 hover:text-white/60'}`}
          >
            <GitBranch className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {viewMode === 'graph' ? (
          <div className="pt-2 pb-6">
            <RelationGraph relations={relations} />
          </div>
        ) : (
          <div className="px-4 pb-4 space-y-2">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-white/25">
                <p className="text-base">
                  {query ? `"${query}" 검색 결과 없음` : '관계 정보가 없습니다.'}
                </p>
              </div>
            ) : (
              <>
                {query && (
                  <p className="text-xs text-white/25 px-1 pb-1">{filtered.length}건 검색됨</p>
                )}
                {filtered.map((rel, i) => (
                  <div
                    key={i}
                    className="bg-[#16161f] border border-white/6 hover:border-white/10 rounded-xl p-4 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <span className="text-indigo-300 text-sm font-bold">{rel.from[0]}</span>
                      </div>
                      <span className="text-white text-base font-semibold">{rel.from}</span>
                      <ArrowRight className="w-4 h-4 text-white/20 shrink-0" />
                      <div className="w-9 h-9 rounded-lg bg-slate-600/20 border border-slate-500/20 flex items-center justify-center shrink-0">
                        <span className="text-slate-300 text-sm font-bold">{rel.to[0]}</span>
                      </div>
                      <span className="text-white text-base font-semibold">{rel.to}</span>
                      <span
                        className={`ml-auto text-sm px-3 py-1 rounded-full font-medium border shrink-0 ${getRelationStyle(rel.relation)}`}
                      >
                        {rel.relation}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
