import { z } from "zod";
import { canPay } from "@/lib/payment-access";
import { sameOrigin, paymentFailure, paymentResponse } from "@/lib/payment-http";
import { verifyCheckout } from "@/lib/payments";
import { RAZORPAY_ENABLED } from "@/lib/payment-rules";
export const runtime = "nodejs";
const schema = z.object({ applicationId: z.uuid(), purpose: z.enum(["registration", "pvc_card"]),
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/), razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/), razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i) });
export async function POST(request: Request) {
  if (!RAZORPAY_ENABLED) return paymentResponse({ error: "Online payments are currently disabled." }, 503);
  try {
    sameOrigin(request);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return paymentResponse({ error: "Invalid payment confirmation" }, 400);
    const p = parsed.data;
    if (!await canPay(p.applicationId)) return paymentResponse({ error: "Please sign in to access this payment." }, 403);
    return paymentResponse(await verifyCheckout(p.applicationId, p.purpose, p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature));
  } catch (error) { return paymentFailure(error); }
}
