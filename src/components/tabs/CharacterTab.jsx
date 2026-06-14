import { ArrowLeft, ChevronRight, Loader2, Search, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../api";

function rankStyle(rank) {
  if (!rank) return "bg-white/5 text-white/40 border-white/10";
  const r = rank.toUpperCase();
  if (r.includes("EX")) {
    if (r.includes("PLUS"))
      return "bg-red-500/25 text-red-200 border-red-400/40 shadow-sm shadow-red-500/20";
    if (r.includes("ZERO"))
      return "bg-orange-500/20 text-orange-300 border-orange-500/35";
    return "bg-amber-500/20 text-amber-200 border-amber-400/40 shadow-sm shadow-amber-500/20";
  }
  if (r.startsWith("S")) {
    if (r.includes("PLUS"))
      return "bg-amber-600/20 text-amber-300 border-amber-500/35";
    return "bg-violet-500/20 text-violet-300 border-violet-500/30";
  }
  if (r.startsWith("A")) {
    const plusCount = (r.match(/PLUS/g) ?? []).length;
    if (plusCount >= 3)
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    if (plusCount === 2)
      return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
    if (plusCount === 1)
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    return "bg-sky-500/15 text-sky-300 border-sky-500/25";
  }
  return "bg-slate-500/15 text-slate-400 border-slate-500/20";
}

function AbilityBadge({ item }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${rankStyle(item.rank)}`}
    >
      {item.name}
      <span className="opacity-60 text-[11px]">{item.rank}</span>
    </span>
  );
}

function AbilityRow({ label, items, labelClass = "text-white/30" }) {
  if (!items?.length) return null;
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`text-xs ${labelClass} uppercase tracking-widest shrink-0 pt-0.5 w-7`}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <AbilityBadge key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

const STAT_KEYS = ["근력", "내구", "민첩", "체력", "마력", "행운"];

function SectionHeader({ title, sub }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <span className="text-white/25 text-sm font-mono leading-none">{"<"}</span>
      <span className="text-sm text-white/55 tracking-widest font-semibold">{title}</span>
      {sub && <span className="text-sm text-white/30">({sub})</span>}
      <span className="text-white/25 text-sm font-mono leading-none">{">"}</span>
    </div>
  );
}

function AbilityList({ items }) {
  if (!items?.length) return null;
  return (
    <div className="bg-[#16161f] rounded-xl overflow-hidden border border-white/6 divide-y divide-white/4">
      {items.map((item, i) => (
        <div key={i} className="flex items-center px-4 py-3 gap-3">
          <span className="text-sm text-white/20 w-5 text-right shrink-0 tabular-nums">{i + 1}.</span>
          <span className="text-base text-white/75 flex-1">{item.name}</span>
          <span className={`text-sm px-2.5 py-0.5 rounded-full border font-medium ${rankStyle(item.rank)}`}>
            {item.rank}
          </span>
        </div>
      ))}
    </div>
  );
}

// 공백 뒤 ( 기준으로 본문/영문 부제 분리 ("검술 전문가 (Sword...)" → main + sub)
function splitAtParen(text) {
  if (!text || text === "-") return { main: text, sub: null };
  const idx = text.indexOf(" (");
  if (idx === -1) return { main: text, sub: null };
  return { main: text.slice(0, idx).trim(), sub: text.slice(idx + 1).trim() };
}

function CharacterDetail({ char, onBack }) {
  const ab = char.abilities ?? {};
  const dash = (val) =>
    val !== undefined && val !== null && val !== "" ? String(val) : "-";

  // 2열 그리드 — 레이블이 값 위에 위치
  const infoCells = [
    [["소속 국가", dash(ab.nation)], ["소속 단체", dash(ab.clan)]],
    [["진명 · 국적", dash(ab.trueName)], ["성향", dash(ab.alignment)]],
    [
      ["성별", dash(ab.sex)],
      ["신장 · 체중", ab.height || ab.weight ? `${dash(ab.height)} · ${dash(ab.weight)}` : "-"],
    ],
  ];

  const 고유 = ab["고유"] ?? [];
  const 특수 = ab["특수"] ?? [];
  const 잠재 = ab["잠재"] ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* 네비 헤더 */}
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

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* 인물 헤더 */}
        <div className="px-5 pt-5 pb-4 border-b border-white/4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-2xl font-bold text-white">{char.name}</h2>
              {ab.className && (() => {
                const { main, sub } = splitAtParen(ab.className);
                return (
                  <div className="inline-block mt-2 text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-2.5 py-1.5 rounded-xl">
                    <p className="text-sm font-medium leading-snug">{main}</p>
                    {sub && <p className="text-xs text-indigo-300/60 mt-0.5">{sub}</p>}
                  </div>
                );
              })()}
            </div>
            <span className="text-xs text-white/25 bg-white/4 border border-white/6 px-2.5 py-1 rounded-full shrink-0 mt-1">
              {char.firstAppearedAt}화 첫 등장
            </span>
          </div>
          <p className="text-white/50 text-base leading-relaxed">{char.description}</p>
        </div>

        <div className="px-4 pt-5 pb-12 space-y-5">
          {/* 사용자 정보 */}
          <div>
            <SectionHeader title="사용자 정보" sub="Player Status" />
            <div className="bg-[#16161f] rounded-xl overflow-hidden border border-white/6">
              {infoCells.map((row, ri) => (
                <div
                  key={ri}
                  className={`grid grid-cols-2 ${ri < infoCells.length - 1 ? "border-b border-white/4" : ""}`}
                >
                  {row.map(([label, value], ci) => {
                    const { main, sub } = splitAtParen(value);
                    return (
                      <div
                        key={ci}
                        className={`px-4 py-3 ${ci === 0 ? "border-r border-white/4" : ""}`}
                      >
                        <p className="text-xs text-white/30 uppercase tracking-wide mb-1">{label}</p>
                        <p className={`text-base font-medium leading-snug ${value === "-" ? "text-white/20" : "text-white/85"}`}>
                          {main}
                          {sub && <span className="block text-sm opacity-55 mt-0.5">{sub}</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/15 text-right mt-1.5 pr-1">
              {char.lastUpdatedAt}화 기준 업데이트
            </p>
          </div>

          {/* 능력치 */}
          <div>
            <SectionHeader title="능력치" />
            <div className="grid grid-cols-3 gap-2">
              {STAT_KEYS.map((k) => {
                const v = char.stats?.[k];
                return (
                  <div key={k} className="bg-[#16161f] border border-white/6 rounded-xl p-3 text-center">
                    <p className="text-xs text-white/30 uppercase tracking-wide mb-1">{k}</p>
                    <p className={`text-base font-bold ${v ? "text-white" : "text-white/20"}`}>
                      {v || "-"}
                    </p>
                  </div>
                );
              })}
            </div>
            {!char.stats && (
              <p className="text-xs text-white/25 text-center mt-2">AI 업데이트 후 표시됩니다</p>
            )}
          </div>

          {/* 고유 능력 */}
          {고유.length > 0 && (
            <div>
              <SectionHeader title="고유 능력" sub={`${고유.length}/${고유.length}`} />
              <AbilityList items={고유} />
            </div>
          )}

          {/* 특수 능력 */}
          {특수.length > 0 && (
            <div>
              <SectionHeader title="특수 능력" sub={`${특수.length}/${특수.length}`} />
              <AbilityList items={특수} />
            </div>
          )}

          {/* 잠재 능력 */}
          {잠재.length > 0 && (
            <div>
              <SectionHeader title="잠재 능력" sub={`${잠재.length}/${잠재.length}`} />
              <AbilityList items={잠재} />
            </div>
          )}

          {!char.abilities && (
            <p className="text-xs text-white/25 text-center py-2">
              AI 업데이트 후 능력 정보가 표시됩니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CharacterCard({ char, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-[#16161f] hover:bg-[#1c1c2a] border border-white/6 hover:border-indigo-500/30 rounded-xl p-4 text-left transition-all duration-150 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <span className="text-indigo-300 text-base font-bold">
            {char.name?.[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white text-base font-semibold">
              {char.name}
            </span>
            {char.abilities?.className && (
              <span className="text-xs text-indigo-400/70 bg-indigo-500/10 px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {char.abilities.className}
              </span>
            )}
          </div>
          <p className="text-white/35 text-sm mt-0.5 truncate">
            {char.description}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-white/20">
            {char.firstAppearedAt}화
          </span>
          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
    </button>
  );
}

function SearchResultCard({ char, onClick }) {
  const hasAbilities =
    char.abilities &&
    (char.abilities["고유"]?.length ||
      char.abilities["특수"]?.length ||
      char.abilities["잠재"]?.length);

  return (
    <button
      onClick={onClick}
      className="w-full bg-[#16161f] hover:bg-[#1c1c2a] border border-white/6 hover:border-indigo-500/40 rounded-xl p-4 text-left transition-all duration-150 group"
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <span className="text-indigo-300 text-sm font-bold">
            {char.name?.[0]}
          </span>
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
        <p className="text-white/30 text-sm truncate pl-10">
          {char.description}
        </p>
      )}
    </button>
  );
}

const GROUP_STYLE = {
  이름: "text-white/50",
  클래스: "text-indigo-400/70",
  고유능력: "text-amber-400/70",
  특수능력: "text-orange-400/70",
  잠재능력: "text-blue-400/70",
};

/* ── 최근 본 인물 카드 (이름 + 클래스만) ─────────────────── */
function RecentCard({ char, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-[#16161f] hover:bg-[#1c1c2a] border border-white/6 hover:border-indigo-500/30 rounded-xl p-3.5 text-left transition-all duration-150 group flex items-center gap-3"
    >
      <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
        <span className="text-indigo-300 text-sm font-bold">{char.name?.[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-base font-semibold">{char.name}</p>
        {char.abilities?.className && (
          <p className="text-indigo-400/70 text-sm mt-0.5">{char.abilities.className}</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-indigo-400 transition-colors shrink-0" />
    </button>
  );
}

const recentKey = (novelId) => `nv-recent-chars-${novelId}`;

function loadRecent(novelId) {
  try { return JSON.parse(localStorage.getItem(recentKey(novelId)) ?? "[]"); }
  catch { return []; }
}

function saveRecent(novelId, char) {
  const list = loadRecent(novelId).filter((c) => c.characterId !== char.characterId);
  list.unshift(char);
  localStorage.setItem(recentKey(novelId), JSON.stringify(list.slice(0, 10)));
}

export default function CharacterTab({ novelId, aiVersion }) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [recentChars, setRecentChars] = useState([]);

  // 소설 변경 시 초기화
  useEffect(() => {
    if (!novelId) return;
    setSelected(null);
    setQuery("");
    setSearchResults(null);
    setRecentChars(loadRecent(novelId));
  }, [novelId]);

  // AI 업데이트 완료 시 보고 있던 캐릭터 상세 갱신
  useEffect(() => {
    if (!novelId || aiVersion === 0 || !selected) return;
    apiFetch(`/api/character/${selected.characterId}`)
      .then((updated) => {
        setSelected(updated);
        const updatedRecent = loadRecent(novelId).map(
          (rc) => rc.characterId === updated.characterId ? updated : rc
        );
        localStorage.setItem(recentKey(novelId), JSON.stringify(updatedRecent));
        setRecentChars(updatedRecent);
      })
      .catch(console.error);
  }, [aiVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // 검색 디바운스
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(() => {
      apiFetch(`/api/character/search?novelId=${novelId}&keyword=${encodeURIComponent(query)}`)
        .then((data) => {
          setSearchResults(data && typeof data === "object" && !Array.isArray(data) ? data : {});
        })
        .catch(() => setSearchResults({}))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, novelId]);

  const handleSelectChar = async (char) => {
    setDetailLoading(true);
    try {
      const detail = await apiFetch(`/api/character/${char.characterId}`);
      saveRecent(novelId, detail);
      setRecentChars(loadRecent(novelId));
      setSelected(detail);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const clearRecent = () => {
    localStorage.removeItem(recentKey(novelId));
    setRecentChars([]);
  };

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-white/30">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-base">불러오는 중</span>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden">
        <CharacterDetail char={selected} onBack={() => setSelected(null)} />
      </div>
    );
  }

  const isSearching = query.trim().length > 0;
  const searchGroups = searchResults
    ? Object.entries(searchResults).filter(([, chars]) => Array.isArray(chars) && chars.length > 0)
    : [];
  const totalSearchCount = searchGroups.reduce((sum, [, chars]) => sum + chars.length, 0);
  const hasSearchResults = searchGroups.length > 0;

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
        {searchLoading ? (
          <div className="flex items-center justify-center h-full gap-2 text-white/30">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-base">검색 중</span>
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
                  <p className={`text-xs uppercase tracking-widest px-1 pt-3 pb-2 ${GROUP_STYLE[group] ?? "text-white/30"}`}>
                    {group}
                  </p>
                  <div className="space-y-2">
                    {chars.map((char) => (
                      <SearchResultCard key={char.characterId} char={char} onClick={() => handleSelectChar(char)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )

        ) : recentChars.length > 0 ? (
          <div className="pt-1">
            <div className="flex items-center justify-between px-1 pb-2.5">
              <p className="text-xs text-white/30 uppercase tracking-widest">최근 본 인물</p>
              <button
                onClick={clearRecent}
                className="text-xs text-white/20 hover:text-white/50 transition-colors"
              >
                지우기
              </button>
            </div>
            <div className="space-y-2">
              {recentChars.map((char) => (
                <RecentCard key={char.characterId} char={char} onClick={() => handleSelectChar(char)} />
              ))}
            </div>
            <p className="text-xs text-white/15 text-center pt-4">이름, 클래스, 능력으로 검색하세요</p>
          </div>

        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-5 px-2">
            <div className="flex flex-col items-center gap-2.5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Search className="w-6 h-6 text-indigo-400/60" />
              </div>
              <p className="text-white/70 text-base font-medium">인물 검색</p>
              <p className="text-white/25 text-sm leading-relaxed">이름, 클래스, 능력으로 검색하세요</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {["이름", "클래스", "고유능력", "특수능력", "잠재능력"].map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2.5 py-1 rounded-full border ${GROUP_STYLE[tag] ?? "text-white/30"} bg-white/3 border-white/8`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
