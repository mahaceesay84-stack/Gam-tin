from django.test import TestCase


class ApiIndexTests(TestCase):
    def test_root_returns_index(self):
        r = self.client.get("/api/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("name", r.json())
