# Novel Viewer 프론트엔드 작업 지시서

## 프로젝트 개요

웹소설 리더 + AI 사이드패널 서비스. 백엔드(Spring Boot, port 8080)는 완성됐고, 프론트엔드의 mock 데이터를 실제 API로 교체하는 작업이다.

- **프론트 경로**: `C:\Users\carin\Desktop\Jihoon\Himedia\01_project\project-novel-viewer\novel-viewer-ui`
- **백엔드 URL**: `http://localhost:8080`
- **스택**: Vite + React 19 + Tailwind CSS 4 (axios 미설치, fetch 사용)

---

## 현재 컴포넌트 구조

```
src/
├── App.jsx                    — 좌(58%) 우(42%) 레이아웃
├── components/
│   ├── NovelViewer.jsx        — 소설 본문 뷰어 (mock 데이터 하드코딩)
│   ├── SidePanel.jsx          — 탭 전환 패널 (4개 탭)
│   └── tabs/
│       ├── CharacterTab.jsx   — 인물 목록 + 스탯 바 (mock 데이터)
│       ├── SummaryTab.jsx     — 에피소드 요약 (mock 데이터)
│       ├── MemoTab.jsx        — 자유 메모장 (로컬 state만)
│       └── RelationTab.jsx    — 인물 관계도 (mock 데이터)
```

---

## 할 일 목록

### 1단계 — 소설 선택 화면 (신규)

- 앱 진입 시 `GET /api/novel`로 소설 목록 조회
- 현재는 소설이 1개(메모라이즈)이므로 간단한 선택 화면으로 충분
- 소설 선택 → `novelId`를 앱 전역 state로 관리

### 2단계 — NovelViewer.jsx mock → 실제 API

- `GET /api/reading-progress?novelId={id}` 로 현재 화수 + 문단 위치 복원
- `GET /api/episode?novelId={id}&episodeNumber={n}` 로 회차 본문 로딩
- 화 이동 시 `PUT /api/reading-progress` 로 저장
- 스크롤 위치 변경 시 `PUT /api/reading-progress` 로 paragraphIndex 저장 (debounce 권장)
- paragraphIndex = 본문을 `\n`으로 split했을 때의 줄 인덱스

### 3단계 — SidePanel 탭들 mock → 실제 API

- **CharacterTab**: `GET /api/character?novelId={id}`
- **SummaryTab**: `GET /api/summary?novelId={id}&episodeNumber={n}`
- **RelationTab**: reading-progress 응답의 `relations` 배열 사용
- **MemoTab**: `GET /api/memo?novelId={id}` + POST/PUT/DELETE

### 4단계 — AI 업데이트 버튼 연결

- 세 탭(인물/요약/관계도)의 AI 버튼 → `POST /api/ai/update?novelId={id}`
- 응답 받은 후 인물, 요약, 관계도 데이터 재조회
- 로딩 스피너 표시 (응답까지 수십 초 걸릴 수 있음)

---

## 전역 상태 설계 (권장)

```js
// App.jsx 에서 관리
const [novelId, setNovelId] = useState(null); // 선택한 소설
const [progress, setProgress] = useState(null); // { currentEpisode, paragraphIndex, relations }
```

각 컴포넌트에 props로 내려주거나 Context API 사용.

---

## API 명세서

### 공통

- Base URL: `http://localhost:8080`
- Content-Type: `application/json`
- CORS: localhost:5173 허용됨

---

### 소설

#### 소설 목록 조회

```
GET /api/novel
Response 200:
[
  {
    "novelId": 1,
    "title": "메모라이즈",
    "author": "로크",
    "description": "...",
    "totalEpisodes": 1069,
    "createdAt": "2026-06-09T...",
    "updatedAt": "2026-06-09T..."
  }
]
```

---

### 에피소드

#### 회차 조회

```
GET /api/episode?novelId=1&episodeNumber=1
Response 200:
{
  "episode": {
    "episodeId": 1,
    "episodeNumber": 1,
    "title": "회귀자의 아침",
    "content": "기억이 돌아왔다...",
    "charCount": 7823,
    "createdAt": "2026-06-09T..."
  },
  "hasPrev": false,
  "hasNext": true
}
Response 400: { "error": "존재하지 않는 회차입니다: 9999" }
```

---

### 읽기 진행상황

#### 진행상황 조회 (없으면 1화로 자동 생성)

```
GET /api/reading-progress?novelId=1
Response 200:
{
  "progressId": 1,
  "currentEpisode": 5,
  "paragraphIndex": 47,
  "lastUpdatedEpisode": 3,
  "lastReadAt": "2026-06-10T...",
  "relations": [
    { "from": "김수현", "to": "이세하", "relation": "동료" }
  ]
}
※ relations: AI 업데이트 전이면 null
```

#### 진행상황 저장

```
PUT /api/reading-progress
Body: { "novelId": 1, "currentEpisode": 5, "paragraphIndex": 47 }
※ currentEpisode, paragraphIndex 중 필요한 것만 보내도 됨
Response 200: (위와 동일한 progress 객체)

사용 시나리오:
- 화 이동 시: { novelId, currentEpisode: 다음화, paragraphIndex: 0 }
- 스크롤 저장: { novelId, paragraphIndex: 현재줄번호 }
```

---

### AI 업데이트

#### AI 업데이트 실행

```
POST /api/ai/update?novelId=1
※ Body 없음
Response 200:
{
  "characterCount": 5,
  "summary": "김수현은 회귀 후...",
  "relationCount": 3,
  "fromEpisode": 4,
  "toEpisode": 5
}
Response 400: { "error": "새로 읽은 에피소드가 없습니다. (마지막 업데이트: 5화)" }
Response 500: { "error": "AI 업데이트 중 오류가 발생했습니다: ..." }

※ 주의: Claude API 호출로 응답까지 20~60초 소요됨. 로딩 UI 필수.
※ 완료 후 인물/요약/관계도 데이터 재조회 필요.
```

---

### 인물

#### 인물 목록 조회

```
GET /api/character?novelId=1
Response 200:
[
  {
    "characterId": 1,
    "name": "김수현",
    "description": "주인공. 수십 번 회귀를 반복한 회귀자...",
    "firstAppearedAt": 1,
    "lastUpdatedAt": 5,
    "stats": { "근력": 94, "내구": 92, "민첩": 98, "체력": 72, "마력": 96, "행운": 88 },
    "abilities": {
      "className": "검술 전문가",
      "alignment": "질서·혼돈",
      "고유": [{ "name": "제 3의 눈", "rank": "S" }],
      "특수": [{ "name": "신검합일", "rank": "EX" }],
      "잠재": [
        { "name": "백병전", "rank": "A Plus" },
        { "name": "심안(정)", "rank": "A Plus" }
      ]
    },
    "createdAt": "...",
    "updatedAt": "..."
  }
]
※ stats, abilities: AI 업데이트 전이면 null
※ abilities: 원문에 상태창 없는 인물은 null
```

#### 인물 상세 조회 (이름으로)

```
GET /api/character/detail?novelId=1&name=김수현
Response 200: (위 단일 객체)
Response 404: (없을 경우)
```

---

### 에피소드 요약

#### 요약 조회

```
GET /api/summary?novelId=1&episodeNumber=5
Response 200:
{
  "summaryId": 1,
  "episodeNumber": 5,
  "summaryText": "김수현은 아카데미에 도착해...",
  "createdAt": "..."
}
※ AI 업데이트 전이면 null 반환 (빈 객체 아님)
```

---

### 메모

#### 메모 목록 조회

```
GET /api/memo?novelId=1
Response 200:
[
  {
    "memoId": 1,
    "title": "5화 메모",
    "content": "수현이 처음 만난 인물은...",
    "episodeNumber": 5,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

#### 메모 생성

```
POST /api/memo
Body: { "novelId": 1, "title": "제목(nullable)", "content": "내용", "episodeNumber": 5 }
Response 200: (생성된 memo 객체)
```

#### 메모 수정

```
PUT /api/memo/{memoId}
Body: { "title": "새제목", "content": "새내용" }
Response 200: (수정된 memo 객체)
Response 404: (없을 경우)
```

#### 메모 삭제

```
DELETE /api/memo/{memoId}
Response 200: (빈 body)
Response 404: (없을 경우)
```

---

## paragraphIndex 처리 방법

본문 컨텐츠를 `\n`으로 split하면 줄 배열이 됩니다.

```js
const lines = episode.content.split("\n");
// paragraphIndex = 현재 뷰포트에 보이는 첫 번째 줄의 인덱스
```

**스크롤 복원**: 컴포넌트 마운트 후 해당 줄 요소로 `scrollIntoView()`.
**스크롤 저장**: IntersectionObserver 또는 스크롤 이벤트(debounce 1초 권장)로 현재 줄 인덱스 추적 → `PUT /api/reading-progress`.

---

## 현재 mock 데이터 위치 (교체 대상)

| 파일               | mock 변수                    | 교체할 API                                      |
| ------------------ | ---------------------------- | ----------------------------------------------- |
| `NovelViewer.jsx`  | `MOCK_NOVEL`, `MOCK_CONTENT` | `GET /api/reading-progress`, `GET /api/episode` |
| `CharacterTab.jsx` | `MOCK_CHARACTERS`            | `GET /api/character`                            |
| `SummaryTab.jsx`   | `MOCK_SUMMARY`               | `GET /api/summary`                              |
| `RelationTab.jsx`  | `MOCK_RELATIONS`             | reading-progress의 `relations`                  |
| `MemoTab.jsx`      | 로컬 state                   | `GET/POST/PUT/DELETE /api/memo`                 |

---

## 주의사항

- axios 미설치. `fetch` 또는 `axios` 설치 후 사용.
- AI 업데이트는 응답이 느리므로 반드시 로딩 상태 처리.
- `relations`가 null인 경우(업데이트 전), 관계도 탭에서 빈 상태 UI 표시.
- `abilities`가 null인 경우, 인물 카드에서 능력 섹션 숨김 처리.
- 스크롤 저장은 너무 자주 호출하지 않도록 debounce 필수.
