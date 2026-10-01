# Database schema

The original `docs/schema.md` was not available when the MVP was built, so this
schema was designed from the model list in the build brief. All tables are
managed by Django migrations (`backend/apps/*/migrations`). Database: PostgreSQL.

| Model | App | Key fields |
| --- | --- | --- |
| `User` | accounts | `email` (unique, login), `full_name`, `phone`, `role` (`student` / `admin` / `super_admin`), `is_active` |
| `Student` | accounts | `user` (1:1), `student_number` (unique), `programme` FK, `level`, `expected_graduation_year`, `verification_status` (`pending`/`verified`/`rejected`), `verified_at` |
| `Faculty` | academics | `code` (unique), `name` |
| `Programme` | academics | `faculty` FK, `code` (unique), `name`, `duration_years`, `is_active` |
| `AcademicTerm` | academics | `name` (unique), `start_date`, `end_date`, `is_current` |
| `ClearanceRequirement` | clearance | `code` (unique), `name`, `faculty` FK (null = all faculties), `is_mandatory`, `requires_document`, `document_hint`, `sort_order`, `is_active` |
| `ClearanceApplication` | clearance | `reference` (`CLR-YYYY-XXXXXX`, set on submit), `student` FK, `term` FK, `status` (`draft`/`submitted`/`correction_requested`/`approved`/`rejected`), `student_notes`, `fee_amount` + `fee_currency` (snapshot of the fee at submission), `submitted_at`, `reviewed_by` FK, `reviewed_at`, `decision_reason` |
| `ClearanceApplicationItem` | clearance | `application` FK, `requirement` FK, `status` (`pending`/`cleared`/`rejected`), `remarks`; unique per (application, requirement) |
| `Document` | clearance | `application` FK, `item` FK, `file` (storage abstraction), `original_name`, `content_type`, `size`, `uploaded_by` FK |
| `Payment` | payments | `reference` (`PAY-YYYY-XXXXXX`), `application` FK, `amount`, `currency`, `method` (`wave`/`qmoney`/`afrimoney`/`mobile_money`), `payer_phone`, `status` (`pending`/`paid`/`failed`/`refunded`), `provider_reference`, `failure_reason`, `paid_at` |
| `Notification` | notifications | `user` FK, `kind`, `title`, `message`, `application` FK (nullable), `is_read` |
| `AuditLog` | core | `actor` FK (nullable), `action`, `entity_type`, `entity_id`, `metadata` (JSON), `ip_address`, `created_at` |
| `SystemSetting` | core | `key` (unique), `value`, `description`, `updated_by` FK |

## Flow and statuses

`draft` → (student submits, reference generated) `submitted` → (student pays) → staff decide:
`approved`, `rejected`, or `correction_requested` (student edits and resubmits, keeping the same
reference). Approval is refused unless a `paid` payment exists.

## System settings (seeded)

| Key | Default | Purpose |
| --- | --- | --- |
| `digital_service_fee` | `50.00` | Fee charged per clearance; read dynamically on submission |
| `currency` | `GMD` | Currency code |
| `official_portal_url` | `https://www.utg.edu.gm` | Target of the post-approval handoff |
