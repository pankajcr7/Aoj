import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { RazorpayPayment } from "@/components/razorpay-payment";
import { paymentApplicationId } from "@/lib/payment-access";
import { getPayment } from "@/lib/payments";
import { refFor } from "@/lib/messages";
import { RAZORPAY_ENABLED } from "@/lib/payment-rules";
export default async function PaymentPage() {
  if (!RAZORPAY_ENABLED) redirect("/register");
  const applicationId = await paymentApplicationId();
  if (!applicationId) redirect("/register");
  const payment = await getPayment(applicationId, "registration");
  if (!payment) redirect("/register");
  return <><SiteHeader actions={false} /><main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
    <h1 className="text-2xl font-bold">Your application payment</h1>
    <p className="mt-2 text-sm text-muted">Reference: {refFor(applicationId)}. Your application is saved. Complete the payment so the Operation Team can approve it.</p>
    <RazorpayPayment applicationId={applicationId} purpose="registration" amount={payment.amount} membershipAmount={payment.membershipAmount}
      pvcAmount={payment.pvcAmount} initialStatus={payment.status} initialPaymentId={payment.razorpayPaymentId} />
    <Link href="/" className="btn-outline mt-5">Back to Home</Link>
  </main></>;
}
