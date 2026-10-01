import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Membership Form | AOJ Punjab" };

export default function RegisterPage() {
  return (
    <>
      <SiteHeader actions={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:py-14">
        <div className="mb-10 text-center">
          <p className="inline-flex items-center rounded-full border border-line bg-ink/[0.04] px-3 py-1 text-xs text-muted">
            Licence No. PB41/253/351836
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Membership Form</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Association of Junior Engineers, Punjab (PSPCL/PSTCL). It takes about 10 minutes.
          </p>
        </div>
        <RegisterForm />
      </main>
    </>
  );
}
