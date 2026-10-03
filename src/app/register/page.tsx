import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { MembershipForm } from "./register-form";

export const metadata: Metadata = { title: "Membership Form | AOJ Punjab" };

export default function RegisterPage() {
  return (
    <>
      <SiteHeader actions={false} />
      <main className="w-full flex-1 px-2 py-6 sm:px-4 lg:py-10">
        <MembershipForm />
      </main>
    </>
  );
}
