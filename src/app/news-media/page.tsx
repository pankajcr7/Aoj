import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "News & Media | AOJE Punjab",
  description: "News, announcements and media coverage from the Association of Junior Engineers, Punjab.",
};

export default function NewsMediaPage() {
  return (
    <>
      <SiteHeader currentPage="/news-media" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">News &amp; Media</h1>
        <p className="mt-4 max-w-xl text-muted">News, announcements and media coverage from the Association of Junior Engineers, Punjab.</p>
        <div className="card mt-10 p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold">No updates published yet</h2>
          <p className="mt-2 text-sm text-muted">Association news and media coverage will appear here.</p>
        </div>
        <Link href="/" className="btn-outline mt-6">Back to Home</Link>
      </main>
    </>
  );
}
