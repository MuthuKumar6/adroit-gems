import { z } from "zod";

// Helper: trimmed required string with custom message
const reqStr = (label: string, min = 1, max = 255) =>
  z.string().trim().min(min, `${label} is required`).max(max, `${label} is too long`);

const optStr = (max = 500) => z.string().trim().max(max).optional().or(z.literal(""));

// Indian phone (10 digits, allows +91 prefix optionally)
const phoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+?91[-\s]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number");

// GSTIN: 15 chars (lenient — exact format optional)
const gstinSchema = z
  .string()
  .trim()
  .regex(/^[0-9A-Z]{15}$/, "GSTIN must be 15 alphanumeric characters")
  .optional()
  .or(z.literal(""));

export const customerSchema = z.object({
  name: reqStr("Name"),
  phone: phoneSchema,
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  address: optStr(500),
  gstin: gstinSchema,
  dailyGramLimit: z.coerce.number().min(0, "Limit must be ≥ 0").max(100_000, "Limit too high"),
});
export type CustomerFormValues = z.infer<typeof customerSchema>;

export const productSchema = z.object({
  name: reqStr("Name", 1, 100),
  purity: reqStr("Purity", 1, 50),
  currentRate: z.coerce.number().positive("Rate must be greater than 0"),
  gstPercentage: z.coerce.number().min(0, "GST cannot be negative").max(100, "GST cannot exceed 100%"),
  unit: reqStr("Unit", 1, 20).default("gram"),
});
export type ProductFormValues = z.infer<typeof productSchema>;

export const restrictionSchema = z.object({
  customer_id: reqStr("Customer"),
  product_id: reqStr("Product"),
  daily_gram_limit: z.coerce.number().positive("Limit must be greater than 0"),
});
export type RestrictionFormValues = z.infer<typeof restrictionSchema>;

export const orderItemSchema = z.object({
  productTypeId: reqStr("Product type"),
  quantity: z.coerce.number().int("Quantity must be a whole number").positive("Quantity must be > 0"),
  huids: z.array(z.string()).optional().default([]),
});

export const orderSchema = z.object({
  customerId: reqStr("Customer"),
  items: z.array(orderItemSchema).min(1, "Add at least one item"),
  notes: optStr(1000),
  paymentDueDate: z.string().optional().or(z.literal("")),
});
export type OrderFormValues = z.infer<typeof orderSchema>;

export const billSchema = z.object({
  orderId: reqStr("Order"),
  discount: z.coerce.number().min(0, "Discount cannot be negative").default(0),
  paidAmount: z.coerce.number().min(0, "Paid amount cannot be negative"),
  paymentMethod: z.enum(["cash", "bank_transfer", "cheque", "upi"]),
});
export type BillFormValues = z.infer<typeof billSchema>;

// Format a ZodError's first message for toast display
export function firstError(err: z.ZodError): string {
  const issue = err.issues[0];
  return issue?.message ?? "Validation failed";
}
