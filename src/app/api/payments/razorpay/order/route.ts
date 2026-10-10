import { z } from "zod";
import { canPay } from "@/lib/payment-access";
import { sameOrigin, paymentFailure, paymentResponse } from "@/lib/payment-http";
import { preparePayment } from "@/lib/payments";
import { RAZORPAY_ENABLED } from "@/lib/payment-rules";
export const runtime = "nodejs";
const schema = z.object({ applicationId: z.uuid(), purpose: z.enum(["registration", "pvc_card"]) });
export async function POST(request: Request) {
  if (!RAZORPAY_ENABLED) return paymentResponse({ error: "Online payments are currently disabled." }, 503);
  try {
    sameOrigin(request);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return paymentResponse({ error: "Invalid payment request" }, 400);
    const { applicationId, purpose } = parsed.data;
    if (!await canPay(applicationId)) return paymentResponse({ error: "Please sign in to access this payment." }, 403);
    return paymentResponse(await preparePayment(applicationId, purpose));
  } catch (error) { return paymentFailure(error); }
}
