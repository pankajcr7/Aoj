"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { forgotPassword, login } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});
  const [forgot, setForgot] = useState(false);

  return (
    <>
      <SiteHeader actions={false} />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
        {forgot ? (
          <ForgotForm onBack={() => setForgot(false)} />
        ) : (
        <form action={action} className="card w-full max-w-md p-8 lg:mx-auto">
          <h1 className="font-display text-4xl font-bold tracking-tight">Log In</h1>
          <p className="mt-2 text-muted">For members, the Operation Team and Admin.</p>

          <div className="mt-10 grid gap-2">
            <label htmlFor="loginId" className="text-sm font-medium">Login ID</label>
            <input id="loginId" name="loginId" required autoComplete="username" className="field" />
          </div>
          <div className="mt-5 grid gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <button type="button" onClick={() => setForgot(true)} className="text-sm text-muted underline underline-offset-4 hover:text-ink">
                Forgot password?
              </button>
            </div>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
          </div>

          <p className="mt-4 min-h-5 text-sm text-danger" aria-live="polite">{state.error}</p>

          <button disabled={pending} className="btn-accent mt-2 w-full py-3 text-base">
            {pending ? "Checking…" : "Log In"}
          </button>

          <p className="mt-8 text-sm text-muted">
            Not a member yet?{" "}
            <Link href="/register" className="font-medium text-ink underline underline-offset-4 hover:no-underline">
              Register Now
            </Link>
          </p>
        </form>
        )}

        <div className="relative hidden h-[560px] lg:block">
          <div aria-hidden className="slant absolute inset-y-0 right-0 w-1/2 bg-night" />
          <div aria-hidden className="slant absolute inset-y-10 right-24 left-0 bg-brand" />
          <div className="slant absolute inset-y-0 right-12 left-12 overflow-hidden">
            <Image src="/images/towers.jpg" alt="" fill sizes="520px" className="object-cover" />
          </div>
          <div className="absolute bottom-10 left-16 rounded-2xl bg-night/90 px-6 py-5 text-white backdrop-blur-sm">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-brand uppercase">AOJE Punjab</p>
            <p className="mt-1 font-display text-2xl font-bold">Unity · Service · Progress</p>
          </div>
        </div>
      </main>
    </>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [state, action, pending] = useActionState(forgotPassword, {});
  return (
    <form action={action} className="card w-full max-w-md p-8 lg:mx-auto">
      <h1 className="font-display text-4xl font-bold tracking-tight">Forgot Password</h1>
      <p className="mt-2 text-muted">For members. We&apos;ll send a new password to your registered email and mobile.</p>

      <div className="mt-10 grid gap-2">
        <label htmlFor="f-loginId" className="text-sm font-medium">Login ID</label>
        <input id="f-loginId" name="loginId" required autoComplete="username" placeholder="e.g. aoj0005" className="field" />
      </div>
      <div className="mt-5 grid gap-2">
        <label htmlFor="f-mobile" className="text-sm font-medium">Registered mobile number</label>
        <input id="f-mobile" name="mobile" type="tel" inputMode="numeric" required autoComplete="tel" className="field" />
      </div>

      <p className={`mt-4 min-h-5 text-sm ${state.ok ? "text-accent" : "text-danger"}`} aria-live="polite">{state.ok ?? state.error}</p>

      <button disabled={pending} className="btn-accent mt-2 w-full py-3 text-base">
        {pending ? "Sending…" : "Send New Password"}
      </button>

      <p className="mt-8 text-sm text-muted">
        Operation Team or Admin? Ask the admin to reset your password.{" "}
        <button type="button" onClick={onBack} className="font-medium text-ink underline underline-offset-4 hover:no-underline">
          Back to Log In
        </button>
      </p>
    </form>
  );
}
