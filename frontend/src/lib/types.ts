export type Role = "student" | "admin" | "super_admin";

export interface StudentProfile {
  id: number;
  student_number: string;
  programme: number;
  programme_name: string;
  faculty_name: string;
  level: number;
  verification_status: "pending" | "verified" | "rejected";
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: Role;
  student: StudentProfile | null;
}

export interface Programme {
  id: number;
  code: string;
  name: string;
  faculty: number;
  faculty_name: string;
}

export interface Requirement {
  id: number;
  code: string;
  name: string;
  description: string;
  is_mandatory: boolean;
  requires_document: boolean;
  document_hint: string;
}

export interface ClearanceDocument {
  id: number;
  item: number;
  requirement: number;
  original_name: string;
  content_type: string;
  size: number;
  uploaded_at: string;
}

export interface ApplicationItem {
  id: number;
  requirement: Requirement;
  status: string;
  remarks: string;
  documents: ClearanceDocument[];
}

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "correction_requested"
  | "approved"
  | "rejected";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

export interface PaymentBrief {
  id: number;
  reference: string;
  amount: string;
  currency: string;
  method: string;
  status: PaymentStatus;
  paid_at: string | null;
}

export interface Application {
  id: number;
  reference: string | null;
  status: ApplicationStatus;
  is_editable: boolean;
  term_name: string;
  student: {
    id: number;
    student_number: string;
    full_name: string;
    email: string;
    phone: string;
    programme: string;
    faculty: string;
    level: number;
    verification_status: string;
  };
  student_notes: string;
  fee_amount: string | null;
  fee_currency: string;
  payment_status: PaymentStatus;
  payment: PaymentBrief | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
  decision_reason: string;
  handoff: { portal_url: string; instructions: string } | null;
  items: ApplicationItem[];
  created_at: string;
}

export interface Payment {
  id: number;
  reference: string;
  application: number;
  application_reference: string;
  amount: string;
  currency: string;
  method: string;
  payer_phone: string;
  status: PaymentStatus;
  failure_reason: string;
  paid_at: string | null;
  created_at: string;
}

export interface AppNotification {
  id: number;
  kind: string;
  title: string;
  message: string;
  application: number | null;
  application_reference: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Fee {
  amount: string;
  currency: string;
}
