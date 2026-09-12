# NewbieThon
고려대학교 뉴비톤 우승 후보자의 깃허브

## 백엔드

대학생과 기업의 단기 업무 매칭 API입니다. Python + FastAPI + SQLite로 구성했습니다.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

- API 테스트 화면: http://127.0.0.1:8000/docs
- Android Studio 에뮬레이터 주소: `http://10.0.2.2:8000/`
- [API 사용법과 앱 연결 안내](backend/README.md)
- 테스트: `backend` 폴더에서 `.\.venv\Scripts\python -m unittest -v`

회원가입·로그인, 공고 등록·조회, 학생 지원, 기업 제안·수락, 매칭·완료 처리를 제공합니다. 현재 로컬 MVP이며 인터넷 배포와 결제·정산은 포함하지 않습니다.

## 프론트엔드 (앱)

React Native + Expo + TypeScript(strict) + Expo Router 기반 모바일 앱입니다.

### 실행 방법

```powershell
npm install
npm run android   # 또는 npm run ios / npm run web
```

`npm run web`으로 실행하면 브라우저에서도 대부분의 화면을 바로 확인할 수 있어요 (빠른 확인용, 최종 검증은 실기기/에뮬레이터 권장).

### 개발 스크립트

```powershell
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint (eslint-config-expo)
```

### 현재 상태 (백엔드 미연동)

학생 화면은 아직 실제 백엔드(FastAPI)와 연결되지 않았고, `src/repositories/mock/`의 목데이터와 AsyncStorage로 완전히 동작해요. 화면은 `src/repositories/interfaces/`에 정의된 인터페이스에만 의존하므로, 이후 실제 API를 호출하는 repository 구현으로 교체하면 화면 코드는 그대로 유지돼요.

**완성된 핵심 흐름**: 회원가입 → 역할 선택 → 학생 온보딩(5단계) → 맞춤 공고 홈/검색 → 공고 상세 → 간편 지원(3단계) → 지원 현황 확인. 앱을 종료했다 다시 열어도 로그인 세션과 온보딩 진행 상태가 복구돼요.

**받은 제안**: 역할을 학생으로 선택하면 데모용 제안 1건이 자동으로 생성돼요 (지원 탭 → 받은 제안).

**아직 미구현**: 실시간 메시지(대화방 데이터), 저장한 공고 전용 목록 화면, 완료한 유료 업무 경험 카드, 자동화 테스트. 메시지 탭과 프로필의 완료 업무 영역은 빈 상태(EmptyState)로 정직하게 표시돼요.

### 환경변수

현재는 환경변수가 필요 없어요 (전부 mock repository로 동작). 실제 API를 연결할 때는 `.env.local`에 아래와 같이 추가하고 커밋하지 마세요.

```
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000
```

### 폴더 소유권 (개발자 1 / 프론트엔드)

`app/(auth)/`, `app/(student)/`, `src/components/`, `src/features/student/`, `src/repositories/mock/`. `supabase/`, `backend/`, `app/(employer)/`, `src/features/employer/`, `src/repositories/supabase/`는 개발자 2 소유이며 수정하지 않았어요.
