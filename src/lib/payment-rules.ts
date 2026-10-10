export type PaymentPurpose = "registration" | "pvc_card";
// Razorpay is paused for now. Keep the integration and set this to true to enable it again.
export const RAZORPAY_ENABLED: boolean = false;
export const PVC_CARD_PAISE = 20000;
export const PAYMENT_LABELS: Record<string, string> = {
  pending: "Not paid", created: "Awaiting payment", authorized: "Awaiting confirmation",
  paid: "Paid", failed: "Not paid", refunded: "Refunded", partially_refunded: "Partially refunded",
};
export function registrationCharge(membershipType: string | null | undefined, pvcCardPayment: string | null | undefined) {
  const membershipAmount = membershipType === "Monthly Membership (Rs.200/-)" ? 20000
    : membershipType === "Yearly Membership (Rs.2000/-)" ? 200000 : 0;
  if (!membershipAmount) return null;
  const pvcAmount = pvcCardPayment === "pay_now" ? PVC_CARD_PAISE : 0;
  return { amount: membershipAmount + pvcAmount, membershipAmount, pvcAmount };
}
export function money(paise: number) { return `Rs.${(paise / 100).toLocaleString("en-IN")}/-`; }
