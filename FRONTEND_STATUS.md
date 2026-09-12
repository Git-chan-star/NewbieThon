# 잇구 통합 구현 현황

브랜치: `codex/integrated-mvp`

## 완료

- [x] `feat/frontend`와 `codex/backend-marketplace-mvp` 통합
- [x] Expo SDK 57 앱 설정과 Supabase 의존성 단일화
- [x] 공통 계약을 `src/domain/contracts/types.ts`로 단일화하고 DB enum 변환 계층 추가
- [x] 첨부 Flutter 시안의 색상, 타이포, 여백, 버튼, 입력창, 선택 카드 규칙 적용
- [x] 앱 이름과 Android 패키지를 `잇구`, `com.newbiethon.itgu`로 설정
- [x] 환경값 유무에 따라 mock/Supabase 저장소 자동 전환
- [x] 실제 Supabase 인증, 가입 후 학생·구인자 역할 선택, 역할별 온보딩
- [x] 학생 프로필·기술·과목·프로젝트 실제 저장
- [x] 공고 추천·검색·상세·저장·지원·제안 실제 저장
- [x] 구인자 프로필·공고 게시·지원자 검토·학생 검색 화면
- [x] 대회 공고·팀 생성·역할 모집·팀 지원·수락 흐름
- [x] 업무/팀 통합 대화 목록과 메시지 전송
- [x] 지원 수락 후 업무 생성, 시작, 결과물 제출, 수정 요청, 완료 흐름
- [x] PostgreSQL RLS, 상태 전환 RPC, 알림, 감사 로그, 비공개 Storage 정책
- [x] 관리자 전용 로그인 분기와 운영 현황·회원·공고·구인자 인증·신고 관리 화면
- [x] 관리자 전용 DB 함수, 일반 사용자 접근 차단, 감사 로그, 최초 관리자 생성 도구
- [x] 운영 빌드에서 미연결 예시 DB 사용 차단
- [x] TypeScript·ESLint·PostgreSQL 마이그레이션 테스트

## 실제 배포 전에 필요한 작업

- [ ] 팀 Supabase 프로젝트를 만들고 환경값 등록
- [ ] 원격 DB에 마이그레이션 적용 후 학생/구인자 2계정 통합 테스트
- [ ] Android 에뮬레이터와 실제 기기에서 전체 클릭 테스트
- [ ] EAS 프로젝트 연결, 앱 아이콘·스플래시 최종 교체, APK/AAB 빌드
- [ ] 학교 이메일·사업자 인증 방식 결정
- [ ] 원격 Supabase에서 실제 관리자 계정을 생성하고 비밀번호를 비밀 관리 도구에 보관
- [ ] 푸시 알림, 개인정보처리방침·이용약관
- [ ] 결제/정산을 앱 안에서 제공할 경우 별도 법무·세무·결제 설계

## 검증 명령

```bash
npm run verify
EXPO_NO_TELEMETRY=1 npx expo export --platform web
```

환경값 없이 실행하면 mock 모드이므로 UI 발표를 바로 연습할 수 있습니다. 실제 데이터 통합 테스트는 `.env.local`에 `EXPO_PUBLIC_SUPABASE_URL`과 `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 설정해야 합니다.
