# NewbieThon
고려대학교 뉴비톤 깃허브

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
