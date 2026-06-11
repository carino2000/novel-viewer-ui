import { ArrowLeft, ChevronRight, Loader2, Search, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../api";

function rankStyle(rank) {
  if (!rank) return 'bg-white/5 text-white/40 border-white/10'
  const r = rank.toUpperCase()
  if (r.includes('EX')) {
    if (r.includes('PLUS'))  return 'bg-red-500/25 text-red-200 border-red-400/40 shadow-sm shadow-red-500/20'
    if (r.includes('ZERO'))  return 'bg-orange-500/20 text-orange-300 border-orange-500/35'
    return 'bg-amber-500/20 text-amber-200 border-amber-400/40 shadow-sm shadow-amber-500/20'
  }
  if (r.startsWith('S')) {
    if (r.includes('PLUS'))  return 'bg-amber-600/20 text-amber-300 border-amber-500/35'
    return 'bg-violet-500/20 text-violet-300 border-violet-500/30'
  }
  if (r.startsWith('A')) {
    const plusCount = (r.match(/PLUS/g) ?? []).length
    if (plusCount >= 3) return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    if (plusCount === 2) return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    if (plusCount === 1) return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    return 'bg-sky-500/15 text-sky-300 border-sky-500/25'
  }
  return 'bg-slate-500/15 text-slate-400 border-slate-500/20'
}

function AbilityBadge({ item }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${rankStyle(item.rank)}`}>
      {item.name}
      <span className="opacity-60 text-[11px]">{item.rank}</span>
    </span>
  )
}

function AbilityRow({ label, items, labelClass = "text-white/30" }) {
  if (!items?.length) return null
  return (
    <div className="flex items-start gap-2.5">
      <span className={`text-xs ${labelClass} uppercase tracking-widest shrink-0 pt-0.5 w-7`}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => <AbilityBadge key={i} item={item} />)}
      </div>
    </div>
  )
}

function StatGrid({ stats }) {
  if (!stats) return null
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(stats).map(([key, val]) => (
        <div key={key} className="bg-white/3 rounded-xl p-3 text-center">
          <p className="text-xs text-white/30 mb-1">{key}</p>
          <p className="text-base font-bold text-white">{val ?? "—"}</p>
        </div>
      ))}
    </div>
  )
}

function CharacterDetail({ char, onBack }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-white/40 text-sm">인물 목록</span>
        <ChevronRight className="w-3.5 h-3.5 text-white/20" />
        <span className="text-white text-base font-medium">{char.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">{char.name}</h2>
            {char.abilities?.className && (
              <p className="text-indigo-400 text-base mt-1">{char.abilities.className}</p>
            )}
          </div>
          <span className="text-sm text-white/25 bg-white/5 px-3 py-1.5 rounded-full">
            {char.firstAppearedAt}화 등장
          </span>
        </div>

        {char.abilities?.alignment && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30 uppercase tracking-widest">Alignment</span>
            <span className="text-sm text-white/60 bg-white/5 px-2.5 py-1 rounded-full">
              {char.abilities.alignment}
            </span>
          </div>
        )}

        <div className="bg-white/3 rounded-xl p-4">
          <p className="text-white/65 text-base leading-relaxed">{char.description}</p>
        </div>

        {char.stats && (
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2.5">Stats</p>
            <StatGrid stats={char.stats} />
          </div>
        )}

        {char.abilities && (
          <div className="space-y-3">
            <p className="text-xs text-white/30 uppercase tracking-widest">Abilities</p>
            <AbilityRow label="고유" items={char.abilities["고유"]} />
            <AbilityRow label="특수" items={char.abilities["특수"]} />
            <AbilityRow label="잠재" items={char.abilities["잠재"]} />
          </div>
        )}
      </div>
    </div>
  )
}

function CharacterCard({ char, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-[#16161f] hover:bg-[#1c1c2a] border border-white/6 hover:border-indigo-500/30 rounded-xl p-4 text-left transition-all duration-150 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <span className="text-indigo-300 text-base font-bold">{char.name?.[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white text-base font-semibold">{char.name}</span>
            {char.abilities?.className && (
              <span className="text-xs text-indigo-400/70 bg-indigo-500/10 px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {char.abilities.className}
              </span>
            )}
          </div>
          <p className="text-white/35 text-sm mt-0.5 truncate">{char.description}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-white/20">{char.firstAppearedAt}화</span>
          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
    </button>
  )
}

function SearchResultCard({ char, onClick }) {
  const hasAbilities =
    char.abilities &&
    (char.abilities["고유"]?.length || char.abilities["특수"]?.length || char.abilities["잠재"]?.length)

  return (
    <button
      onClick={onClick}
      className="w-full bg-[#16161f] hover:bg-[#1c1c2a] border border-white/6 hover:border-indigo-500/40 rounded-xl p-4 text-left transition-all duration-150 group"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <span className="text-indigo-300 text-sm font-bold">{char.name?.[0]}</span>
        </div>
        <span className="text-white text-base font-semibold">{char.name}</span>
        {char.abilities?.className && (
          <span className="text-xs text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 rounded-full ml-auto">
            {char.abilities.className}
          </span>
        )}
      </div>

      {hasAbilities ? (
        <div className="space-y-2 pl-10">
          <AbilityRow label="고유" items={char.abilities["고유"]} />
          <AbilityRow label="특수" items={char.abilities["특수"]} />
          <AbilityRow label="잠재" items={char.abilities["잠재"]} />
        </div>
      ) : (
        <p className="text-white/30 text-sm truncate pl-10">{char.description}</p>
      )}
    </button>
  )
}

const GROUP_STYLE = {
  이름:    'text-white/50',
  클래스:  'text-indigo-400/70',
  고유능력: 'text-amber-400/70',
  특수능력: 'text-orange-400/70',
  잠재능력: 'text-blue-400/70',
}

export default function CharacterTab({ novelId, aiVersion }) {
  const [characters, setCharacters] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!novelId) return
    setListLoading(true)
    setSelected(null)
    apiFetch(`/api/character?novelId=${novelId}`)
      .then(setCharacters)
      .catch(console.error)
      .finally(() => setListLoading(false))
  }, [novelId, aiVersion])

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null)
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    const timer = setTimeout(() => {
      apiFetch(`/api/character/search?novelId=${novelId}&keyword=${encodeURIComponent(query)}`)
        .then((data) => {
          setSearchResults(data && typeof data === 'object' && !Array.isArray(data) ? data : {})
        })
        .catch(() => setSearchResults({}))
        .finally(() => setSearchLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query, novelId])

  if (selected) {
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden">
        <CharacterDetail char={selected} onBack={() => setSelected(null)} />
      </div>
    )
  }

  const isSearching = query.trim().length > 0
  const isLoading = isSearching ? searchLoading : listLoading
  const searchGroups = searchResults
    ? Object.entries(searchResults).filter(([, chars]) => Array.isArray(chars) && chars.length > 0)
    : []
  const totalSearchCount = searchGroups.reduce((sum, [, chars]) => sum + chars.length, 0)
  const hasSearchResults = searchGroups.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* 검색바 */}
      <div className="px-4 py-2 shrink-0">
        <div className="relative">
          {searchLoading ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          )}
          <input
            type="text"
            placeholder="이름, 클래스, 능력 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/4 border border-white/8 hover:border-white/15 focus:border-indigo-500/50 rounded-xl pl-10 pr-9 py-2.5 text-base text-white placeholder:text-white/25 outline-none transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {isSearching && !searchLoading && searchResults !== null && (
          <p className="text-xs text-white/25 mt-1.5 px-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-indigo-400/60" />
            {totalSearchCount}건 검색됨
          </p>
        )}
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full gap-2 text-white/30">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-base">{isSearching ? "검색 중" : "불러오는 중"}</span>
          </div>

        ) : isSearching ? (
          !hasSearchResults ? (
            <div className="flex items-center justify-center h-full text-white/25">
              <p className="text-base">"{query}" 검색 결과 없음</p>
            </div>
          ) : (
            <div className="space-y-1 pt-1">
              {searchGroups.map(([group, chars]) => (
                <div key={group}>
                  <p className={`text-xs uppercase tracking-widest px-1 pt-3 pb-2 ${GROUP_STYLE[group] ?? 'text-white/30'}`}>
                    {group}
                  </p>
                  <div className="space-y-2">
                    {chars.map((char) => (
                      <SearchResultCard
                        key={char.characterId}
                        char={char}
                        onClick={() => setSelected(char)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )

        ) : (
          characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/25 gap-2">
              <p className="text-base">인물 정보가 없습니다.</p>
              <p className="text-sm">AI 업데이트 버튼을 눌러주세요.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-5 px-2">
              <div className="flex flex-col items-center gap-2.5 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Search className="w-6 h-6 text-indigo-400/60" />
                </div>
                <p className="text-white/70 text-base font-medium">
                  총 {characters.length}명의 인물
                </p>
                <p className="text-white/25 text-sm leading-relaxed">
                  이름, 클래스, 능력으로 검색하세요
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {['이름', '클래스', '고유능력', '특수능력', '잠재능력'].map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs px-2.5 py-1 rounded-full border ${GROUP_STYLE[tag] ?? 'text-white/30'} bg-white/3 border-white/8`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
