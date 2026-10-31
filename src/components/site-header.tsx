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
  ["Membership", "/#membership"],
  ["Leadership", "/#leadership"],
  ["Contact", "/#contact"],
  ["News & Media", "/news-media"],
  ["About Us", "/about-us"],
];

export function SiteHeader({ actions = true, currentPage = "/" }: { actions?: boolean; currentPage?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        {actions && (
          <nav aria-label="Main navigation" className="hidden items-center gap-6 text-[13px] text-muted lg:flex">
            {links.map(([label, href]) => (
              <Link key={href} href={href} aria-current={href === currentPage ? "page" : undefined} className={`whitespace-nowrap transition hover:text-ink ${href === currentPage ? "font-semibold text-ink" : ""}`}>
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
      {actions && (
        <nav aria-label="Mobile navigation" className="mx-auto flex max-w-6xl gap-5 overflow-x-auto border-t border-line px-4 py-2 text-[13px] whitespace-nowrap text-muted sm:px-6 lg:hidden">
          {links.map(([label, href]) => (
            <Link key={href} href={href} aria-current={href === currentPage ? "page" : undefined} className={`shrink-0 transition hover:text-ink ${href === currentPage ? "font-semibold text-ink" : ""}`}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
