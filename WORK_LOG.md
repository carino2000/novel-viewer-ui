# Work Log — Novel Viewer UI

---

## 2026-06-11

### 한 작업

**모바일 반응형 + PWA**
- `App.jsx` — 하단 탭 네비게이션 (읽기/분석 전환), `mobileView` state
- `vite.config.js` — VitePWA 플러그인 등록, `host: '0.0.0.0'` (외부 접근)
- `index.html` — viewport-fit=cover, iOS PWA 메타태그, apple-touch-icon
- `pwa-assets.config.js` — 커스텀 프리셋, apple 아이콘 배경 `#0c0c15`로 흰 테두리 제거
- PWA 아이콘 재생성 (pwa-64/192/512, maskable-icon-512, apple-touch-icon-180)

**백엔드 연결 주소 변경**
- `src/api.js` — base URL `http://59.13.199.232:8080` (외부 서버)
- 프론트 서버 포트 3000, `0.0.0.0` 바인딩 → `http://59.13.199.232:3000/`

**CharacterTab 기능 개선**
- 검색 API 응답 파싱: 그룹 객체 `{ "이름": [...], "클래스": [...] }` 형태 처리
- 랭크 컬러 시스템: B → A → A+ → A++ → A+++ → S → S+ → EX Zero → EX → EX+
- 기본 상태 UI: 전체 목록 대신 검색 안내 + 카테고리 태그 칩
- CharacterDetail overflow 수정 (`min-h-0` 체인)
- `SidePanel.jsx` — AI 업데이트 버튼 아래 "마지막 업데이트: N화" 표시

**소설 뷰어 스크롤 오버레이 (핵심 수정)**
- `NovelViewer.jsx` 전면 재작성: `absolute inset-0` 스크롤 영역 + 헤더/푸터 절대 오버레이
- `paddingTop` 동적 변경 문제 해결: 에피소드 제목을 헤더에서 스크롤 콘텐츠로 이동 → headerHeight 안정화
- 최종 방식: paddingTop 완전 제거 → 헤더/푸터가 글자 위에 진짜로 올라타는 방식
- 스크롤 다운 → UI 숨김, 스크롤 업 or 탭 → UI 표시
- `App.jsx` 스페이서 div 제거 (iOS Safari 컨테이너 높이 변경 시 scrollTop 재계산 방지)
- `SidePanel.jsx` — `pb-14 md:pb-0` 정적 하단 여백

**글씨 크기 & UI 크기**
- 소설 본문: `text-[20px] font-medium`
- NovelViewer 헤더/푸터 버튼 전반 확대 (`w-10 h-10`, `text-base`, `py-3` 등)
- 분석 탭 전체 글씨 한 단계씩 확대 (CharacterTab, SummaryTab, MemoTab, RelationTab)
- SidePanel 탭 네비 `text-sm`, AI 버튼 `text-base`

### 다음 할 일
1. iOS 홈화면 추가 후 아이콘/스크롤 동작 최종 확인
2. 소설 뷰어 읽기 경험 추가 개선 (필요 시)
3. 기타 버그 픽스

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
