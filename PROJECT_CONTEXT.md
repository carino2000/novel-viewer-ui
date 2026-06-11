# Novel Viewer 프로젝트 컨텍스트

## 프로젝트 개요
웹소설을 읽으면서 AI 사이드패널을 함께 보여주는 로컬 웹 서비스.
밀리의서재처럼 소설을 읽을 수 있고, 오른쪽 패널에서 AI 기능을 제공한다.
포트폴리오 겸 개인 토이프로젝트 (메모라이즈 웹소설 읽으려고 만드는 것).

## 기술 스택
- Backend: Spring Boot (Java 21, Maven)
- Frontend: Next.js
- Database: MySQL (DB명: novel_viewer, 인코딩: utf8mb4)
- AI: Claude API (platform.claude.com 별도 결제, 수동 버튼 트리거)
- 개발환경: 로컬 PC (배포 없음, 로그인 기능 없음)

## UI 구조
- 화면 왼쪽(58%): 소설 본문 뷰어 (화 단위 페이지, 스크롤)
- 화면 오른쪽(42%): AI 사이드 탭 패널
  - 인물 정보 탭: 캐릭터 카드 + 스탯 그리드 + AI 업데이트 버튼
  - 직전 에피소드 요약 탭: AI 업데이트 버튼 + 요약 텍스트
  - 자유 메모장 탭: textarea + 저장 버튼
  - 인물 관계도 탭: relations_json 기반 + AI 업데이트 버튼
- 전체 페이지 스크롤 없음, 각 패널 내부에서만 스크롤

## AI 호출 설계
- 트리거: 사용자가 수동으로 누르는 "AI 업데이트 버튼" (자동 호출 없음)
- 전송 범위: last_updated_episode ~ current_episode 구간 원문
- 1회 호출로 인물정보 + 요약 + 관계도를 JSON으로 한번에 수신
- 챗봇 기능 없음 (추후 RAG 구조로 구현 고려)

## DB 스키마 (novel_viewer)

```sql
-- 소설 메타정보
novels: novel_id, title, author, description, total_episodes, created_at, updated_at

-- 화별 원문
episodes: episode_id, novel_id(FK), episode_number, title, content(LONGTEXT), char_count, created_at
UNIQUE: (novel_id, episode_number)

-- 읽기 진행상황
reading_progress: progress_id, novel_id(FK), current_episode, paragraph_index,
                  last_updated_episode, relations_json(JSON), last_read_at
UNIQUE: (novel_id)

-- 인물 정보
characters: character_id, novel_id(FK), name, description, first_appeared_at,
            last_updated_at, stats_json(JSON), created_at, updated_at
stats_json 구조: {"근력": 86, "내구": 92, "민첩": 96, "체력": 78, "마력": 48, "행운": 36}
UNIQUE: (novel_id, name)

-- 직전 에피소드 요약 캐시
episode_summaries: summary_id, novel_id(FK), episode_number, summary_text, created_at
UNIQUE: (novel_id, episode_number)

-- 자유 메모장
memos: memo_id, novel_id(FK), title(NULL), content, episode_number(NULL), created_at, updated_at
```

## Spring Boot 프로젝트 구조
```
novel_viewer/
├── domain/
│   └── entity/          ← 완성
│       ├── Novel.java
│       ├── Episode.java
│       ├── ReadingProgress.java
│       ├── Character.java
│       ├── EpisodeSummary.java
│       └── Memo.java
├── repository/           ← 완성
├── service/              ← NovelService, NovelParsingService 틀만 있음
├── controller/           ← NovelController 틀만 있음
│   └── NovelController.java
│       - POST /api/novel/parse (filePath, title, author 받아서 파싱 & DB 저장)
│       - GET /api/novels
│       - GET /api/novels/{novelId}
└── dto/
```

## JPA 엔티티 규칙
- 패키지: novel_viewer.domain.entity
- 단수형 클래스명 (Novel, Episode ...)
- @Table(name = "테이블명") 명시
- camelCase → snake_case 자동변환 (Spring Boot 기본 설정, @Column 생략)
- @PrePersist, @PreUpdate로 created_at, updated_at 자동 관리
- Lombok: @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor

## application.yml 주요 설정
- ddl-auto: none (스키마는 SQL로 직접 관리)
- show-sql: true
- DB: localhost:3306/novel_viewer

## 소설 파싱 정보 (메모라이즈)
- 파일: 메모라이즈.txt (원본 CP949, UTF-8로 변환 후 사용 예정)
- 총 1069화, 화당 평균 7,700자
- 화 구분 정규식: `^(\d{5})\s{2}(.+?)\s{2}=+\s*$`
- 파싱 방식: filePath 하드코딩 → FileInputStream → 정규식 파싱 → novels INSERT → episodes INSERT

## 현재 진행 상황 (2026-06-09)
- [완료] 전체 설계 확정
- [완료] DB 스키마 작성 (novel_viewer.sql)
- [완료] Spring Boot 프로젝트 세팅 (Java 21, Maven, DevTools, JPA, MySQL)
- [완료] JPA 엔티티 전체 작성
- [완료] Repository 전체 작성
- [완료] Claude Code CLI 설치 및 로그인
- [진행중] 소설 파싱 & DB 적재 API 구현
  - NovelController: POST /api/novel/parse 틀 있음
  - NovelParsingService: parseAndSave() 내부 로직 미완성
- [미완료] Next.js UI
- [미완료] AI 업데이트 기능 연결

## 다음 작업
1. NovelParsingService.parseAndSave() 로직 완성
   - UTF-8 변환된 메모라이즈.txt 읽기
   - 정규식으로 화 파싱
   - novels 테이블 INSERT → novelId 획득
   - episodes 테이블 INSERT (1069화)
2. Postman으로 파싱 API 테스트
3. Next.js 프로젝트 세팅 (좌우 레이아웃)
4. 소설 뷰어 UI 구현
5. AI 업데이트 버튼 기능 연결
