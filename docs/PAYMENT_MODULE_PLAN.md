# Gam-Tin Payment Module Plan

## Objective
To build a transparent, configurable, and modular payment system for the Gambia Digital TIN application process.

## Status
- **Project Initialized** (2026-08-28)

## Requirements Checklist
- [ ] 1. Payment Objective
- [ ] 2. Two Separate Fees (GRA Fee vs Service Fee)
- [ ] 3. Transparent Pricing
- [ ] 4. Mobile Money Payment (Wave, etc.)
- [ ] 5. Wave Payment Flow
- [ ] 6. Payment Architecture (Abstraction Layer)
- [ ] 7. Service Fee Configuration (Admin Panel)
- [ ] 8. Fixed or Percentage Service Fee Support
- [ ] 9. Payment Receipt (PDF download)
- [ ] 10. Payment Reconciliation
- [ ] 11. Payment Provider Fees
- [ ] 12. Failed Payment Flow
- [ ] 13. Pending Payment Flow
- [ ] 14. Duplicate Payment Protection (Idempotency)
- [ ] 15. Refunds
- [ ] 16. User Payment History
- [ ] 17. Admin Payment Dashboard
- [ ] 18. Payment Security
- [ ] 19. Clear Communication Business Rules
- [ ] 20. Future Payment Expansion
- [ ] 21. Core Value Proposition
- [ ] 22. Regulatory Requirements
- [ ] 23. Final Payment Experience

## Regulatory Ledger (REQUIRES OFFICIAL CONFIRMATION)
| ID | Requirement | Status |
| :--- | :--- | :--- |
| 22 | GRA authorization for fee collection | Pending |
| 22 | VAT/Tax treatment of platform fee | Pending |
| 22 | Legality of splitting government fees | Pending |
| 22 | Data protection compliance | Pending |
| 11 | Model for Payment-provider fee (User pays / Platform absorbs) | Pending |

## Core Value Proposition & Pricing Justification

### The Core Promise: "Get Your TIN Without The Journey"
Instead of forcing citizens across The Gambia to spend time, travel expenses, and bus/taxi fares traveling back and forth to a GRA office, the Gam-Tin platform allows them to apply and receive their official TIN remotely from anywhere.

### Service Fee Rationale (GMD 50 Platform Service Fee)
- **Transport Fare Equivalent:** The GMD 50 platform service fee directly replaces the travel fare (GMD 50–150+) a citizen would otherwise spend on commercial transport (gelli-gelli, taxis) to visit a GRA office.
- **Net Time & Cost Savings:** The user saves hours of travel and waiting time while paying equal or less than the physical travel cost.
- **Value Delivery:** Instant digital processing, application tracking, status notifications, and downloadable digital TIN certificate.

---

## Technical Architecture: Payment Abstraction Layer (PAL)

### Core Interface Design
All digital payment adapters (Wave, QMoney, Afrimoney, Bank, Card, etc.) must implement the unified `PaymentProvider` contract:

```typescript
export interface PaymentProvider {
  providerId: string; // e.g., 'wave', 'qmoney', 'afrimoney'
  displayName: string;
  isAvailable(): Promise<boolean>;

  initiatePayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse>;
  verifyPayment(transactionId: string): Promise<PaymentVerificationResult>;
  handleWebhook(headers: Record<string, string>, body: any): Promise<WebhookProcessingResult>;
  processRefund(refundRequest: RefundRequest): Promise<RefundResult>;
}
```

### Configurable Fee Engine Schema
Fees are decoupled from code and evaluated dynamically per transaction (Note: Default example updated per captain's instruction: Platform Service Fee = GMD 50, Government Fee = GMD 25 / GMD 0 if free):

```json
{
  "feeConfigId": "cfg_tin_2026_v1",
  "applicableService": "TIN_APPLICATION",
  "effectiveFrom": "2026-01-01T00:00:00Z",
  "effectiveTo": null,
  "governmentFee": {
    "currency": "GMD",
    "amount": 25.00,
    "note": "Configurable. Can be set to 0.00 if GRA TIN issuance is free."
  },
  "platformServiceFee": {
    "type": "FIXED", // "FIXED" | "PERCENTAGE"
    "fixedAmount": 50.00,
    "percentage": 0.00,
    "minFee": 0.00,
    "maxFee": 100.00
  }
}
```

### Transaction State Machine & Idempotency
- **States:** `INITIATED` -> `PENDING` -> `PAID` | `FAILED` | `REFUNDED`
- **Idempotency Key:** Generated as `SHA256(applicant_id + service_id + fee_config_version)` to prevent duplicate payments on repeated "PAY" clicks.

---

## Compliance Questionnaire for Partners & Authorities

Please provide this questionnaire to GRA, payment providers, and legal counsel to clear the items in the **Regulatory Ledger**:

1. **GRA Authorization & Fee Collection:**
   - Does GRA explicitly authorize the Gam-Tin digital platform to process TIN application fee payments on its behalf?
   - What is the officially mandated GRA fee (in GMD) for a TIN application?

2. **Platform Service Fee & Disclosure:**
   - Is charging a distinct "Digital Service Fee" (e.g., GMD 50) legally compliant under Gambian tax and consumer protection law?
   - What is the required VAT/tax treatment for the platform service fee collected?

3. **Settlement & Fund Split Mechanics:**
   - How should transactions be settled?
     - Option A: Gross amount (GMD 75 / GMD 50) collected by platform account, then GRA fee (GMD 25 / GMD 0) remitted periodically.
     - Option B: Direct payment gateway split at the point of processing.
     - Option C: Direct collection into a GRA escrow account.

4. **Payment Provider Fees (Wave / QMoney / Afrimoney):**
   - Who bears the mobile money transaction charges?
     - Model A: Passed on to the applicant.
     - Model B: Absorbed by the platform from its service fee.
     - Model C: Incorporated into the disclosed total.

5. **Refund & Cancellation Policy:**
   - In case of duplicate payments or application rejection, what is the official policy regarding refunds for (a) GRA Government Fee, and (b) Digital Platform Service Fee?

---

## Audit Log
- 2026-08-28: Initialized Gam-Tin project and created PAYMENT_MODULE_PLAN.md.
- 2026-08-28: Added Payment Abstraction Layer (PAL) architecture spec and Compliance Questionnaire.
- 2026-08-28: Updated default fee schema: Platform Service Fee set to GMD 50.00 and Government Fee set to GMD 25.00 (with note that GRA TIN may be GMD 0 if free).
- 2026-08-28: Added Core Value Proposition & Pricing Justification section (GMD 50 service fee replaces physical travel fare).


