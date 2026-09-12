# Android 연결 안내

## 권장 앱 구조

두 기획 문서는 React Native·Expo 기준이므로 하나의 코드베이스에서 Android 앱을 먼저 빌드하는 구성이 가장 빠르다. Android 전용 네이티브 개발을 선택한다면 Kotlin, Jetpack Compose, Supabase Kotlin SDK로 같은 백엔드를 호출할 수 있다. 백엔드 스키마는 어느 쪽에도 종속되지 않는다.

## 회원가입 메타데이터

Supabase 회원가입 때 다음 메타데이터를 함께 보낸다.

```json
{
  "role": "student",
  "display_name": "홍길동"
}
```

`role`은 `student` 또는 `employer`만 허용한다. `admin`은 앱 회원가입으로 만들 수 없다. 구인자는 로그인 후 `onboard_employer` RPC를 호출해 조직과 담당자 정보를 완성한다.

## 로컬 주소

| 실행 위치 | Supabase API 주소 |
|---|---|
| 컴퓨터 브라우저 | `http://127.0.0.1:54321` |
| Android Studio 에뮬레이터 | `http://10.0.2.2:54321` |
| 실제 Android 기기 | 같은 Wi-Fi의 컴퓨터 IP 또는 배포 URL |

HTTP 로컬 통신은 Android 네트워크 보안 설정에서 개발 빌드에만 허용한다. 운영 빌드는 HTTPS Supabase 프로젝트 URL을 사용한다.

## 앱에서 지켜야 할 규칙

- anon key만 앱에 포함한다. service role key는 포함하지 않는다.
- 세션 토큰은 Android Keystore 기반 보안 저장소를 사용한다.
- 게시, 상태 변경, 지원, 제안, 메시지, 완료는 문서의 RPC를 호출한다.
- 재시도 시 동일한 idempotency UUID를 사용한다.
- 결과물과 메시지 파일 경로는 `{사용자ID}/{대화 또는 업무ID}/{무작위 파일명}` 형식을 사용한다.
- 목록은 `created_at`, `id` 기준 cursor pagination으로 읽는다.
- Realtime은 화면 갱신 보조 수단이며, 저장 성공 여부는 RPC 응답으로 판단한다.

## 완성 앱의 Android 화면 흐름

```text
로그인/가입 → 역할 선택 → 역할별 온보딩

학생: 홈 · 일 찾기 · 지원현황 · 메시지 · 프로필
구인자: 홈 · 공고 · 지원자 · 메시지 · 내 정보
```

구인자 공고 작성은 한 화면의 긴 입력지가 아니라 `필요한 도움 → 결과물 → 역량 → 일정 → 보수 → 미리보기`의 6단계 질문형 흐름으로 만든다. 각 화면의 주 행동은 하나만 강조하고, 학생 공고 카드는 제목·조직·난이도·방식·시간·보수·필요 기술·저학년 가능 여부를 우선 표시한다.

