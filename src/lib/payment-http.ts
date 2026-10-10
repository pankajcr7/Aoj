import { PaymentError } from "./razorpay";
export function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new PaymentError("Invalid request origin", 403);
}
export function paymentResponse(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
export function paymentFailure(error: unknown) {
  return error instanceof PaymentError ? paymentResponse({ error: error.message }, error.status)
    : paymentResponse({ error: "Could not complete this request. Please try again." }, 500);
}
