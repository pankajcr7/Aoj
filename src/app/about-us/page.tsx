import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "About Us | AOJE Punjab",
  description: "About the Association of Junior Engineers, Punjab, representing Junior Engineers of PSPCL and PSTCL.",
};

export default function AboutUsPage() {
  return (
    <>
      <SiteHeader currentPage="/about-us" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">About Us</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          The Association of Junior Engineers, Punjab represents Junior Engineers of PSPCL and PSTCL.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="card p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold">Our Association</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We bring together Junior Engineers from across Punjab, with a shared commitment to unity, service and progress.
              Meet the association&apos;s office-bearers and find their contact details in our leadership section.
            </p>
            <Link href="/#leadership" className="btn-outline mt-5">Meet Our Leadership</Link>
          </section>
          <section className="card p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold">Become a Member</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Eligible engineers serving in PSPCL or PSTCL can apply online. The Operation Team reviews each application
              before issuing a membership number and member login.
            </p>
            <Link href="/register" className="btn-accent mt-5">Apply for Membership</Link>
          </section>
        </div>
        <p className="mt-8 text-sm text-muted">
          For association enquiries, <Link href="/#contact" className="font-semibold text-ink underline underline-offset-4">contact us</Link>.
        </p>
      </main>
    </>
  );
}
