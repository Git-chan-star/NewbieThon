# 프론트엔드(개발자 1) 구현 현황

브랜치: `feat/frontend` (원격에 push됨)
기준 문서: `01_core_student_implementation_prompt.md`
소유 범위: `app/(auth)/`, `app/(student)/`, `src/components/`, `src/features/student/`, `src/repositories/mock/`
스택: React Native + Expo(SDK 57) + TypeScript(strict) + Expo Router + TanStack Query + React Hook Form/Zod + Zustand + ESLint(`eslint-config-expo`)

> 백엔드는 Supabase가 아니라 팀원이 Python + FastAPI + SQLite로 구현 중(`backend/`). 화면은 `src/repositories/interfaces/`에만 의존하므로, mock repository를 실제 API 호출 repository로 교체하면 화면 코드 변경 없이 연동 가능.

## 1. 완성된 것

### 1-1. 기반 구조
- [x] Expo Router 기반 라우팅, path alias `@/*` → `src/*`
- [x] 디자인 토큰(`src/theme`) 및 공통 UI 컴포넌트: `Button`, `TextField`, `ChoiceChip`, `SelectCard`, `ProgressBar`, `StepHeader`, `StatusBadge`/`VerificationBadge`, `EmptyState`/`ErrorState`, `Skeleton`, `StickyBottomAction`, `JobCard`, `SkillChip`, `SkillLevelSelector`
- [x] 공통 도메인 타입(`src/domain/contracts/types.ts`) — User, StudentProfile, Skill/Course/Project, Job, Application, JobOffer, MatchExplanation 등 (01 문서 5장 기준)
- [x] Repository 인터페이스 4종 (`AuthRepository`, `StudentRepository`, `StudentJobRepository`, `StudentApplicationRepository`)
- [x] Mock repository 전체 구현 — AsyncStorage에 영속화되어 앱 재실행에도 세션/데이터 유지, 클라이언트 매칭 점수 계산(`src/repositories/mock/matching.ts`, 02 문서 14장 가중치 그대로 적용) 포함
- [x] TanStack Query client + query key factory(`src/lib/queryKeys.ts`, 학생/구인자 캐시 분리 원칙 반영)

### 1-2. 인증 & 역할 선택
- [x] `/(auth)/welcome`, `/sign-in`, `/sign-up`, `/role-select`
- [x] 세션 부트스트랩(앱 시작 시 로딩 화면 → 세션 복구), 라우트 가드(`app/index.tsx`, `app/(student)/_layout.tsx`)
- [x] 학생이 구인자 전용 경로에 접근 시 차단 (역할/온보딩 상태 기반 리다이렉트)
- [x] 구인자 선택 시 안내 화면(`employer-pending`)만 제공 — 구인자 실제 화면은 개발자 2 담당이라 미구현

### 1-3. 학생 온보딩 (5단계, 01 문서 8장)
- [x] 기본정보 → 관심분야(1~3개) → 기술/수준(문구형 레벨) → 경험(과목/프로젝트, 선택사항) → 희망조건 → 완료 요약
- [x] 각 단계 자동 저장(mock repository 호출) + 임시 입력은 Zustand+AsyncStorage 기반 draft store로 앱 재시작에도 복구

### 1-4. 학생 홈 · 탐색 · 상세 · 지원 (01 문서 9~14장)
- [x] 하단 탭 5개: 홈/찾기/지원/메시지/내 프로필
- [x] 홈: 지금 할 일 → 맞춤 추천 → 진행 중인 지원 → 프로필 완성도
- [x] 검색/필터(분야·난이도·근무방식·저학년가능), 키워드 300ms debounce, 적용 필터 칩+전체초기화, 결과 없음 완화 제안
- [x] 저장한 공고 세그먼트(찾기 탭 내)
- [x] 공고 상세: 요약→보수/기간/방식→매칭 이유→할일→결과물→기술→교육여부→구인자→마감일 고정 순서, 지원 여부/마감/본인공고에 따른 버튼 상태 분기
- [x] 간편 지원 3단계(프로필 확인 → 일정 → 확인 및 제출), 제출 전 안내(제출정보/연락방법/취소가능), 중복 지원 방지
- [x] 지원 현황(상태별 필터: 전체/검토중/대화면접/결과), 지원 상세, 지원 취소
- [x] 받은 제안 목록 + 수락/거절 (역할 선택 시 데모용 제안 1건 자동 생성)
- [x] 학생 프로필 화면: 학교/전공/인증, 관심분야, 기술, 과목, 프로젝트(담당 부분 별도 표시), 검색 노출 토글, 로그아웃

### 1-5. 품질
- [x] `tsc --noEmit` 통과 (strict mode)
- [x] `expo lint` 통과 — React Compiler 순수성 규칙 위반 등 실제 버그 3건 발견 후 수정 (Date.now() 렌더 중 호출, useRef 렌더 중 접근, useMemo 의존성 불안정)
- [x] `expo export --platform web` 정상 번들 (1100+ 모듈)
- [x] 홈/찾기 화면 공고 카드 저장 버튼이 항상 "저장"만 호출되던 로직 버그 직접 발견해 수정

## 2. 의도적으로 미구현 (범위 밖 또는 후순위)

| 항목 | 상태 | 사유 |
|---|---|---|
| 메시지 실제 대화방/메시지 데이터 | 빈 상태(EmptyState)만 표시 | 대화방 생성·메시지 저장은 개발자 2 서버 로직(02 문서 15장) 의존. UI 상태 표현 골격은 있음 |
| 완료한 유료 업무 카드(포트폴리오) | 빈 상태만 표시 | engagement/review 데이터가 서버에 있어야 함 |
| 알림 화면 | 미구현 | 알림 생성은 서버 책임, 화면 우선순위 낮음 |
| BottomSheet, ConfirmationDialog, Toast/Snackbar, IconButton | 미구현 | 현재 화면 흐름에서 필요하지 않아 후순위로 미룸 |
| 자동화 테스트 (Jest/RNTL, Maestro E2E) | 미구현 | 시간 제약상 수동 검증(tsc/lint/export)으로 대체 |
| 실기기/에뮬레이터 수동 클릭 테스트 | 미완료 | 이 세션에서는 브라우저/에뮬레이터 조작 불가 — **팀원 또는 사용자가 직접 확인 필요** |
| 실제 API 연동 | 미착수 | 백엔드 팀원 작업 완료 후 진행 (아래 3장 참고) |

## 3. 다음에 해야 할 일 (제안 순서)

### 우선순위 1 — 지금 바로
1. **실기기/에뮬레이터에서 실제 클릭 테스트** (`npm run android` 또는 `npm run web`) — 회원가입→온보딩→지원까지 한 번 직접 눌러보고 깨지는 화면 확인
2. 발견된 버그 있으면 리포트 → 수정

### 우선순위 2 — 백엔드 연동 준비
3. 개발자 2와 아래 내용 맞추기 (01 문서 24장 항목):
   - 확정 TypeScript 타입 (`src/domain/contracts/types.ts`) 리뷰
   - Repository 인터페이스(`src/repositories/interfaces/`)가 실제 서버 쿼리와 맞는지 확인
   - 매칭 점수/이유 필드가 서버 응답과 일치하는지 확인
   - 지원 상태 문구, 업로드 파일 형식/크기 제한 등 공유
4. `src/repositories/http/` (가칭) 폴더에 실제 API를 호출하는 repository 구현체 추가 → 화면 코드 수정 없이 mock → 실 API로 교체 (환경변수로 스위칭 가능하게)

### 우선순위 3 — 남은 화면/기능 (시간 되는 대로)
5. 메시지 화면 실 데이터 연동 (개발자 2의 conversations/messages 완성 후)
6. 포트폴리오(완료 업무 카드) 연동
7. 알림 화면
8. `ConfirmationDialog`(지원 취소·로그아웃 등 파괴적 행동 확인), `Toast` 공통 컴포넌트 추가

### 우선순위 4 — 품질/발표 준비
9. 접근성 재점검 (동적 글자 크기, 스크린리더 라벨 실기기 확인)
10. 데모 시나리오 리허설: 신규 가입 → 학생 선택 → 온보딩 완료 → 추천 확인 → 상세 → 지원 → 지원현황 확인
11. (시간 남으면) 핵심 흐름 Jest/RNTL 스모크 테스트 1~2개

## 4. 참고

- 실행: `npm install` → `npm run android`/`ios`/`web`
- 검증: `npm run typecheck`, `npm run lint`
- 목데이터 초기화하고 싶으면 앱 데이터/AsyncStorage를 지우면 됨 (별도 초기화 버튼은 아직 없음)
