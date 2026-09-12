# 백엔드 계약

## 구조 선택

백엔드는 Supabase의 Auth, PostgreSQL, Row Level Security, Storage, Realtime을 사용한다. Android 앱에는 공개용 anon key만 저장하고, 사용자의 JWT와 RLS로 접근 범위를 제한한다. service role key는 운영 서버나 CI 비밀값으로만 사용한다.

## 핵심 관계

```text
auth.users ─ users ─ student_profiles ─ student_skills
                  └ employer_profiles ─ organizations ─ jobs
                                                     ├ applications ─ conversations ─ messages
                                                     ├ job_offers ─── conversations ─ messages
                                                     └ engagements ─ deliverables
                                                                  └ reviews
                  └ competitions ─ competition_teams ─ team_role_openings
                                                       ├ team_applications
                                                       ├ team_members
                                                       └ conversations ─ messages
```

지원 시점의 학생 정보는 `applications.profile_snapshot`에 보관한다. 현재 프로필 변경과 지원 당시 정보를 구분하기 위한 것이다.

## 클라이언트가 호출할 주요 RPC

| RPC | 호출 주체 | 목적 |
|---|---|---|
| `onboard_employer` | 구인자 | 조직, 조직 소유자, 구인자 프로필을 한 번에 생성 |
| `submit_employer_verification` | 구인자 | 비공개 인증 파일 경로 제출 |
| `validate_job_for_publish` | 공고 작성자 | 필수 필드와 정책 검증 결과 확인 |
| `publish_job` | 공고 작성자 | 검증 후 게시, 중복 클릭 방지 |
| `change_job_status` | 공고 작성자 | 일시 중지, 마감, 채용 완료 |
| `apply_to_job` | 학생 | 서버가 프로필 snapshot을 만들어 지원 |
| `apply_to_job_v2` | 학생 | 일정·간단 답변을 포함해 지원 |
| `change_application_status` | 구인자 | 허용된 지원 상태 전환과 알림 생성 |
| `send_job_offer` | 구인자 | 공개 동의 학생에게 게시 공고로 제안 |
| `respond_to_offer` | 학생 | 제안 수락·거절, 수락 시 대화 생성 |
| `create_engagement` | 구인자 | 수락된 지원·제안으로 합의 업무 생성 |
| `start_engagement` | 구인자 | 확인한 업무를 진행 중으로 변경 |
| `submit_deliverable` | 학생 | 결과물 제출과 중복 방지 |
| `request_revision` | 구인자 | 결과물 수정 요청 |
| `complete_engagement` | 구인자 | 완료 승인과 학생의 유료 경험 생성 |
| `send_message` | 참여자 | 참여 권한·중복 전송 검증 후 메시지 생성 |
| `create_review` | 양측 | 완료 업무에 한해 한 방향당 1회 평가 |
| `select_role` | 신규 사용자 | 가입 후 학생·구인자 유형을 한 번만 선택 |
| `create_competition_team` | 학생 | 대회 팀과 모집 역할을 한 번에 생성 |
| `apply_to_team` | 학생 | 원하는 역할로 팀 합류 지원 |
| `respond_to_team_application` | 팀장 | 팀 지원 수락·거절, 수락 시 단체 대화 초대 |
| `accept_application_and_create_engagement` | 구인자 | 지원 수락과 업무 생성을 한 트랜잭션으로 처리 |

UUID 형식의 `idempotency_key`와 `client_message_id`는 Android 클라이언트에서 요청을 만들 때 한 번 생성하고, 네트워크 재시도에서도 같은 값을 다시 사용한다.

## 상태 전환

```text
공고: draft → published ↔ paused → closed
                       └─────────→ filled

지원: submitted → viewed → chatting ↔ interview → accepted | rejected
                                      rejected → viewed(명시적 재검토)

업무: ready → in_progress → submitted → completed
                            ↖ revision_requested
```

```text
팀 지원: pending → accepted | rejected | withdrawn
팀: recruiting → full | closed
```

지원 상태와 업무 상태는 테이블을 직접 수정하지 않고 RPC로만 변경한다. 각 변경은 알림과 감사 로그를 같은 트랜잭션에서 생성한다.

## 공개 범위

- 학생 프로필은 본인 또는 `discoverable=true`인 경우에만 기본 조회된다.
- 지원자는 지원 당시 snapshot으로 검토한다.
- 게시 중이며 마감 전인 공고만 일반 학생이 조회한다.
- 대화와 메시지는 참여자만 조회한다.
- 결과물·인증 자료는 비공개 bucket에 저장하고 권한 확인 후 signed URL을 사용한다.
- 이메일은 공개 사용자 테이블에 저장하지 않는다. 구인자 업무 이메일은 본인과 관리자만 직접 조회한다.

## 아직 외부 연동이 필요한 항목

- 학교·사업자·실명 인증 제공자
- 푸시 알림 제공자(인앱 알림 데이터는 구현됨)
- 악성 콘텐츠 자동 필터와 운영자 검수 화면
- 실제 급여 지급·에스크로·세금 처리
- 프로덕션 모니터링과 백업 정책
