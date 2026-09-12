import os
import uuid
import unittest
from concurrent.futures import ThreadPoolExecutor
from fastapi.testclient import TestClient
import main

class FlowTests(unittest.TestCase):
    def setUp(self):
        main.DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test-" + uuid.uuid4().hex + ".sqlite3")
        self.client = TestClient(main.app)
        self.client.__enter__()
        self.company = self.account("company", "company")
        self.other = self.account("other", "company")
        self.student = self.account("student", "student")

    def tearDown(self):
        self.client.__exit__(None,None,None)
        for suffix in ("", "-wal", "-shm"):
            path = main.DB_PATH + suffix
            if os.path.isfile(path):
                os.remove(path)

    def account(self, name, role):
        data = {"email": name+"@example.com", "password": "test-password-123"}
        r = self.client.post("/auth/register", json={**data,"role":role,"name":name})
        self.assertEqual(r.status_code,201,r.text)
        login = self.client.post("/auth/login",json=data).json()
        return {"id":r.json()["id"], "headers":{"Authorization":"Bearer "+login["access_token"]}}

    def job(self, visibility="public"):
        r = self.client.post("/jobs",headers=self.company["headers"],json={"title":"SNS 콘텐츠 제작","description":"이미지 3장 제작","pay_amount":100000,"duration":"3일","location":"원격","visibility":visibility})
        self.assertEqual(r.status_code,201,r.text)
        return r.json()["id"]

    def test_application_to_completion_and_permissions(self):
        job = self.job()
        self.assertEqual(self.client.post("/jobs",headers=self.student["headers"],json={"title":"x","description":"x","pay_amount":1,"duration":"1일","location":"원격"}).status_code,403)
        url = f"/jobs/{job}/applications"
        self.assertEqual(self.client.post(url,headers=self.student["headers"],json={"message":"지원합니다"}).status_code,201)
        self.assertEqual(self.client.post(url,headers=self.student["headers"],json={"message":"중복"}).status_code,409)
        self.assertEqual(self.client.get(url,headers=self.other["headers"]).status_code,404)
        self.assertEqual(self.client.get(url,headers=self.company["headers"]).status_code,200)
        r = self.client.post(f"/jobs/{job}/offers",headers=self.company["headers"],json={"student_id":self.student["id"]})
        self.assertEqual(r.status_code,201,r.text)
        offer = r.json()["id"]
        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(lambda _: self.client.post(f"/offers/{offer}/accept",headers=self.student["headers"]), range(2)))
        self.assertEqual(sorted(r.status_code for r in responses),[200,409])
        assignment = next(r.json()["assignment_id"] for r in responses if r.status_code == 200)
        self.assertEqual(self.client.post(f"/assignments/{assignment}/complete",headers=self.company["headers"]).status_code,409)
        self.assertEqual(self.client.post(f"/assignments/{assignment}/submit",headers=self.student["headers"]).status_code,200)
        self.assertEqual(self.client.post(f"/assignments/{assignment}/complete",headers=self.other["headers"]).status_code,403)
        self.assertEqual(self.client.post(f"/assignments/{assignment}/complete",headers=self.company["headers"]).json()["status"],"completed")
        self.assertEqual(len(self.client.get("/me/assignments",headers=self.student["headers"]).json()),1)

    def test_private_direct_offer_and_close(self):
        job = self.job("private")
        self.assertEqual(self.client.get("/jobs").json(),[])
        self.assertEqual(self.client.get(f"/jobs/{job}",headers=self.student["headers"]).status_code,404)
        self.assertEqual(self.client.get("/students",headers=self.company["headers"]).json(),[])
        self.client.put("/me/profile",headers=self.student["headers"],json={"name":"학생","skills":"Python","discoverable":True})
        found = self.client.get("/students?q=Python",headers=self.company["headers"]).json()
        self.assertEqual(len(found),1)
        self.assertNotIn("email",found[0])
        r = self.client.post(f"/jobs/{job}/offers",headers=self.company["headers"],json={"student_id":self.student["id"]})
        self.assertEqual(r.status_code,201,r.text)
        self.assertEqual(self.client.get(f"/jobs/{job}",headers=self.student["headers"]).status_code,200)
        self.client.post(f"/jobs/{job}/close",headers=self.company["headers"])
        self.assertEqual(self.client.post(f'/offers/{r.json()["id"]}/accept',headers=self.student["headers"]).status_code,409)

    def test_auth_validation_and_persistence(self):
        self.assertEqual(self.client.get("/me").status_code,401)
        self.assertEqual(self.client.post("/auth/login",json={"email":"student@example.com","password":"wrong-password"}).status_code,401)
        self.assertEqual(self.client.post("/auth/register",json={"email":"student@example.com","password":"test-password-123","name":"x","role":"student"}).status_code,409)
        self.assertEqual(self.client.post("/jobs",headers=self.company["headers"],json={"title":"x","description":"x","pay_amount":-1,"duration":"x","location":"x"}).status_code,422)
        job = self.job()
        main.initialize()
        self.assertEqual(self.client.get("/jobs").json()[0]["id"],job)
        self.client.post("/auth/logout",headers=self.student["headers"])
        self.assertEqual(self.client.get("/me",headers=self.student["headers"]).status_code,401)

    def test_direct_offer_accept_and_decline(self):
        self.client.put("/me/profile",headers=self.student["headers"],json={"name":"학생","discoverable":True})
        for decision in ["accept","decline"]:
            job = self.job("private")
            r = self.client.post(f"/jobs/{job}/offers",headers=self.company["headers"],json={"student_id":self.student["id"]})
            self.assertEqual(r.status_code,201)
            result = self.client.post(f'/offers/{r.json()["id"]}/{decision}',headers=self.student["headers"])
            self.assertEqual(result.status_code,200,result.text)
        self.assertEqual(len(self.client.get("/me/assignments",headers=self.student["headers"]).json()),1)

if __name__ == "__main__":
    unittest.main(verbosity=2)
