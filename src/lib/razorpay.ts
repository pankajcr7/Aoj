import "server-only";
import { z } from "zod";
export class PaymentError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function razorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !/^rzp_(test|live)_/.test(keyId) || !keySecret || !process.env.RAZORPAY_WEBHOOK_SECRET)
    throw new PaymentError("Online payment is temporarily unavailable. Your application is saved. Please contact AOJE or try again later.", 503);
  return { keyId, keySecret };
}
async function api(path: string, body?: unknown): Promise<unknown> {
  const { keyId, keySecret } = razorpayKeys();
  try {
    const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
      method: body ? "POST" : "GET", cache: "no-store", signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`, "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new Error("Gateway request failed");
    return await response.json();
  } catch { throw new PaymentError("Razorpay is unavailable right now. Please try again; your application is saved.", 502); }
}
export const razorpayPaymentSchema = z.object({
  id: z.string().regex(/^pay_[A-Za-z0-9]+$/), order_id: z.string().nullable(), amount: z.number().int().positive(),
  currency: z.string(), status: z.string(), amount_refunded: z.number().int().nonnegative().default(0),
});
export type RazorpayPayment = z.infer<typeof razorpayPaymentSchema>;
export async function createRazorpayOrder(id: string, applicationId: string, purpose: string, amount: number) {
  const orderSchema = z.object({ id: z.string().regex(/^order_[A-Za-z0-9]+$/), amount: z.number(), currency: z.literal("INR"), receipt: z.string() });
  // Recover an order whose API response or database write was interrupted.
  const existing = z.object({ items: z.array(orderSchema) }).parse(await api(`orders?receipt=${encodeURIComponent(id)}`)).items.find(order => order.receipt === id);
  const order = existing ?? orderSchema.parse(await api("orders", { amount, currency: "INR", receipt: id, partial_payment: false, notes: { application_id: applicationId, purpose } }));
  if (order.amount !== amount || order.receipt !== id) throw new PaymentError("Unable to prepare the payment. Please contact AOJE.", 502);
  return order;
}
export async function fetchRazorpayPayment(id: string) {
  if (!/^pay_[A-Za-z0-9]+$/.test(id)) throw new PaymentError("Invalid payment reference");
  return razorpayPaymentSchema.parse(await api(`payments/${id}`));
}
export async function fetchOrderPayments(orderId: string) {
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) throw new PaymentError("Invalid order reference");
  return z.object({ items: z.array(razorpayPaymentSchema) }).parse(await api(`orders/${orderId}/payments`)).items;
}
