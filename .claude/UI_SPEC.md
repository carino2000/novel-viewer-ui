# Novel Viewer UI 명세

## 전체 레이아웃
- 전체 페이지 스크롤 없음, height: 100vh 고정
- 좌우 분할 레이아웃
  - 왼쪽(58%): 소설 본문 뷰어
  - 오른쪽(42%): AI 사이드 탭 패널
- 좌우 구분선: 0.5px border

---

## 왼쪽 패널 (소설 본문)

### 상단 헤더 (고정)
- 왼쪽: 소설 제목 (예: "메모라이즈")
- 가운데: "◀ 이전화" / "1화 / 1069화" / "다음화 ▶" 네비게이션
- 하단 border로 본문과 구분

### 본문 영역 (스크롤)
- 화 제목: 굵게, 본문 위에 표시
- 상태창(스탯박스): 배경색 있는 박스, 고정폭 폰트(monospace)
  - 예: "< 사용자 정보(Player Status) >"
  - 예: "근력 86 · 내구 92 · 민첩 96 · 체력 78"
- 본문 텍스트: 줄간격 넉넉하게, 문단 사이 여백
- padding: 24px 28px

---

## 오른쪽 패널 (AI 사이드)

### 탭 목록 (상단 고정)
총 4개 탭, 균등 분할
1. 인물 정보
2. 요약
3. 메모
4. 관계도

활성 탭: 하단 border 강조

### 탭 1 - 인물 정보

**AI 업데이트 버튼**
- 상단에 full width 버튼
- 아이콘 + "AI 업데이트" 텍스트
- 클릭 시 API 호출 (last_updated_episode ~ current_episode 구간 전송)

**캐릭터 카드** (인물 1명당 1카드)
- border, border-radius 있는 카드 형태
- 인물 이름 (굵게)
- 인물 설명 (muted 색상, 작은 폰트)
- 스탯 그리드 (stats_json 기반 동적 렌더링)
  - 3열 그리드
  - 각 셀: 스탯명(작게, muted) + 스탯값(굵게)
  - 스탯 없는 경우 "—" 표시
  - 예: 근력/내구/민첩/체력/마력/행운

### 탭 2 - 요약

**AI 업데이트 버튼** (인물 정보 탭과 동일)

**요약 텍스트**
- 직전 에피소드 요약 텍스트 표시
- 줄간격 넉넉하게

### 탭 3 - 메모

**메모 입력 영역**
- textarea: 자유 입력, 높이 200px 이상
- placeholder: "자유롭게 메모를 남겨보세요."
- 저장 버튼 (full width)

### 탭 4 - 관계도

**AI 업데이트 버튼** (인물 정보 탭과 동일)

**관계 목록**
- 인물 관계를 리스트로 표시
- 형식: [from] → [to] [관계유형 뱃지]
- 예: 김수현 → 세라프 [적대적 협력]
- relations_json 배열 기반 동적 렌더링
  ```json
  [{"from": "김수현", "to": "세라프", "relation": "적대적 협력"}]
  ```

---

## 데이터 연동

### reading_progress (읽기 진행상황)
```
current_episode      → 현재 화 번호 표시, 본문 로드
paragraph_index      → 스크롤 복귀 위치
last_updated_episode → AI 업데이트 버튼 클릭 시 전송 시작 화번호
relations_json       → 관계도 탭 렌더링
```

### characters (인물 정보)
```
name         → 카드 제목
description  → 카드 설명
stats_json   → 스탯 그리드 동적 렌더링
```

### episode_summaries (요약)
```
summary_text → 요약 탭 텍스트
```

### memos (메모)
```
content      → textarea 내용
episode_number → 현재 화번호 자동 저장
```

---

## AI 업데이트 버튼 동작 흐름
```
버튼 클릭
→ POST /api/ai/update
→ body: { novelId, fromEpisode: last_updated_episode, toEpisode: current_episode }
→ Spring에서 해당 구간 원문 추출
→ Claude API 호출 (인물정보 + 요약 + 관계도 JSON 1회)
→ DB 업데이트 (characters, episode_summaries, reading_progress.relations_json)
→ 프론트 리렌더링
```

---

## 기술 스택
- Next.js (App Router)
- Spring Boot REST API 연동
- API base URL: http://localhost:8080
