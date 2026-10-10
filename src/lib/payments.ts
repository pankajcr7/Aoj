import "server-only";
import { and, eq, isNull, lt, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, payments } from "@/db/schema";
import { PVC_CARD_PAISE, type PaymentPurpose } from "./payment-rules";
import { createRazorpayOrder, fetchOrderPayments, fetchRazorpayPayment, PaymentError, razorpayKeys, type RazorpayPayment } from "./razorpay";
import { validCheckoutSignature } from "./payment-signatures";
export type PaymentRow = typeof payments.$inferSelect;
const terminal = ["paid", "refunded", "partially_refunded"];
export async function getPayment(applicationId: string, purpose: PaymentPurpose) {
  const [row] = await db.select().from(payments).where(and(eq(payments.applicationId, applicationId), eq(payments.purpose, purpose)));
  return row;
}
export async function recordPayment(row: PaymentRow, payment: RazorpayPayment) {
  if (payment.order_id !== row.razorpayOrderId || payment.amount !== row.amount || payment.currency !== "INR" || payment.amount_refunded > payment.amount)
    throw new PaymentError("Payment does not match this charge", 400);
  const status = payment.amount_refunded === payment.amount ? "refunded" : payment.amount_refunded > 0 ? "partially_refunded"
    : payment.status === "captured" ? "paid" : payment.status === "authorized" ? "authorized" : payment.status === "failed" ? "failed" : null;
  if (!status) return row;
  const [updated] = await db.update(payments).set({
    status, razorpayPaymentId: payment.id, updatedAt: new Date(),
    ...(terminal.includes(status) && { paidAt: sql`coalesce(${payments.paidAt}, now())` }),
  }).where(and(eq(payments.id, row.id),
    // A failed retry cannot overwrite a captured payment; replayed capture events cannot undo refunds.
    status === "paid" ? notInArray(payments.status, ["refunded", "partially_refunded"])
      : status === "partially_refunded" ? notInArray(payments.status, ["refunded"])
      : status === "refunded" ? undefined : notInArray(payments.status, terminal),
    or(notInArray(payments.status, terminal), eq(payments.razorpayPaymentId, payment.id)),
  )).returning();
  return updated ?? (await getPayment(row.applicationId, row.purpose as PaymentPurpose))!;
}
export async function reconcilePayment(row: PaymentRow) {
  if (!row.razorpayOrderId || terminal.includes(row.status)) return row;
  const attempts = await fetchOrderPayments(row.razorpayOrderId);
  const payment = attempts.find(p => p.status === "captured" || p.status === "refunded" || p.amount_refunded > 0)
    ?? attempts.find(p => p.status === "authorized")
    ?? attempts.find(p => p.status === "failed" && p.id === row.razorpayPaymentId);
  return payment ? recordPayment(row, payment) : row;
}
export function paymentView(row: PaymentRow) {
  return { status: row.status, amount: row.amount, membershipAmount: row.membershipAmount, pvcAmount: row.pvcAmount, paymentId: row.razorpayPaymentId };
}
export async function preparePayment(applicationId: string, purpose: PaymentPurpose) {
  const [application] = await db.select({ id: applications.id, name: applications.name, email: applications.email, contact: applications.contact,
    status: applications.status, pvcCardRequested: applications.pvcCardRequested }).from(applications).where(eq(applications.id, applicationId));
  if (!application) throw new PaymentError("Application not found", 404);
  if (["rejected", "suspended", "terminated"].includes(application.status)) throw new PaymentError("Please contact AOJE before making a payment.");
  let row = await getPayment(applicationId, purpose);
  if (purpose === "pvc_card") {
    const registration = await getPayment(applicationId, "registration");
    if (!application.pvcCardRequested || application.status !== "approved") throw new PaymentError("The physical card is available after membership approval.");
    if (registration && registration.status !== "paid") throw new PaymentError("The membership payment must be completed first.");
    if (registration?.pvcAmount) return { ...paymentView(registration), status: "paid" };
    if (!row) {
      await db.insert(payments).values({ applicationId, purpose, amount: PVC_CARD_PAISE, membershipAmount: 0, pvcAmount: PVC_CARD_PAISE })
        .onConflictDoNothing({ target: [payments.applicationId, payments.purpose] });
      row = await getPayment(applicationId, purpose);
    }
  }
  if (!row) throw new PaymentError("No payment is due for this application.", 404);
  if (terminal.includes(row.status)) return paymentView(row);
  const { keyId } = razorpayKeys();
  if (row.razorpayOrderId) {
    row = await reconcilePayment(row);
    if (terminal.includes(row.status) || row.status === "authorized") return paymentView(row);
  } else {
    const now = new Date();
    const [claimed] = await db.update(payments).set({ orderCreatingAt: now }).where(and(eq(payments.id, row.id), isNull(payments.razorpayOrderId),
      or(isNull(payments.orderCreatingAt), lt(payments.orderCreatingAt, new Date(Date.now() - 120000))))).returning({ id: payments.id });
    if (!claimed) throw new PaymentError("Your payment is being prepared. Please try again in a moment.", 409);
    try {
      const order = await createRazorpayOrder(row.id, applicationId, purpose, row.amount);
      const [saved] = await db.update(payments).set({ razorpayOrderId: order.id, status: "created", orderCreatingAt: null, updatedAt: new Date() })
        .where(and(eq(payments.id, row.id), isNull(payments.razorpayOrderId), eq(payments.orderCreatingAt, now))).returning();
      if (!saved) throw new PaymentError("Payment is being prepared. Please try again.", 409);
      row = saved;
      row = await reconcilePayment(row);
      if (terminal.includes(row.status) || row.status === "authorized") return paymentView(row);
    } catch (error) {
      await db.update(payments).set({ orderCreatingAt: null }).where(and(eq(payments.id, row.id), eq(payments.orderCreatingAt, now)));
      throw error;
    }
  }
  return { ...paymentView(row), keyId, orderId: row.razorpayOrderId, testMode: keyId.startsWith("rzp_test_"), prefill: { name: application.name, email: application.email, contact: `+91${application.contact}` } };
}
export async function verifyCheckout(applicationId: string, purpose: PaymentPurpose, orderId: string, paymentId: string, signature: string) {
  const row = await getPayment(applicationId, purpose);
  if (!row?.razorpayOrderId || orderId !== row.razorpayOrderId) throw new PaymentError("Payment order does not match this application.");
  if (!validCheckoutSignature(row.razorpayOrderId, paymentId, signature, razorpayKeys().keySecret)) throw new PaymentError("Payment signature could not be verified.");
  const payment = await fetchRazorpayPayment(paymentId);
  return paymentView(await recordPayment(row, payment));
}
