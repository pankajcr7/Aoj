"use client";

import { ClipboardText, Key, SignOut, SquaresFour, UserGear, UsersThree, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Role } from "@/lib/auth";
import { logout } from "../login/actions";

const ITEMS: { href: string; label: string; icon: Icon; roles: Role[]; badge?: boolean }[] = [
  { href: "/dashboard", label: "Overview", icon: SquaresFour, roles: ["admin", "operations", "member"] },
  { href: "/dashboard/applications", label: "Applications", icon: ClipboardText, roles: ["admin", "operations"], badge: true },
  { href: "/dashboard/members", label: "Members", icon: UsersThree, roles: ["admin"] },
  { href: "/dashboard/staff", label: "Staff", icon: UserGear, roles: ["admin"] },
  { href: "/dashboard/account", label: "Account", icon: Key, roles: ["admin", "operations", "member"] },
];

const ROLE_LABEL: Record<Role, string> = { admin: "Admin", operations: "Operation Team", member: "Member" };

export function DashboardNav({ role, loginId, pending }: { role: Role; loginId: string; pending: number }) {
  const path = usePathname();
  const items = ITEMS.filter((i) => i.roles.includes(role));
  const isActive = (href: string) => (href === "/dashboard" ? path === href : path.startsWith(href));

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/40 p-4 backdrop-blur-xl lg:flex">
        <div className="px-2 py-3">
          <Logo />
        </div>
        <p className="mt-4 mb-2 px-3 text-xs font-medium text-muted">{ROLE_LABEL[role]} panel</p>
        <nav className="space-y-1">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive(i.href) ? "bg-accent-soft text-ink" : "text-ink/70 hover:bg-ink/[0.04] hover:text-ink"
              }`}
            >
              <i.icon size={19} weight={isActive(i.href) ? "fill" : "regular"} className={isActive(i.href) ? "text-accent" : ""} />
              {i.label}
              {i.badge && pending > 0 && (
                <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-on-accent tabular-nums">{pending}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-line p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-on-accent uppercase">
              {loginId.slice(0, 2)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{loginId}</span>
              <span className="block text-xs text-muted">{ROLE_LABEL[role]}</span>
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <ThemeToggle />
            <form action={logout} className="flex-1">
              <button className="btn-outline w-full">
                <SignOut size={16} weight="bold" /> Log Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Logo />
          <div className="flex gap-2">
            <ThemeToggle />
            <form action={logout}>
              <button className="btn-outline size-10 p-0" aria-label="Log out">
                <SignOut size={18} weight="bold" />
              </button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium ${
                isActive(i.href) ? "bg-accent-soft text-ink" : "text-ink/70"
              }`}
            >
              <i.icon size={16} weight={isActive(i.href) ? "fill" : "regular"} />
              {i.label}
              {i.badge && pending > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] font-bold text-on-accent">{pending}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
