"use client";

import { Moon, Sun } from "@phosphor-icons/react";

// Icons swap via the `light:` CSS variant, so there is no state and no hydration mismatch.
export function ThemeToggle() {
  function toggle() {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button onClick={toggle} aria-label="Switch between light and dark mode" className="btn-outline size-10 p-0">
      <Sun size={18} weight="bold" className="light:hidden" />
      <Moon size={18} weight="bold" className="hidden light:block" />
    </button>
  );
}
