import { createHmac, timingSafeEqual } from "node:crypto";
export function validSignature(message: string, signature: string, secret: string) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(message).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export function validCheckoutSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  return validSignature(`${orderId}|${paymentId}`, signature, secret);
}
