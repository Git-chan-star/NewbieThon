# 관리자 계정과 운영 DB 연결

## 현재 구조

- 개발 환경에서 Supabase 값이 없으면 예시 데이터로 화면과 관리자 기능을 확인할 수 있습니다.
- 배포용 빌드는 Supabase 연결값이 없으면 예시 데이터를 보여주지 않고 설정 오류 화면을 표시합니다.
- 관리자 회원가입은 앱에서 허용하지 않습니다. 서버의 서비스 역할로만 관리자 권한을 부여합니다.
- 관리자 화면에서 회원 활성/정지, 공고 일시정지/재게시/종료, 구인자 인증 승인/반려, 신고 검토/해결/기각을 처리합니다.

## 원격 Supabase 연결

Supabase에서 `itgu` 프로젝트를 만든 뒤 로컬에서 로그인하고 프로젝트를 연결합니다.

```bash
npx supabase login
npx supabase link --project-ref <프로젝트-ref>
npx supabase db push
```

앱의 개발·배포 환경에는 다음 공개 값만 등록합니다.

```text
EXPO_PUBLIC_SUPABASE_URL=https://<프로젝트-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
EXPO_PUBLIC_ADMIN_EMAIL=admin@itgu.local
```

`SUPABASE_SERVICE_ROLE_KEY`와 관리자 비밀번호는 모바일 앱의 `.env.local`, `EXPO_PUBLIC_*`, GitHub 코드에 넣으면 안 됩니다.

## 최초 관리자 생성

DB 마이그레이션을 먼저 적용한 뒤, 로컬 터미널 세션에만 운영 비밀값을 넣고 생성 명령을 실행합니다. 아래 값은 예시이며 실제 값은 비밀 관리 도구나 CI의 secret을 사용합니다.

```bash
SUPABASE_URL=<Supabase URL> \
SUPABASE_SERVICE_ROLE_KEY=<service-role key> \
ADMIN_EMAIL=admin@itgu.local \
ADMIN_PASSWORD=<8자 이상의 비밀번호> \
npm run admin:create
```

이 명령은 인증 계정을 만든 뒤 `promote_user_to_admin` 서버 함수를 호출합니다. 중간에 실패하면 만들어진 인증 계정을 자동 삭제합니다.

앱 로그인 화면에서 아이디 `admin`을 입력하면 `EXPO_PUBLIC_ADMIN_EMAIL`로 변환되어 로그인됩니다. 운영 전에는 개발 중 사용한 비밀번호를 재사용하지 말고, 12자 이상의 고유 비밀번호로 교체해야 합니다.

## 배포 전 확인

1. 관리자 로그인 후 관리자 탭 5개가 보이는지 확인합니다.
2. 테스트 학생을 정지한 뒤 해당 계정의 보호된 데이터 접근이 거부되는지 확인합니다.
3. 테스트 공고를 일시정지하고 학생 검색 결과에서 사라지는지 확인합니다.
4. 구인자 인증 승인과 신고 해결 후 감사 로그가 남는지 확인합니다.
5. 앱 빌드 환경에 서비스 역할 키나 관리자 비밀번호가 없는지 확인합니다.
