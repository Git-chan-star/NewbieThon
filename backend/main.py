"""Student/company matching MVP. Run: python -m uvicorn main:app"""
import hashlib
import hmac
import os
from pathlib import Path
import secrets
import sqlite3
import time
from contextlib import contextmanager, asynccontextmanager
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field

DB_PATH = os.getenv("DB_PATH", str(Path(__file__).with_name("data.sqlite3")))

@contextmanager
def database():
    db = sqlite3.connect(DB_PATH, timeout=15)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def initialize():
    with database() as db:
        db.execute("PRAGMA journal_mode=WAL")
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
          role TEXT NOT NULL, name TEXT NOT NULL, school TEXT NOT NULL DEFAULT '',
          skills TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', discoverable INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS jobs (
          id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL,
          description TEXT NOT NULL, pay_amount INTEGER NOT NULL, duration TEXT NOT NULL,
          location TEXT NOT NULL, visibility TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open');
        CREATE TABLE IF NOT EXISTS applications (
          id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES jobs(id), student_id INTEGER NOT NULL REFERENCES users(id),
          message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'applied', UNIQUE(job_id, student_id));
        CREATE TABLE IF NOT EXISTS offers (
          id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES jobs(id), student_id INTEGER NOT NULL REFERENCES users(id),
          title TEXT NOT NULL, description TEXT NOT NULL, pay_amount INTEGER NOT NULL, duration TEXT NOT NULL,
          location TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', UNIQUE(job_id, student_id));
        CREATE TABLE IF NOT EXISTS assignments (
          id INTEGER PRIMARY KEY, offer_id INTEGER UNIQUE NOT NULL REFERENCES offers(id), status TEXT NOT NULL DEFAULT 'in_progress');
        CREATE INDEX IF NOT EXISTS jobs_company ON jobs(company_id);
        CREATE INDEX IF NOT EXISTS applications_student ON applications(student_id);
        CREATE INDEX IF NOT EXISTS offers_student ON offers(student_id);
        """)

@asynccontextmanager
async def lifespan(app):
    initialize()
    yield

app = FastAPI(title="대학생 업무 매칭 API", version="0.1.0", lifespan=lifespan,
              description="로컬 MVP. 기업 계정 하나가 기업 한 곳을 나타냅니다. 금액은 원 단위 총 보수입니다.")
security = HTTPBearer(auto_error=False)

class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

class Credentials(Input):
    email: str = Field(min_length=5, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    password: str = Field(min_length=10, max_length=128)

class Register(Credentials):
    role: Literal["student", "company"]
    name: str = Field(min_length=1, max_length=100)

class Profile(Input):
    name: str = Field(min_length=1, max_length=100)
    school: str = Field(default="", max_length=100)
    skills: str = Field(default="", max_length=500)
    bio: str = Field(default="", max_length=2000)
    discoverable: bool = False

class JobInput(Input):
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1, max_length=5000)
    pay_amount: int = Field(ge=1, le=100000000)
    duration: str = Field(min_length=1, max_length=200)
    location: str = Field(min_length=1, max_length=200)
    visibility: Literal["public", "private"] = "public"

class ApplicationInput(Input):
    message: str = Field(min_length=1, max_length=2000)

class OfferInput(Input):
    student_id: int = Field(gt=0)

def fail(code, message):
    raise HTTPException(code, message)

def row(db, sql, args=()):
    result = db.execute(sql, args).fetchone()
    if result is None:
        fail(404, "대상을 찾을 수 없습니다.")
    return dict(result)

def rows(db, sql, args=()):
    return [dict(r) for r in db.execute(sql, args).fetchall()]

def public_user(user):
    return {k: v for k, v in user.items() if k != "password"}

def password_hash(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
    return salt + ":" + digest

def current_user(auth: HTTPAuthorizationCredentials | None = Depends(security)):
    if auth is None:
        fail(401, "로그인이 필요합니다.")
    digest = hashlib.sha256(auth.credentials.encode()).hexdigest()
    with database() as db:
        result = db.execute("SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires>?",
                            (digest, int(time.time()))).fetchone()
    if result is None:
        fail(401, "로그인이 만료되었거나 토큰이 올바르지 않습니다.")
    return dict(result)

def require(user, role):
    if user["role"] != role:
        fail(403, "이 계정 유형으로는 사용할 수 없습니다.")

@app.get("/health", tags=["상태"])
def health():
    with database() as db:
        db.execute("SELECT 1")
    return {"status": "ok"}

@app.post("/auth/register", status_code=201, tags=["인증"])
def register(body: Register):
    with database() as db:
        try:
            cursor = db.execute("INSERT INTO users(email,password,role,name) VALUES(?,?,?,?)",
                                (body.email.lower(), password_hash(body.password), body.role, body.name))
        except sqlite3.IntegrityError:
            fail(409, "이미 가입한 이메일입니다.")
        return public_user(row(db, "SELECT * FROM users WHERE id=?", (cursor.lastrowid,)))

@app.post("/auth/login", tags=["인증"])
def login(body: Credentials):
    with database() as db:
        found = db.execute("SELECT * FROM users WHERE email=?", (body.email.lower(),)).fetchone()
        stored = found["password"] if found else password_hash("invalid-password")
        if not hmac.compare_digest(password_hash(body.password, stored.split(":")[0]), stored) or found is None:
            fail(401, "이메일 또는 비밀번호를 확인하세요.")
        token = secrets.token_urlsafe(32)
        db.execute("DELETE FROM sessions WHERE expires<=?", (int(time.time()),))
        db.execute("INSERT INTO sessions VALUES(?,?,?)", (hashlib.sha256(token.encode()).hexdigest(), found["id"], int(time.time()) + 86400))
        return {"access_token": token, "token_type": "bearer", "expires_in": 86400, "user": public_user(dict(found))}

@app.post("/auth/logout", tags=["인증"])
def logout(user=Depends(current_user), auth=Depends(security)):
    with database() as db:
        db.execute("DELETE FROM sessions WHERE token_hash=?", (hashlib.sha256(auth.credentials.encode()).hexdigest(),))
    return {"ok": True}

@app.get("/me", tags=["프로필"])
def me(user=Depends(current_user)):
    return public_user(user)

@app.put("/me/profile", tags=["프로필"])
def update_profile(body: Profile, user=Depends(current_user)):
    with database() as db:
        db.execute("UPDATE users SET name=?,school=?,skills=?,bio=?,discoverable=? WHERE id=?",
                   (body.name, body.school, body.skills, body.bio, int(body.discoverable), user["id"]))
        return public_user(row(db, "SELECT * FROM users WHERE id=?", (user["id"],)))

@app.get("/students", tags=["프로필"])
def students(q: str = Query(default="", max_length=100), limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0), user=Depends(current_user)):
    require(user, "company")
    with database() as db:
        return rows(db, "SELECT id,name,school,skills,bio FROM users WHERE role='student' AND discoverable=1 AND (instr(skills,?)>0 OR instr(school,?)>0 OR instr(name,?)>0) ORDER BY id DESC LIMIT ? OFFSET ?", (q,q,q,limit,offset))

@app.post("/jobs", status_code=201, tags=["업무"])
def create_job(body: JobInput, user=Depends(current_user)):
    require(user, "company")
    with database() as db:
        cursor = db.execute("INSERT INTO jobs(company_id,title,description,pay_amount,duration,location,visibility) VALUES(?,?,?,?,?,?,?)",
                            (user["id"], body.title, body.description, body.pay_amount, body.duration, body.location, body.visibility))
        return row(db, "SELECT * FROM jobs WHERE id=?", (cursor.lastrowid,))

@app.get("/jobs", tags=["업무"])
def jobs(q: str = Query("", max_length=100), limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    with database() as db:
        return rows(db, "SELECT j.*,u.name AS company_name FROM jobs j JOIN users u ON u.id=j.company_id WHERE visibility='public' AND status='open' AND instr(title,?)>0 ORDER BY j.id DESC LIMIT ? OFFSET ?", (q,limit,offset))

@app.get("/me/jobs", tags=["업무"])
def my_jobs(user=Depends(current_user)):
    require(user, "company")
    with database() as db:
        return rows(db, "SELECT * FROM jobs WHERE company_id=? ORDER BY id DESC", (user["id"],))

@app.get("/jobs/{job_id}", tags=["업무"])
def job_detail(job_id: int, user=Depends(current_user)):
    with database() as db:
        job = row(db, "SELECT * FROM jobs WHERE id=?", (job_id,))
        if job["visibility"] == "private" and job["company_id"] != user["id"]:
            if not db.execute("SELECT 1 FROM offers WHERE job_id=? AND student_id=?", (job_id,user["id"])).fetchone():
                fail(404, "대상을 찾을 수 없습니다.")
        return job

@app.post("/jobs/{job_id}/close", tags=["업무"])
def close_job(job_id: int, user=Depends(current_user)):
    require(user, "company")
    with database() as db:
        db.execute("BEGIN IMMEDIATE")
        row(db, "SELECT id FROM jobs WHERE id=? AND company_id=?", (job_id,user["id"]))
        db.execute("UPDATE jobs SET status='closed' WHERE id=?", (job_id,))
        db.execute("UPDATE offers SET status='cancelled' WHERE job_id=? AND status='pending'", (job_id,))
        return {"status": "closed"}

@app.post("/jobs/{job_id}/applications", status_code=201, tags=["지원"])
def apply(job_id: int, body: ApplicationInput, user=Depends(current_user)):
    require(user, "student")
    with database() as db:
        db.execute("BEGIN IMMEDIATE")
        job = row(db, "SELECT * FROM jobs WHERE id=? AND visibility='public'", (job_id,))
        if job["status"] != "open": fail(409, "모집이 마감되었습니다.")
        try:
            cur = db.execute("INSERT INTO applications(job_id,student_id,message) VALUES(?,?,?)", (job_id,user["id"],body.message))
        except sqlite3.IntegrityError:
            fail(409, "이미 지원한 업무입니다.")
        return row(db, "SELECT * FROM applications WHERE id=?", (cur.lastrowid,))

@app.get("/me/applications", tags=["지원"])
def my_applications(user=Depends(current_user)):
    require(user, "student")
    with database() as db:
        return rows(db, "SELECT a.*,j.title FROM applications a JOIN jobs j ON j.id=a.job_id WHERE student_id=? ORDER BY a.id DESC", (user["id"],))

@app.get("/jobs/{job_id}/applications", tags=["지원"])
def applicants(job_id: int, user=Depends(current_user)):
    require(user, "company")
    with database() as db:
        row(db, "SELECT id FROM jobs WHERE id=? AND company_id=?", (job_id,user["id"]))
        return rows(db, "SELECT a.*,u.name,u.school,u.skills,u.bio FROM applications a JOIN users u ON u.id=a.student_id WHERE job_id=? ORDER BY a.id DESC", (job_id,))

@app.post("/jobs/{job_id}/offers", status_code=201, tags=["제안"])
def offer(job_id: int, body: OfferInput, user=Depends(current_user)):
    require(user, "company")
    with database() as db:
        db.execute("BEGIN IMMEDIATE")
        job = row(db, "SELECT * FROM jobs WHERE id=? AND company_id=?", (job_id,user["id"]))
        if job["status"] != "open": fail(409, "모집이 마감되었습니다.")
        student = row(db, "SELECT * FROM users WHERE id=? AND role='student'", (body.student_id,))
        application = db.execute("SELECT id FROM applications WHERE job_id=? AND student_id=?", (job_id,body.student_id)).fetchone()
        if not student["discoverable"] and not application: fail(403, "이 학생은 직접 제안을 받지 않습니다.")
        try:
            cur = db.execute("INSERT INTO offers(job_id,student_id,title,description,pay_amount,duration,location) VALUES(?,?,?,?,?,?,?)",
                             (job_id,body.student_id,job["title"],job["description"],job["pay_amount"],job["duration"],job["location"]))
        except sqlite3.IntegrityError:
            fail(409, "이미 제안한 학생입니다.")
        db.execute("UPDATE applications SET status='offered' WHERE job_id=? AND student_id=?", (job_id,body.student_id))
        return row(db, "SELECT * FROM offers WHERE id=?", (cur.lastrowid,))

@app.get("/me/offers", tags=["제안"])
def my_offers(user=Depends(current_user)):
    with database() as db:
        field = "o.student_id" if user["role"] == "student" else "j.company_id"
        return rows(db, f"SELECT o.*,j.company_id FROM offers o JOIN jobs j ON j.id=o.job_id WHERE {field}=? ORDER BY o.id DESC", (user["id"],))

@app.post("/offers/{offer_id}/{decision}", tags=["제안"])
def decide_offer(offer_id: int, decision: Literal["accept", "decline"], user=Depends(current_user)):
    require(user, "student")
    with database() as db:
        db.execute("BEGIN IMMEDIATE")
        item = row(db, "SELECT * FROM offers WHERE id=? AND student_id=?", (offer_id,user["id"]))
        if item["status"] != "pending": fail(409, "이미 처리된 제안입니다.")
        status = "accepted" if decision == "accept" else "declined"
        db.execute("UPDATE offers SET status=? WHERE id=?", (status,offer_id))
        db.execute("UPDATE applications SET status=? WHERE job_id=? AND student_id=?", (status,item["job_id"],user["id"]))
        if decision == "accept":
            cur = db.execute("INSERT INTO assignments(offer_id) VALUES(?)", (offer_id,))
            return {"status": status, "assignment_id": cur.lastrowid}
        return {"status": status}

@app.get("/me/assignments", tags=["매칭"])
def assignments(user=Depends(current_user)):
    with database() as db:
        field = "o.student_id" if user["role"] == "student" else "j.company_id"
        return rows(db, f"SELECT a.id,a.status,a.offer_id,o.job_id,o.student_id,o.title,o.description,o.pay_amount,o.duration,o.location,j.company_id FROM assignments a JOIN offers o ON o.id=a.offer_id JOIN jobs j ON j.id=o.job_id WHERE {field}=? ORDER BY a.id DESC", (user["id"],))

@app.post("/assignments/{assignment_id}/{action}", tags=["매칭"])
def assignment_action(assignment_id: int, action: Literal["submit", "complete"], user=Depends(current_user)):
    with database() as db:
        db.execute("BEGIN IMMEDIATE")
        item = row(db, "SELECT a.*,o.student_id,j.company_id FROM assignments a JOIN offers o ON o.id=a.offer_id JOIN jobs j ON j.id=o.job_id WHERE a.id=?", (assignment_id,))
        owner = item["student_id"] if action == "submit" else item["company_id"]
        if owner != user["id"]: fail(403, "처리 권한이 없습니다.")
        expected, target = ("in_progress", "submitted") if action == "submit" else ("submitted", "completed")
        if item["status"] != expected: fail(409, "현재 상태에서 처리할 수 없습니다.")
        db.execute("UPDATE assignments SET status=? WHERE id=?", (target,assignment_id))
        return {"id": assignment_id, "status": target}
