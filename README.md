# NewbieThon

저학년 대학생이 전공 역량을 활용해 유료 단기 업무를 찾고, 완료 경험을 다음 기회에 사용할 수 있도록 돕는 Android 우선 매칭 서비스입니다.

현재 브랜치에는 `02_employer_marketplace_implementation_prompt.md`의 백엔드 MVP가 들어 있습니다. 앱 화면은 별도 프런트엔드 작업으로 연결하며, 백엔드는 Android 네이티브 또는 React Native·Expo Android 앱 모두에서 사용할 수 있습니다.

## 현재 구현 범위

- Supabase Auth와 연결되는 학생·구인자 역할 프로필
- 조직·구인자 인증 상태
- 공고 임시 저장, 게시 검증, 게시·일시 중지·마감
- 학생 지원, 지원 상태 변경, 구인자의 업무 제안
- 참여자 전용 대화와 중복 방지 메시지 전송
- 합의 업무 생성, 결과물 제출, 수정 요청, 완료
- 완료 후 양방향 평가와 학생의 유료 업무 경험 생성
- 인앱 알림, 신고, 감사 로그
- PostgreSQL RLS 권한 정책과 원자적 RPC
- 설명 가능한 규칙 기반 매칭 점수

실제 급여 결제, 에스크로, 세금 처리, 법적 계약 자동 판단, 실명·사업자 인증 제공자 연동은 포함하지 않습니다.

## 폴더

```text
supabase/migrations/   DB 스키마, RLS, 서버 워크플로
supabase/seed.sql      공통 기술 샘플 데이터
src/backend/           앱과 서버가 공유할 상태 규칙·매칭 로직
src/domain/            TypeScript 도메인 계약
src/repositories/      Android 앱이 호출할 Supabase 연결 계층
tests/                 PostgreSQL 마이그레이션·권한·핵심 흐름 테스트
docs/                  ERD, Android 연결, API 사용 안내
```

GitHub 자동 검사를 켜려면 `docs/backend-ci.example.yml`을 `.github/workflows/backend-ci.yml`로 옮기고, 워크플로 파일을 수정할 수 있는 GitHub 권한으로 반영합니다.

## 로컬 실행

1. Docker Desktop과 Supabase CLI를 설치합니다.
2. 저장소 루트에서 `supabase start`를 실행합니다.
3. `supabase db reset`으로 마이그레이션과 seed를 적용합니다.
4. 출력된 API URL과 anon key를 Android 앱의 로컬 환경 설정에 넣습니다.

Android 에뮬레이터에서 컴퓨터의 로컬 API에 접근할 때는 `127.0.0.1` 대신 `10.0.2.2`를 사용합니다. 실제 기기에서는 같은 네트워크의 컴퓨터 IP 또는 배포된 Supabase URL이 필요합니다.

```bash
npm test
npm run typecheck
```

`npm test`는 가벼운 PostgreSQL 호환 엔진에서 전체 마이그레이션과 핵심 거래 흐름, 일부 권한 공격 시나리오를 실행합니다. 실제 Supabase 환경에서는 `supabase db reset`도 확인합니다.

자세한 내용은 [백엔드 계약](docs/backend-contract.md)과 [Android 연결 안내](docs/android-integration.md)를 참고하세요.
