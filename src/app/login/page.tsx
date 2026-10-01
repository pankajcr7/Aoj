"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Wave } from "@/components/wave";
import { login } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});

  return (
    <>
      <SiteHeader actions={false} />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
        <form action={action} className="card w-full max-w-md p-8 lg:mx-auto">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Log In</h1>
          <p className="mt-2 text-muted">For members, the Operation Team and Admin.</p>

          <div className="mt-10 grid gap-2">
            <label htmlFor="loginId" className="text-sm font-medium">Login ID</label>
            <input id="loginId" name="loginId" required autoComplete="username" className="field" />
          </div>
          <div className="mt-5 grid gap-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
          </div>

          <p className="mt-4 min-h-5 text-sm text-danger" aria-live="polite">{state.error}</p>

          <button disabled={pending} className="btn-accent mt-2 w-full py-3 text-base">
            {pending ? "Checking…" : "Log In"}
          </button>

          <p className="mt-8 text-sm text-muted">
            Not a member yet?{" "}
            <Link href="/register" className="font-semibold text-accent hover:underline">
              Register Now
            </Link>
          </p>
        </form>

        <div className="card relative hidden aspect-[4/5] flex-col justify-end overflow-hidden p-10 lg:flex">
          <Wave className="absolute inset-x-0 top-10 h-2/3 w-full" />
          <p className="relative text-3xl font-semibold tracking-tight">
            One Voice for Punjab&apos;s <span className="text-accent">Power</span> Engineers
          </p>
          <p className="relative mt-3 text-muted">Association of Junior Engineers, Punjab (PSPCL/PSTCL)</p>
        </div>
      </main>
    </>
  );
}
