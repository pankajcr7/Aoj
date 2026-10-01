import { CaretDown, Lightning } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1.5" aria-label="Association of Junior Engineers, Punjab home">
      <Lightning size={26} weight="fill" className="text-accent" />
      <span className="text-lg font-semibold tracking-tight">
        AOJ<span className="font-normal">Punjab</span>
      </span>
    </Link>
  );
}

const links = [
  ["About", "/#about"],
  ["How It Works", "/#how-it-works"],
  ["Membership", "/#membership"],
  ["Contact", "/#contact"],
];

export function SiteHeader({ actions = true }: { actions?: boolean }) {
  return (
    <header className="sticky top-0 z-20 bg-canvas/70 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        {actions && (
          <nav className="hidden items-center gap-9 text-sm text-ink/80 md:flex">
            <Link href="/" className="flex items-center gap-1 transition hover:text-ink">
              Home <CaretDown size={12} weight="bold" />
            </Link>
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="transition hover:text-ink">
                {label}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {actions && (
            <>
              <Link href="/login" className="hidden px-3 text-sm font-semibold text-ink/80 transition hover:text-ink sm:block">
                Log In
              </Link>
              <Link href="/register" className="btn-outline px-4 py-2.5">
                Register Now
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
