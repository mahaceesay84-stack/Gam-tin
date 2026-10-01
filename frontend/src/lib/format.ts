export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export function formatMoney(amount: string | null | undefined, currency = "GMD"): string {
  if (amount == null) return "—";
  return `${currency} ${Number(amount).toFixed(2)}`;
}

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  correction_requested: "Correction requested",
  approved: "Approved",
  rejected: "Rejected",
  unpaid: "Unpaid",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const METHOD_LABELS: Record<string, string> = {
  wave: "Wave",
  qmoney: "QMoney",
  afrimoney: "Afrimoney",
  mobile_money: "Mobile Money",
};
