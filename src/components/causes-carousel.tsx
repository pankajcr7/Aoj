"use client";

import { CaretLeft, CaretRight, Clock, CurrencyInr, Lightning, TrendUp, UsersThree } from "@phosphor-icons/react";
import { useState } from "react";

const causes = [
  { icon: CurrencyInr, title: "Fair Pay", text: "Pay scales and starting pay for Junior Engineers in line with other engineering cadres of the state." },
  { icon: Clock, title: "Reasonable Duty Hours", text: "Fixed, capped duty hours for engineers posted on field and sub-station duty." },
  { icon: TrendUp, title: "Timely Promotions", text: "A fair promotion quota for Junior Engineers, with promotions given on time." },
  { icon: UsersThree, title: "Vacancies Filled", text: "Enough staff in every sub-division so that field work stays safe and manageable." },
];

export function CausesCarousel() {
  const [i, setI] = useState(0);
  const { icon: Icon, title, text } = causes[i];
  const go = (d: number) => setI((i + d + causes.length) % causes.length);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="card px-6 py-12 text-center sm:px-16" aria-live="polite">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon size={28} weight="fill" />
        </div>
        <h3 className="mt-6 text-2xl font-semibold">{title}</h3>
        <p className="mx-auto mt-3 max-w-[52ch] leading-relaxed text-ink/80">{text}</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-surface-2 text-accent">
            <Lightning size={18} weight="fill" />
          </span>
          <span className="text-left">
            <span className="block text-sm font-semibold">Association of Junior Engineers</span>
            <span className="block text-xs text-muted">Charter of demands to PSPCL and PSTCL</span>
          </span>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-1.5">
        {causes.map((c, n) => (
          <button
            key={c.title}
            onClick={() => setI(n)}
            aria-label={`Show ${c.title}`}
            className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-ink" : "w-1.5 bg-ink/25"}`}
          />
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={() => go(-1)} aria-label="Previous" className="btn-outline size-11 p-0">
          <CaretLeft size={16} weight="bold" />
        </button>
        <button onClick={() => go(1)} aria-label="Next" className="btn-outline size-11 p-0">
          <CaretRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
