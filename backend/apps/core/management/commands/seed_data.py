"""Seed realistic demo data. Safe to re-run (idempotent)."""

import os
from datetime import date

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.academics.models import AcademicTerm, Faculty, Programme
from apps.accounts.models import Role, Student, User, VerificationStatus
from apps.clearance.models import ClearanceRequirement
from apps.core.models import SystemSetting

FACULTIES = {
    "SCI": ("Faculty of Science and Technology", [("BSC-CS", "BSc Computer Science"), ("BSC-IT", "BSc Information Technology")]),
    "BUS": ("Faculty of Commerce and Finance", [("BSC-ACC", "BSc Accounting"), ("BSC-BA", "BSc Business Administration")]),
    "EDU": ("Faculty of Education", [("BED-PRI", "BEd Primary Education")]),
    "LAW": ("Faculty of Law", [("LLB", "Bachelor of Laws (LLB)")]),
    "AGR": ("Faculty of Agriculture", [("BSC-AGR", "BSc Agriculture")]),
    "HLT": ("Faculty of Medicine and Allied Health Sciences", [("BSC-NUR", "BSc Nursing")]),
}

# (code, name, faculty code or None, mandatory, requires_document, hint)
REQUIREMENTS = [
    ("LIB", "Library Clearance", None, False, False, ""),
    ("FIN", "Finance / Tuition Clearance", None, True, True, "Upload your tuition fee receipt for this semester"),
    ("DEPT", "Department Clearance", None, False, False, ""),
    ("HOSTEL", "Hostel Clearance", None, False, False, ""),
    ("SPORTS", "Sports & Equipment Clearance", None, False, False, ""),
    ("LAB", "Laboratory Clearance", "SCI", False, False, ""),
    ("TEACH", "Teaching Practice Report", "EDU", False, True, "Upload your teaching practice report"),
    ("MOOT", "Moot Court Clearance", "LAW", False, False, ""),
    ("CLINIC", "Clinical Placement Clearance", "HLT", False, True, "Upload your clinical logbook sign-off"),
]

SETTINGS = [
    ("digital_service_fee", "50.00", "Digital service fee charged per clearance"),
    ("currency", "GMD", "Currency code for the service fee"),
    ("official_portal_url", "https://www.utg.edu.gm", "Official portal for post-approval handoff"),
]

STUDENTS = [
    ("amie.jallow@example.com", "Amie Jallow", "UTG2022001", "BSC-CS", "7001001"),
    ("lamin.sanneh@example.com", "Lamin Sanneh", "UTG2022002", "BSC-ACC", "7001002"),
    ("fatou.ceesay@example.com", "Fatou Ceesay", "UTG2022003", "BED-PRI", "7001003"),
    ("modou.bah@example.com", "Modou Bah", "UTG2022004", "LLB", "7001004"),
]


class Command(BaseCommand):
    help = "Seed faculties, programmes, requirements, settings, admins and sample students."

    def handle(self, *args, **opts):
        admin_pw = os.environ.get("SEED_ADMIN_PASSWORD")
        student_pw = os.environ.get("SEED_STUDENT_PASSWORD")
        if not admin_pw or not student_pw:
            raise CommandError("Set SEED_ADMIN_PASSWORD and SEED_STUDENT_PASSWORD (see backend/.env.example).")

        faculties = {}
        programmes = {}
        for code, (name, progs) in FACULTIES.items():
            faculties[code], _ = Faculty.objects.update_or_create(code=code, defaults={"name": name})
            for pcode, pname in progs:
                programmes[pcode], _ = Programme.objects.update_or_create(
                    code=pcode, defaults={"name": pname, "faculty": faculties[code]}
                )

        AcademicTerm.objects.update_or_create(
            name="2025/2026 Semester 2",
            defaults={"start_date": date(2026, 1, 12), "end_date": date(2026, 6, 30), "is_current": True},
        )

        for i, (code, name, fac, mandatory, doc, hint) in enumerate(REQUIREMENTS):
            ClearanceRequirement.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "faculty": faculties[fac] if fac else None,
                    "is_mandatory": mandatory,
                    "requires_document": doc,
                    "document_hint": hint,
                    "sort_order": i,
                },
            )

        for key, value, desc in SETTINGS:
            SystemSetting.objects.get_or_create(key=key, defaults={"value": value, "description": desc})

        self._user("superadmin@utg-demo.example", "Super Admin", Role.SUPER_ADMIN, admin_pw, True)
        self._user("admin1@utg-demo.example", "Registrar Officer", Role.ADMIN, admin_pw, True)
        self._user("admin2@utg-demo.example", "Finance Officer", Role.ADMIN, admin_pw, True)

        for email, name, number, prog, phone in STUDENTS:
            user = self._user(email, name, Role.STUDENT, student_pw, False, phone)
            Student.objects.update_or_create(
                user=user,
                defaults={
                    "student_number": number,
                    "programme": programmes[prog],
                    "level": 4,
                    "verification_status": VerificationStatus.VERIFIED,
                    "verified_at": timezone.now(),
                },
            )

        self.stdout.write(self.style.SUCCESS("Seed data ready."))
        self.stdout.write("Admin logins: superadmin@/admin1@/admin2@utg-demo.example")
        self.stdout.write("Student logins: " + ", ".join(s[0] for s in STUDENTS))

    def _user(self, email, name, role, password, staff, phone=""):
        user, created = User.objects.get_or_create(
            email=email, defaults={"full_name": name, "role": role, "is_staff": staff, "phone": phone}
        )
        if created:
            user.set_password(password)
            user.is_superuser = role == Role.SUPER_ADMIN
            user.save()
        return user
