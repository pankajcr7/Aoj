"use client";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { RAZORPAY_ENABLED, money, PAYMENT_LABELS, type PaymentPurpose } from "@/lib/payment-rules";
type Receipt = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type CheckoutOptions = { key: string; amount: number; currency: string; name: string; description: string; image: string;
  order_id: string; prefill: { name: string; email: string; contact: string }; handler: (receipt: Receipt) => void;
  modal: { ondismiss: () => void; confirm_close: boolean }; theme: { color: string } };
type Checkout = { open: () => void; on: (event: string, handler: () => void) => void };
type RazorpayWindow = Window & { Razorpay?: new (options: CheckoutOptions) => Checkout };
type GatewayResponse = { error?: string; status: string; keyId?: string; orderId?: string; amount: number; paymentId?: string | null;
  testMode?: boolean; prefill?: { name: string; email: string; contact: string } };
export function RazorpayPayment({ applicationId, purpose, amount, membershipAmount = 0, pvcAmount = 0, initialStatus = "pending", initialPaymentId }: {
  applicationId: string; purpose: PaymentPurpose; amount: number; membershipAmount?: number; pvcAmount?: number; initialStatus?: string; initialPaymentId?: string | null;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [paymentId, setPaymentId] = useState(initialPaymentId);
  const inFlight = useRef(false);
  if (!RAZORPAY_ENABLED) return null;
  const terminal = ["paid", "refunded", "partially_refunded"].includes(status);
  async function request(path: string, body?: unknown) {
    const response = await fetch(`/api/payments/razorpay/${path}`, { method: body ? "POST" : "GET", cache: "no-store",
      ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
    const data = await response.json() as GatewayResponse;
    if (!response.ok) throw new Error(data.error || "Payment could not be completed. Please try again.");
    return data;
  }
  function update(data: GatewayResponse) {
    setStatus(data.status); setPaymentId(data.paymentId);
    if (data.status === "paid") { setMessage("Payment received and verified. Thank you."); router.refresh(); }
    else if (data.status === "authorized") setMessage("Your payment is awaiting confirmation. Check the status again shortly.");
    else if (data.status === "refunded" || data.status === "partially_refunded") setMessage("Please contact AOJE about this refunded payment.");
  }
  function finish() { inFlight.current = false; setBusy(false); }
  async function refreshStatus() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setMessage("");
    try { const data = await request(`status?${new URLSearchParams({ applicationId, purpose })}`); update(data);
      if (!["paid", "authorized", "refunded", "partially_refunded"].includes(data.status)) setMessage("Payment has not been confirmed yet. You can retry checkout.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not check payment status."); }
    finally { finish(); }
  }
  async function pay() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setMessage("");
    try {
      const data = await request("order", { applicationId, purpose });
      if (["paid", "authorized", "refunded", "partially_refunded"].includes(data.status)) { update(data); finish(); return; }
      const Razorpay = (window as RazorpayWindow).Razorpay;
      if (!Razorpay || !data.keyId || !data.orderId || !data.prefill) throw new Error("Checkout could not load. Please reload this page and try again.");
      let received = false;
      const checkout = new Razorpay({ key: data.keyId, amount: data.amount, currency: "INR", name: "AOJE Punjab",
        description: purpose === "registration" ? "Membership and selected PVC card" : "PVC membership card",
        image: `${window.location.origin}/logo.jpeg`, order_id: data.orderId, prefill: data.prefill, theme: { color: "#0b2c6e" },
        handler: (receipt) => {
          received = true;
          setMessage("Verifying your payment...");
          void request("verify", { applicationId, purpose, ...receipt }).then(update)
            .catch(() => setMessage("We could not confirm the payment yet. Use Check payment status before retrying."))
            .finally(finish);
        },
        modal: { confirm_close: true, ondismiss: () => { if (!received) { finish(); setMessage("Checkout closed. Your application is saved; you can retry or check the payment status."); } } },
      });
      checkout.on("payment.failed", () => setMessage("The payment attempt failed. You can retry in checkout or close it and try later."));
      if (data.testMode) setMessage("Razorpay test mode: no real money will be collected.");
      checkout.open();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not start payment."); finish(); }
  }
  return (
    <section className="mt-5 rounded-xl border border-line bg-surface p-4 text-left">
      {!terminal && <Script id="razorpay-checkout" src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive"
        onReady={() => setReady(true)} onError={() => setMessage("Checkout could not load. Please reload this page to try again.")} />}
      <h2 className="font-semibold">{purpose === "registration" ? "Membership payment" : "Physical PVC card payment"}</h2>
      <dl className="mt-3 space-y-1 text-sm">
        {membershipAmount > 0 && <div className="flex justify-between gap-4"><dt>Selected membership fee</dt><dd>{money(membershipAmount)}</dd></div>}
        {pvcAmount > 0 && <div className="flex justify-between gap-4"><dt>PVC card, printing and delivery</dt><dd>{money(pvcAmount)}</dd></div>}
        <div className="flex justify-between gap-4 border-t border-line pt-2 font-semibold"><dt>Total</dt><dd>{money(amount)}</dd></div>
      </dl>
      <p className={`mt-3 text-sm font-semibold ${status === "paid" ? "text-accent" : "text-muted"}`}>Status: {PAYMENT_LABELS[status] ?? "Awaiting confirmation"}</p>
      {paymentId && <p className="mt-1 break-all text-xs text-muted">Payment reference: {paymentId}</p>}
      {!terminal && <div className="mt-4 flex flex-wrap gap-2">
        {status !== "authorized" && <button type="button" className="btn-accent" disabled={busy || !ready} onClick={() => void pay()}>{busy ? "Please wait..." : `Pay ${money(amount)} with Razorpay`}</button>}
        <button type="button" className="btn-outline" disabled={busy} onClick={() => void refreshStatus()}>Check payment status</button>
      </div>}
      {message && <p role="status" className="mt-3 text-sm text-muted">{message}</p>}
    </section>
  );
}
