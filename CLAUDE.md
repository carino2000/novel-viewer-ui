# Novel Viewer 프론트엔드

## 프로젝트 개요
웹소설 리더 + AI 사이드패널 서비스. 백엔드(Spring Boot, port 8080)는 완성됐고, 프론트엔드의 mock 데이터를 실제 API로 교체하는 작업이다.

- **백엔드 URL**: `http://localhost:8080`
- **스택**: Vite + React 19 + Tailwind CSS 4
- **axios 미설치** — `fetch` 사용 또는 직접 설치

---

## 컴포넌트 구조

```
src/
├── App.jsx                    — 좌(58%) 우(42%) 레이아웃, novelId 전역 state 관리
├── components/
│   ├── NovelViewer.jsx        — 소설 본문 뷰어 (mock → API 교체 필요)
│   ├── SidePanel.jsx          — 탭 전환 패널
│   └── tabs/
│       ├── CharacterTab.jsx   — 인물 목록 + 스탯 바 (mock → API 교체 필요)
│       ├── SummaryTab.jsx     — 에피소드 요약 (mock → API 교체 필요)
│       ├── MemoTab.jsx        — 자유 메모장 (API 연동 필요)
│       └── RelationTab.jsx    — 인물 관계도 (mock → API 교체 필요)
```

---

## 할 일 (우선순위 순)

1. **소설 선택 화면** — `GET /api/novel` 로 목록 조회, novelId를 앱 전역 state로 관리
2. **NovelViewer** — reading-progress 조회 → 에피소드 로딩 → 스크롤 저장
3. **CharacterTab** — 인물 목록 API 연동, abilities 있으면 능력 섹션 표시
4. **SummaryTab** — 요약 API 연동
5. **RelationTab** — reading-progress의 relations 배열 사용
6. **MemoTab** — 메모 CRUD API 연동
7. **AI 업데이트 버튼** — 3개 탭의 AI 버튼을 `POST /api/ai/update`에 연결 (로딩 UI 필수, 20~60초 소요)

---

## mock 데이터 교체 대상

| 파일 | mock 변수 | 교체할 API |
|---|---|---|
| `NovelViewer.jsx` | `MOCK_NOVEL`, `MOCK_CONTENT` | `GET /api/reading-progress`, `GET /api/episode` |
| `CharacterTab.jsx` | `MOCK_CHARACTERS` | `GET /api/character?novelId=1` |
| `SummaryTab.jsx` | `MOCK_SUMMARY` | `GET /api/summary?novelId=1&episodeNumber=5` |
| `RelationTab.jsx` | `MOCK_RELATIONS` | reading-progress의 `relations` 필드 |
| `MemoTab.jsx` | 로컬 state | `GET/POST/PUT/DELETE /api/memo` |

---

## API 명세서

### 소설
```
GET /api/novel
→ [{ novelId, title, author, description, totalEpisodes, createdAt, updatedAt }]
```

### 에피소드
```
GET /api/episode?novelId=1&episodeNumber=1
→ {
    episode: { episodeId, episodeNumber, title, content, charCount, createdAt },
    hasPrev: false,
    hasNext: true
  }
```

### 읽기 진행상황
```
GET /api/reading-progress?novelId=1
→ {
    progressId, currentEpisode, paragraphIndex, lastUpdatedEpisode, lastReadAt,
    relations: [{ from, to, relation }]  ← AI 업데이트 전이면 null
  }
※ 최초 조회 시 자동 생성 (currentEpisode: 1, paragraphIndex: 0)

PUT /api/reading-progress
body: { novelId, currentEpisode?, paragraphIndex? }   ← 필요한 것만 보내도 됨
→ (위와 동일한 progress 객체)

사용 시나리오:
  화 이동: { novelId, currentEpisode: N, paragraphIndex: 0 }
  스크롤: { novelId, paragraphIndex: N }  ← debounce 1초 권장
```

### AI 업데이트
```
POST /api/ai/update?novelId=1   (body 없음)
→ { characterCount, summary, relationCount, fromEpisode, toEpisode }
※ 응답까지 20~60초 소요. 로딩 스피너 필수.
※ 완료 후 인물/요약/관계도 데이터 재조회 필요.
※ 400: 새로 읽은 에피소드 없을 때
```

### 인물
```
GET /api/character?novelId=1
→ [{
    characterId, name, description, firstAppearedAt, lastUpdatedAt,
    stats: { 근력, 내구, 민첩, 체력, 마력, 행운 },   ← null 가능
    abilities: {                                       ← null 가능
      className, alignment,
      고유: [{ name, rank }],
      특수: [{ name, rank }],
      잠재: [{ name, rank }]
    }
  }]

GET /api/character/detail?novelId=1&name=김수현
→ (위 단일 객체) / 404
```

### 에피소드 요약
```
GET /api/summary?novelId=1&episodeNumber=5
→ { summaryId, episodeNumber, summaryText, createdAt }
※ AI 업데이트 전이면 null 반환
```

### 메모
```
GET /api/memo?novelId=1
→ [{ memoId, title, content, episodeNumber, createdAt, updatedAt }]

POST /api/memo
body: { novelId, title, content, episodeNumber }   ← title, episodeNumber nullable
→ (생성된 memo 객체)

PUT /api/memo/{memoId}
body: { title?, content? }
→ (수정된 memo 객체)

DELETE /api/memo/{memoId}
→ 200
```

---

## paragraphIndex 처리

```js
// 줄 분리
const lines = episode.content.split('\n')

// 스크롤 복원 (마운트 후)
lineRefs[paragraphIndex]?.scrollIntoView()

// 스크롤 저장 (IntersectionObserver 또는 scroll 이벤트)
// 현재 뷰포트 최상단에 보이는 줄의 인덱스 → PUT /api/reading-progress
```

---

## 주의사항

- `relations`, `stats`, `abilities` 는 AI 업데이트 전까지 `null` → null 체크 필수
- AI 업데이트 응답이 느리므로 반드시 로딩 상태 처리
- 스크롤 저장은 debounce 없이 쓰면 API 과호출됨
