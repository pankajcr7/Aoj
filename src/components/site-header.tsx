import { CaretDown } from "@phosphor-icons/react/ssr";
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
  ["Leadership", "/#leadership"],
  ["Contact", "/#contact"],
  ["News & Media", "/news-media"],
  ["About Us", "/about-us"],
];

const infoLinks = [
  ["Regulations & Circulars", "https://pspcl.in/regulations-circulars.aspx"],
  ["Commercial Circulars", "https://pspcl.in/commercial-circulars.aspx"],
  ["Department Exam", "https://pspcl.in/department-exam.aspx"],
  ["Right to Service Act", "https://pspcl.in/right-to-service-act.aspx"],
  ["Seniority List", "https://docs.pspcl.in/vieworders.html"],
  ["Public Notice", "https://pspcl.in/public-notice.aspx"],
  ["Download Forms", "https://pspcl.in/download-forms.aspx"],
];

export function SiteHeader({ currentPage = "/" }: { currentPage?: string }) {
  return (
    <header className="sticky top-0 z-30 bg-night/95 text-white backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-[13px] text-white/70 lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} aria-current={href === currentPage ? "page" : undefined} className={`whitespace-nowrap transition hover:text-white ${href === currentPage ? "font-semibold text-white" : ""}`}>
              {label}
            </Link>
          ))}
          <div className="group relative">
            <button type="button" className="flex items-center gap-1 transition hover:text-white group-focus-within:text-white">
              Information Center <CaretDown size={12} weight="bold" />
            </button>
            <div className="invisible absolute top-full left-1/2 -translate-x-1/2 pt-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <ul className="w-60 rounded-xl border border-line bg-canvas p-2 shadow-lg">
                {infoLinks.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="block rounded-lg px-3 py-2 text-ink transition hover:bg-surface-2">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn hidden border border-white/30 px-4 py-2 text-white hover:bg-white/10 sm:inline-flex">
            Log in
          </Link>
          <Link href="/register" className="btn-brand px-4 py-2">
            Register
          </Link>
        </div>
      </div>
      <nav aria-label="Mobile navigation" className="mx-auto flex max-w-6xl gap-5 overflow-x-auto border-t border-white/10 px-4 py-2 text-[13px] whitespace-nowrap text-white/70 sm:px-6 lg:hidden">
        {links.map(([label, href]) => (
          <Link key={href} href={href} aria-current={href === currentPage ? "page" : undefined} className={`shrink-0 transition hover:text-white ${href === currentPage ? "font-semibold text-white" : ""}`}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
