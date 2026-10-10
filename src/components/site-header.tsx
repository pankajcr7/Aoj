import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Association of Junior Engineers, Punjab home">
      <Image src="/logo.jpeg" alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
      <span className="font-display text-base font-bold tracking-tight whitespace-nowrap text-brand sm:text-xl">
        AOJE PUNJAB
      </span>
    </Link>
  );
}

const links = [
  ["Home", "/"],
  ["How it works", "/#how-it-works"],
  ["Membership", "/#membership"],
  ["Leadership", "/#leadership"],
  ["Contact", "/#contact"],
];

export function SiteHeader({ actions = true }: { actions?: boolean }) {
  return (
    <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        {actions && (
          <nav className="hidden items-center gap-8 text-[13px] text-muted md:flex">
            {links.map(([label, href], i) => (
              <Link key={href} href={href} className={`transition hover:text-ink ${i === 0 ? "font-semibold text-ink" : ""}`}>
                {label}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {actions && (
            <>
              <Link href="/login" className="btn-outline hidden px-4 py-2 sm:inline-flex">
                Log in
              </Link>
              <Link href="/register" className="btn-accent px-4 py-2">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
