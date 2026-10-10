import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { validSignature } from "@/lib/payment-signatures";
import { paymentFailure, paymentResponse } from "@/lib/payment-http";
import { recordPayment } from "@/lib/payments";
import { fetchRazorpayPayment } from "@/lib/razorpay";
import { RAZORPAY_ENABLED } from "@/lib/payment-rules";
export const runtime = "nodejs";
const schema = z.object({ event: z.string(), payload: z.object({
  payment: z.object({ entity: z.object({ id: z.string(), order_id: z.string().nullable().optional() }) }).optional(),
  refund: z.object({ entity: z.object({ payment_id: z.string() }) }).optional(),
}) });
export async function POST(request: Request) {
  if (!RAZORPAY_ENABLED) return paymentResponse({ error: "Online payments are currently disabled." }, 503);
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return paymentResponse({ error: "Webhook not configured" }, 503);
    const raw = await request.text();
    if (raw.length > 65536) return paymentResponse({ error: "Payload too large" }, 413);
    if (!validSignature(raw, request.headers.get("x-razorpay-signature") ?? "", secret)) return paymentResponse({ error: "Invalid webhook signature" }, 400);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return paymentResponse({ error: "Invalid webhook payload" }, 400); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return paymentResponse({ error: "Invalid webhook payload" }, 400);
    const { event, payload } = parsed.data;
    if (!["payment.captured", "payment.authorized", "payment.failed", "order.paid", "refund.processed"].includes(event)) return paymentResponse({ ok: true });
    const id = payload.payment?.entity.id ?? payload.refund?.entity.payment_id;
    if (!id || !/^pay_[A-Za-z0-9]+$/.test(id)) return paymentResponse({ error: "Payment reference missing" }, 400);
    // Fetch the current gateway state so out-of-order webhooks cannot undo a refund or confirmed payment.
    const payment = await fetchRazorpayPayment(id);
    if (!payment.order_id) return paymentResponse({ ok: true });
    const [row] = await db.select().from(payments).where(eq(payments.razorpayOrderId, payment.order_id));
    if (row) await recordPayment(row, payment);
    return paymentResponse({ ok: true });
  } catch (error) { return paymentFailure(error); }
}
