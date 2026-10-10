import Link from "next/link";
import { paymentApplicationId } from "@/lib/payment-access";
import { RAZORPAY_ENABLED } from "@/lib/payment-rules";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { MembershipForm } from "./register-form";

export const metadata: Metadata = { title: "Membership Form | AOJ Punjab" };

export default async function RegisterPage() {
  const paymentId = RAZORPAY_ENABLED ? await paymentApplicationId() : null;
  return (
    <>
      <SiteHeader actions={false} />
      <main className="w-full flex-1 px-2 py-6 sm:px-4 lg:py-10">
        {paymentId && <p className="mx-auto mb-4 max-w-6xl text-sm"><Link href="/register/payment" className="font-semibold text-accent underline">View or complete your submitted application payment</Link></p>}
        <MembershipForm />
      </main>
    </>
  );
}
