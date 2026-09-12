# 대학생 업무 매칭 서버

Python + FastAPI로 만든 안드로이드 연결용 로컬 MVP입니다. SQLite 파일에 데이터를 보관합니다. 기업 계정 하나가 기업 하나를 나타냅니다. 기업 인증과 학교 인증은 아직 구현하지 않았습니다.

## 실행

이 폴더에서 PowerShell을 열고 실행합니다. 현재 PC에는 필요한 라이브러리가 설치되어 있습니다.

```powershell
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

- API 문서 및 요청 테스트: http://127.0.0.1:8000/docs
- 상태 확인: http://127.0.0.1:8000/health
- API 명세: http://127.0.0.1:8000/openapi.json
- 종료: 실행 터미널에서 Ctrl+C

다른 PC에서 설치하려면 Python 3.11 이상에서:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

## 10분 테스트

`/docs`에서 각 항목을 펼쳐 **Try it out → Execute**를 누릅니다.

1. `POST /auth/register`: 아래처럼 기업 가입. 이어서 다른 이메일과 `role: student`로 학생 가입.
2. `POST /auth/login`: 기업 이메일·비밀번호만 입력. 응답의 `access_token` 복사.
3. 문서 상단 **Authorize**에 토큰 값만 입력.
4. `POST /jobs`: 아래 업무 예시 등록, 반환된 `id` 저장.
5. 학생 로그인 후 Authorize 토큰 교체. `POST /jobs/{job_id}/applications`에 `{"message":"지원합니다"}` 입력.
6. 기업 토큰으로 교체. `GET /jobs/{job_id}/applications`에서 학생 ID 확인.
7. `POST /jobs/{job_id}/offers`에 `{"student_id":학생ID}` 입력.
8. 학생 토큰으로 교체. `GET /me/offers`에서 제안 확인 후 `POST /offers/{offer_id}/accept` 실행.
9. `GET /me/assignments`에서 매칭 확인. 학생이 `submit`, 기업이 `complete` 처리.

직접 제안은 학생이 `PUT /me/profile`에서 `discoverable: true`로 설정한 후, 기업이 `GET /students`로 검색하고 7번부터 진행합니다. 비공개 프로필도 해당 공고에 직접 지원했다면 그 공고의 기업이 제안할 수 있습니다.

가입 예시(테스트 전용 비밀번호이며 본인 값으로 변경):

```json
{"email":"company@example.com","password":"demo-password-123","role":"company","name":"테스트 기업"}
```

업무 예시:

```json
{
  "title":"SNS 콘텐츠 제작",
  "description":"인스타그램 이미지 3장 제작",
  "pay_amount":100000,
  "duration":"2026-09-20까지, 예상 5시간",
  "location":"원격",
  "visibility":"public"
}
```

`pay_amount`는 원 단위 총 보수입니다. `private` 업무는 공개 목록에 나오지 않으며 소유 기업과 제안받은 학생만 상세 조회할 수 있습니다. 제안 시 업무 조건을 복사해 보관합니다. 공고 마감 시 대기 중 제안도 취소되며 기존 매칭은 유지됩니다. 공고별 여러 학생을 매칭할 수 있습니다.

## 안드로이드 연결

- Android Studio 기본 에뮬레이터에서 API 기본 주소: `http://10.0.2.2:8000/`
- 인증 요청 헤더: `Authorization: Bearer 로그인에서_받은_access_token`
- JSON 요청 헤더: `Content-Type: application/json`
- 토큰 유효기간 24시간, 로그아웃 시 해당 토큰 폐기.
- 실제 휴대폰을 USB 디버깅으로 연결하면 `adb reverse tcp:8000 tcp:8000` 실행 후 앱에서 `http://127.0.0.1:8000/` 사용 가능.
- 앱의 기본 `AndroidManifest.xml`에 `<uses-permission android:name="android.permission.INTERNET" />` 필요.
- 로컬 HTTP 개발용으로 `app/src/debug/AndroidManifest.xml`에만 아래 설정을 적용합니다. 배포용 앱은 HTTPS 서버 주소를 사용합니다.

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:usesCleartextTraffic="true" />
</manifest>
```

에뮬레이터 설정에 따라 연결이 다를 수 있습니다. 먼저 앱을 실행할 PC의 브라우저에서 `/health`를 확인하세요.

## 오류 및 검증

오류 응답은 `{"detail":"설명"}`입니다. 입력 검증 오류(422)의 detail은 필드별 오류 배열입니다. 401은 로그인 필요/만료, 403은 권한 없음, 404는 조회 불가, 409는 중복 또는 상태 충돌입니다.

```powershell
python -m unittest -v
```

테스트는 임시 DB를 사용하여 실제 데이터에 영향을 주지 않습니다. 두 매칭 경로, 중복/동시 수락, 타 기업 접근, 비공개 공고, 마감, 로그인 및 완료 순서를 검증합니다.

## 현재 범위

로컬 개발 서버이며 인터넷 배포는 아직 하지 않았습니다. 실행 중인 PC가 꺼지면 연결되지 않습니다. 실제 사용자 공개 전에 HTTPS 호스팅, 기업·학교 확인, 로그인 요청 제한, 개인정보 운영 정책, 백업 및 운영 DB 전환을 구현해야 합니다. 결제·정산·채팅·파일 업로드·푸시 알림·비밀번호 재설정은 포함하지 않습니다. 현재 지원 취소/재지원, 제안 재발송, 공고 수정, 기업 다중 담당자는 미구현입니다.

FastAPI 실행과 자동 문서 참고: https://fastapi.tiangolo.com/tutorial/first-steps/
