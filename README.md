# 전공픽

대학 저학년이 수업과 프로젝트에서 익힌 전공 역량으로 첫 유료 업무를 찾고, 해커톤·공모전 팀원도 구할 수 있는 Android 우선 모바일 앱입니다. 구인자는 짧고 명확한 전공 업무를 등록하고 지원자와 대화한 뒤 결과물과 완료 이력을 관리할 수 있습니다.

## 현재 구현 범위

- 학생: 가입, 역할 선택, 5단계 프로필, 추천·검색·저장, 간편 지원, 제안 수락, 대회 탐색, 팀 생성·지원, 메시지, 업무 결과물 제출
- 구인자: 조직 프로필, 공고 등록·게시, 지원자 상태 관리, 학생 검색, 메시지, 업무 시작·수정 요청·완료
- 공통: Expo SDK 57, React Native, TypeScript strict, Expo Router, TanStack Query
- 서버: Supabase Auth, PostgreSQL, RLS, Storage, RPC 상태 전환, 인앱 알림, 감사 로그
- UI: `#3182F6` 중심의 전공픽 디자인 시스템, 밝은 회색 배경, 20px 화면 여백, 54px 주요 버튼, 둥근 입력창·카드

Supabase 환경값이 있으면 실제 서버 저장소를 사용하고, 값이 없으면 UI 개발과 발표 연습을 위한 예시 데이터로 실행됩니다.

## 시작하기

필요 환경은 Node.js 22.13 이상입니다.

```bash
npm install
cp .env.example .env.local
npm run android
```

Android 에뮬레이터에서 로컬 Supabase를 연결할 때는 `.env.local`에 다음 값을 넣습니다.

```text
EXPO_PUBLIC_SUPABASE_URL=http://10.0.2.2:54321
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<로컬 또는 프로젝트 공개 키>
```

브라우저로 UI만 빠르게 확인하려면 `npm run web`을 사용합니다. 최종 확인은 Android 에뮬레이터나 실제 기기에서 진행해야 합니다.

## Supabase 로컬 실행

Supabase CLI와 Docker가 준비된 환경에서 다음 순서로 실행합니다.

```bash
npx supabase start
npx supabase db reset
```

`db reset`은 로컬 개발 DB를 다시 만들고 `supabase/migrations/`와 `supabase/seed.sql`을 적용합니다. 운영 프로젝트에는 reset 명령을 사용하지 마세요.

## 검증

```bash
npm run verify
EXPO_NO_TELEMETRY=1 npx expo export --platform web
```

`verify`는 TypeScript, ESLint, PostgreSQL 마이그레이션·상태 규칙 테스트를 차례로 실행합니다.

## 주요 폴더

```text
app/                         역할별 화면과 라우팅
src/components/ui/           전공픽 공통 UI
src/domain/contracts/        프런트·백엔드 공통 타입
src/repositories/            mock/Supabase 저장소 전환 계층
src/features/                학생·구인자·대회·메시지·업무 기능
supabase/migrations/          스키마, 보안 정책, 업무 흐름
tests/                        상태 규칙과 마이그레이션 통합 테스트
docs/                         서버 계약과 Android 연결 안내
```

실제 서비스 배포 전에는 Supabase 프로젝트 연결, 학교·사업자 인증, 푸시 알림, 운영자 신고 처리, 결제·세금 정책을 별도로 확정해야 합니다.
