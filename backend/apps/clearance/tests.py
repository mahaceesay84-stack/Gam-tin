import shutil
import tempfile
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.core.models import SystemSetting

MEDIA = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=MEDIA)
class ClearanceFlowTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        import os

        os.environ["SEED_ADMIN_PASSWORD"] = "AdminPass#2026"
        os.environ["SEED_STUDENT_PASSWORD"] = "StudentPass#2026"
        call_command("seed_data", verbosity=0)

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA, ignore_errors=True)

    def login(self, email, password, path="/api/auth/login/"):
        res = self.client.post(path, {"email": email, "password": password}, format="json")
        self.assertEqual(res.status_code, 200, res.content)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        return res.data

    def student_login(self):
        return self.login("amie.jallow@example.com", "StudentPass#2026")

    def admin_login(self, email="admin1@utg-demo.example"):
        return self.login(email, "AdminPass#2026", "/api/auth/admin-login/")

    def create_and_submit(self):
        self.student_login()
        res = self.client.post("/api/clearance/applications/", {}, format="json")
        self.assertEqual(res.status_code, 201, res.content)
        app = res.data
        for item in app["items"]:
            req = item["requirement"]
            if req["requires_document"]:
                up = self.client.post(
                    f"/api/clearance/applications/{app['id']}/documents/",
                    {"requirement": req["id"], "file": SimpleUploadedFile("doc.pdf", b"%PDF-1.4 test")},
                    format="multipart",
                )
                self.assertEqual(up.status_code, 201, up.content)
        res = self.client.post(f"/api/clearance/applications/{app['id']}/submit/")
        self.assertEqual(res.status_code, 200, res.content)
        return res.data

    def test_fee_is_dynamic(self):
        self.assertEqual(self.client.get("/api/fee/").data["amount"], "50.00")
        SystemSetting.objects.filter(key="digital_service_fee").update(value="75")
        self.assertEqual(SystemSetting.digital_service_fee(), Decimal("75.00"))

    def test_roles_are_separated(self):
        res = self.client.post(
            "/api/auth/admin-login/",
            {"email": "amie.jallow@example.com", "password": "StudentPass#2026"},
            format="json",
        )
        self.assertEqual(res.status_code, 401)
        self.student_login()
        self.assertEqual(self.client.get("/api/clearance/admin/applications/").status_code, 403)
        self.assertEqual(self.client.get("/api/admin/settings/").status_code, 403)
        self.admin_login()
        self.assertEqual(self.client.get("/api/admin/settings/").status_code, 403)
        self.assertEqual(self.client.get("/api/clearance/applications/").status_code, 403)
        self.admin_login("superadmin@utg-demo.example")
        self.assertEqual(self.client.get("/api/admin/settings/").status_code, 200)

    def test_registration(self):
        from apps.academics.models import Programme

        res = self.client.post(
            "/api/auth/register/",
            {
                "email": "new@example.com",
                "password": "Str0ng!Passw0rd",
                "full_name": "New Student",
                "student_number": "utg2022999",
                "programme": Programme.objects.first().id,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(res.data["user"]["student"]["student_number"], "UTG2022999")

    def test_full_flow_approve(self):
        app = self.create_and_submit()
        self.assertRegex(app["reference"], r"^CLR-\d{4}-\d{6}$")
        self.assertEqual(app["fee_amount"], "50.00")

        # Approval blocked until paid
        self.admin_login()
        res = self.client.post(f"/api/clearance/admin/applications/{app['id']}/approve/")
        self.assertEqual(res.status_code, 400)

        self.student_login()
        res = self.client.post(
            f"/api/payments/applications/{app['id']}/pay/", {"method": "wave", "phone": "7001001"}, format="json"
        )
        self.assertEqual(res.status_code, 201, res.content)
        self.assertRegex(res.data["reference"], r"^PAY-\d{4}-\d{6}$")

        self.admin_login()
        listing = self.client.get("/api/clearance/admin/applications/?search=Amie&payment_status=paid")
        self.assertEqual(listing.data["count"], 1)
        res = self.client.post(f"/api/clearance/admin/applications/{app['id']}/approve/")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.data["status"], "approved")
        self.assertIsNotNone(res.data["handoff"])

        self.student_login()
        notes = self.client.get("/api/notifications/")
        self.assertTrue(any("approved" in n["title"].lower() for n in notes.data["results"]))

    def test_correction_and_reject_require_reason(self):
        app = self.create_and_submit()
        self.admin_login()
        url = f"/api/clearance/admin/applications/{app['id']}"
        self.assertEqual(self.client.post(f"{url}/reject/", {}, format="json").status_code, 400)
        res = self.client.post(f"{url}/request-correction/", {"reason": "Blurry receipt"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "correction_requested")
        self.student_login()
        res = self.client.post(f"/api/clearance/applications/{app['id']}/submit/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["reference"], app["reference"])

    def test_failed_payment_and_duplicate_protection(self):
        app = self.create_and_submit()
        url = f"/api/payments/applications/{app['id']}/pay/"
        res = self.client.post(url, {"method": "wave", "phone": "7000000"}, format="json")
        self.assertEqual(res.status_code, 402)
        first = self.client.post(url, {"method": "wave", "phone": "7001001"}, format="json")
        second = self.client.post(url, {"method": "qmoney", "phone": "7001001"}, format="json")
        self.assertEqual(first.data["reference"], second.data["reference"])

    def test_upload_validation_and_privacy(self):
        self.student_login()
        app = self.client.post("/api/clearance/applications/", {}, format="json").data
        req = next(i["requirement"] for i in app["items"] if i["requirement"]["requires_document"])
        bad = self.client.post(
            f"/api/clearance/applications/{app['id']}/documents/",
            {"requirement": req["id"], "file": SimpleUploadedFile("x.exe", b"MZ")},
            format="multipart",
        )
        self.assertEqual(bad.status_code, 400)
        ok = self.client.post(
            f"/api/clearance/applications/{app['id']}/documents/",
            {"requirement": req["id"], "file": SimpleUploadedFile("r.pdf", b"%PDF")},
            format="multipart",
        )
        doc_id = ok.data["id"]
        self.assertEqual(self.client.get(f"/api/clearance/documents/{doc_id}/download/").status_code, 200)
        other = User.objects.get(email="lamin.sanneh@example.com")
        self.client.force_authenticate(other)
        self.assertEqual(self.client.get(f"/api/clearance/documents/{doc_id}/download/").status_code, 404)
