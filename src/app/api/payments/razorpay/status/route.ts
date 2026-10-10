import { z } from "zod";
import { canPay } from "@/lib/payment-access";
import { paymentFailure, paymentResponse } from "@/lib/payment-http";
import { getPayment, paymentView, reconcilePayment } from "@/lib/payments";
import { RAZORPAY_ENABLED } from "@/lib/payment-rules";
export const runtime = "nodejs";
export async function GET(request: Request) {
  if (!RAZORPAY_ENABLED) return paymentResponse({ error: "Online payments are currently disabled." }, 503);
  try {
    const params = new URL(request.url).searchParams;
    const parsed = z.object({ applicationId: z.uuid(), purpose: z.enum(["registration", "pvc_card"]) }).safeParse(Object.fromEntries(params));
    if (!parsed.success) return paymentResponse({ error: "Invalid payment request" }, 400);
    const { applicationId, purpose } = parsed.data;
    if (!await canPay(applicationId)) return paymentResponse({ error: "Please sign in to access this payment." }, 403);
    const row = await getPayment(applicationId, purpose);
    if (!row) return paymentResponse({ status: "pending" });
    return paymentResponse(paymentView(await reconcilePayment(row)));
  } catch (error) { return paymentFailure(error); }
}
