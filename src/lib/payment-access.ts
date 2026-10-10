import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getUser } from "./auth";
const COOKIE = "aoj_payment_access";
const secret = () => {
  if (!process.env.SESSION_SECRET) throw new Error("Session configuration missing");
  return new TextEncoder().encode(process.env.SESSION_SECRET);
};
export async function grantPaymentAccess(applicationId: string) {
  const token = await new SignJWT({ applicationId }).setProtectedHeader({ alg: "HS256" })
    .setAudience("aoje-payments").setIssuedAt().setExpirationTime("7d").sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 604800, path: "/" });
}
export async function paymentApplicationId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"], audience: "aoje-payments" });
    return typeof payload.applicationId === "string" && /^[0-9a-f-]{36}$/i.test(payload.applicationId) ? payload.applicationId : null;
  } catch { return null; }
}
export async function canPay(applicationId: string) {
  if (await paymentApplicationId() === applicationId) return true;
  const user = await getUser();
  return user?.role === "member" && user.applicationId === applicationId;
}
