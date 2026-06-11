# Work Log — Novel Viewer UI

---

## 2026-06-10

### 한 작업
- `.claude/CLAUDE.md`, `UI_SPEC.md` 기준으로 mock → 실제 API 전면 교체
- `src/api.js` 신규 — fetch 공통 유틸 (base URL, 에러 파싱)
- `App.jsx` — 소설 선택 화면 신규 + `novelId` / `progress` / `novelInfo` 전역 state
- `NovelViewer.jsx` — 에피소드 fetch, 화 이동 시 `PUT /api/reading-progress`, 스크롤 저장(debounce 1s) + 스크롤 복원(paragraphIndex)
- `SidePanel.jsx` — props 기반으로 재작성, AI 업데이트 핸들러 중앙 관리 (`aiVersion` 카운터로 탭 리프레시 트리거)
- `CharacterTab.jsx` — `GET /api/character` 연동, 3열 스탯 그리드(UI_SPEC 반영), abilities 섹션 추가
- `SummaryTab.jsx` — `GET /api/summary` 연동, 직전 화 요약 표시
- `MemoTab.jsx` — `GET/POST/PUT/DELETE /api/memo` 연동, 화차별 메모 CRUD
- `RelationTab.jsx` — `progress.relations` 사용, `→` 화살표로 수정(UI_SPEC 반영)

### 다음 할 일
1. **CORS 해결** — Vite dev 서버 포트가 3000인데 백엔드 CORS는 5173만 허용 중. 둘 중 하나 맞춰야 함
   - 방법 A: Spring Boot CORS에 `http://localhost:3000` 추가
   - 방법 B: `vite.config.js`에서 `port: 3000` 제거해 5173으로 복귀
2. 실제 백엔드 연동 테스트 (소설 선택 → 본문 로드 → 탭 확인)
3. 소설 본문 상태창(스탯박스) 렌더링 — monospace 배경박스 스타일 적용

---

## 2026-06-09

### 한 작업
- Tailwind CSS v4 설치 (`tailwindcss` + `@tailwindcss/vite`)
- `vite.config.js` — Tailwind 플러그인 등록, 개발 서버 포트 3000으로 고정
- `src/index.css` — 기존 Vite 기본 스타일 제거, `@import "tailwindcss"` 및 전역 base 설정
- 기초 UI 컴포넌트 구현
  - `App.jsx` — 좌 58% / 우 42% 레이아웃
  - `NovelViewer.jsx` — 소설 본문 뷰어 (크림색 배경, 이전/다음화 네비, 스크롤)
  - `SidePanel.jsx` — 4탭 네비게이션 컨테이너
  - `CharacterTab.jsx` — 캐릭터 카드 + 스탯바 + AI 업데이트 버튼
  - `SummaryTab.jsx` — 직전 에피소드 요약 + AI 업데이트 버튼
  - `MemoTab.jsx` — 자유 메모장 (textarea + 저장 버튼)
  - `RelationTab.jsx` — 인물 관계도 카드 + AI 업데이트 버튼
- 모든 컴포넌트 mock 데이터로 화면 확인 완료

- Claude 메모리 설정
  - 세션 시작 시 직전 작업 브리핑 규칙 저장
  - "작업 마무리해" 발언 시 work log 작성 규칙 저장

### 다음 할 일
1. Spring Boot — `NovelParsingService.parseAndSave()` 로직 완성
2. Postman으로 `POST /api/novel/parse` 테스트
3. 프론트 API 연동 시작 (소설 목록 불러오기, 화 내용 fetch)
