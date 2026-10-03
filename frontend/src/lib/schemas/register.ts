import { z } from "zod";

/** Allowed Gambian mobile prefixes (first two digits of the 9-digit number). */
export const GM_PREFIXES = ["87", "83", "86"] as const;

/** Student number format: 6-10 digits. Adjust here when the real format is known. */
export const STUDENT_NUMBER_REGEX = /^\d{6,10}$/;

const stripPhone = (phone: string) =>
  phone.replace(/[\s-]/g, "").replace(/^(\+220|00220)/, "");

const PHONE_REGEX = new RegExp(`^(${GM_PREFIXES.join("|")})\\d{7}$`);

export function isValidGmPhone(phone: string): boolean {
  return PHONE_REGEX.test(stripPhone(phone));
}

/** Format a valid Gambian mobile number as +220XXXXXXXXX. */
export function normalizePhone(phone: string): string {
  return `+220${stripPhone(phone)}`;
}

export const registerSchema = z.object({
  fullName: z.string().trim().min(3, "Enter your full name (at least 3 characters)."),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(1, "Mobile number is required.")
    .refine(isValidGmPhone, `Enter a 9-digit Gambian mobile number starting with ${GM_PREFIXES.join(", ")}.`),
  studentNumber: z
    .string()
    .trim()
    .regex(STUDENT_NUMBER_REGEX, "Student number must be 6 to 10 digits."),
  level: z.string().min(1, "Select your level."),
  programme: z.string().min(1, "Select your programme."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Za-z]/, "Password must contain at least one letter.")
    .regex(/[0-9]/, "Password must contain at least one number."),
});

export type RegisterValues = z.infer<typeof registerSchema>;
