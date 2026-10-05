import {
  Check,
  Clock,
  CurrencyInr,
  IdentificationCard,
  Lightning,
  ListChecks,
  MapPin,
  Phone,
  TrendUp,
  UsersThree,
  Wallet,
} from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { Logo, SiteHeader } from "@/components/site-header";

const facts = [
  { icon: Lightning, title: "PSPCL & PSTCL", sub: "Both corporations" },
  { icon: MapPin, title: "6 Zones", sub: "Across Punjab" },
  { icon: CurrencyInr, title: "Free", sub: "No online payment" },
  { icon: Wallet, title: "Salary Deduction", sub: "As the general house decides" },
];

const steps = [
  { title: "Fill in the Form", body: "Your personal, service and posting details, on a phone or computer.", img: "/images/step-1.jpg", tile: "bg-night" },
  { title: "Photo & Declaration", body: "Upload a passport-size photo and accept the declaration.", img: "/images/step-machinery.jpg", tile: "bg-violet" },
  { title: "Verification", body: "The Operation Team checks your details against employee records.", img: "/images/step-3.jpg", tile: "bg-brand" },
  { title: "Receive Your Login", body: "Membership number, login ID and password by email and SMS.", img: "/images/step-lab.jpg", tile: "bg-night" },
];

const membership = [
  {
    icon: UsersThree,
    title: "Who Can Apply",
    items: ["JE (Electrical), JE (Civil), JE (Mechanical) and AAE", "Serving in PSPCL or PSTCL", "Posted in any zone, circle or office", "ITI, Diploma, BE, B.Tech or M.Tech"],
  },
  {
    icon: IdentificationCard,
    title: "What You Get",
    items: ["Your own AOJE membership number", "Member login and ID card (PDF)", "Representation on pay and promotions", "Updates by email and SMS"],
    dark: true,
  },
  {
    icon: ListChecks,
    title: "Keep Ready",
    items: ["Employee ID number", "Dates of joining PSPCL/PSTCL and current post", "Zone, circle, division, sub-division", "A recent passport-size photo"],
  },
];

const demands = [
  { icon: CurrencyInr, title: "Fair Pay", body: "Pay scales and starting pay for Junior Engineers in line with other engineering cadres of the state." },
  { icon: Clock, title: "Fair Duty Hours", body: "Fixed, capped duty hours for engineers posted on field and sub-station duty." },
  { icon: TrendUp, title: "Timely Promotions", body: "A fair promotion quota for Junior Engineers, with promotions given on time." },
  { icon: UsersThree, title: "Vacancies Filled", body: "Enough staff in every sub-division so that field work stays safe and manageable." },
];

// State Body Leadership (from the association's office-bearer list).
const heads = [
  { role: "President", name: "Er. Ranjit Singh Dhillon JE", office: "O/o Operation Division Kharar", mobiles: ["82880-91003", "96461-10292"] },
  { role: "General Secretary", name: "Er. Harmandeep AAE", office: "O/o Operation Division Samana", mobiles: ["86993-32052", "96461-38121"] },
];
const leaders = [
  ["Sr. Vice President", "Er. Maninder Singh Dhillon AAE", "90412-02088"],
  ["Vice President", "Er. Jagtar Singh AAE", "80544-99135"],
  ["Secretary", "Er. Eshan Bansal AAE", "99140-69149"],
  ["Finance Secretary", "Er. Navjot Singh Dhot AAE", "98592-52000"],
  ["Office Secretary", "Er. Gurmeet Singh JE", "98884-09262"],
  ["Joint Secretary Finance", "Er. Gurdit Singh JE", "95016-39126"],
  ["Chief Advisor", "Er. Harpreet Singh Grewal JE", "96461-00087"],
  ["Auditor", "Er. Shiraz Anav Misra AAE", "89686-50133"],
  ["Organizational Secretary", "Er. Gurpreet Singh Malhi AAE", "96461-17000"],
  ["Technical Advisor", "Er. Dilpreet Singh JE", "94176-56002"],
  ["Secretary Press & Media", "Er. Karandeep Singh JE", "85588-01333"],
  ["Secretary P&M Wing", "Er. Paramvir Singh Bhullar JE", "89682-55500"],
  ["Advisor Legal Affairs", "Er. Major Singh Sidhu JE", "99883-70200"],
  ["Executive Member", "Er. Arshveer Singh JE", "88006-35419"],
  ["Executive Member", "Er. Rajiv Sharma JE", "99156-00985"],
  ["Executive Member", "Er. Inderjeet Singh JE", "94620-11102"],
];

// "Er. Ranjit Singh Dhillon JE" -> "RD"
const initials = (name: string) => {
  const w = name.replace(/^Er\.\s*/, "").split(" ").slice(0, -1);
  return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
};

function Mobile({ n, className = "text-muted hover:text-ink" }: { n: string; className?: string }) {
  return (
    <a href={`tel:+91${n.replace("-", "")}`} className={`inline-flex items-center gap-1.5 text-sm transition ${className}`}>
      <Phone size={14} weight="fill" className="text-brand" /> {n}
    </a>
  );
}

function Dash({ className = "bg-ink" }: { className?: string }) {
  return <span className={`h-[2px] w-5 shrink-0 ${className}`} aria-hidden />;
}

function Heading({ title, body, center, children }: { title: string; body: string; center?: boolean; children?: React.ReactNode }) {
  return (
    <div className={`reveal flex flex-wrap items-end gap-6 ${center ? "justify-center text-center" : "justify-between"}`}>
      <div>
        <h2 className="font-display text-[2.1rem] leading-tight font-bold tracking-tight sm:text-4xl">{title}</h2>
        <p className={`mt-3 max-w-md text-sm text-muted ${center ? "mx-auto" : ""}`}>{body}</p>
      </div>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section id="about" className="relative overflow-hidden">
          <div aria-hidden className="slant absolute top-0 right-[-7%] hidden h-full w-[33%] bg-night lg:block" />
          <div aria-hidden className="slant absolute bottom-0 left-[-12%] hidden h-44 w-[28%] bg-surface-2 lg:block" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 lg:min-h-[620px] lg:grid-cols-[1fr_1.05fr] lg:py-0">
            <div className="max-w-xl">
              <p className="eyebrow rise">Regd. Licence No. PB41/253/351836</p>
              <h1
                className="rise mt-4 font-display text-[2.6rem] leading-[1.12] font-semibold tracking-tight sm:text-[3.6rem]"
                style={{ "--i": 1 } as React.CSSProperties}
              >
                One Voice for Punjab&apos;s Power Engineers
              </h1>
              <p className="rise mt-6 max-w-md text-[15px] text-muted" style={{ "--i": 2 } as React.CSSProperties}>
                The Association of Junior Engineers, Punjab represents Junior Engineers of PSPCL and PSTCL. Apply for membership
                online and receive your membership number and login after approval.
              </p>
              <div className="rise mt-9 flex flex-wrap gap-3" style={{ "--i": 3 } as React.CSSProperties}>
                <Link href="/register" className="btn-accent px-6 py-3">
                  Apply for Membership
                </Link>
                <Link href="/login" className="btn-outline px-6 py-3">
                  Member Login
                </Link>
              </div>
            </div>

            <div className="rise relative h-[380px] sm:h-[480px] lg:h-[560px]" style={{ "--i": 2 } as React.CSSProperties}>
              <div aria-hidden className="slant absolute inset-y-8 right-10 left-0 bg-brand" />
              <div className="slant absolute inset-y-0 right-0 left-10 overflow-hidden">
                <Image
                  src="/images/hero.jpg"
                  alt="Engineer in a safety helmet at an electrical panel"
                  fill
                  priority
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="object-cover object-top"
                />
              </div>
              <span aria-hidden className="absolute bottom-6 left-[-4%] size-4 rotate-12 rounded-[3px] bg-brand" />
            </div>
          </div>
        </section>

        {/* Facts */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map(({ icon: Icon, title, sub }, n) => (
              <li key={title} className="reveal flex items-center gap-4" style={{ "--i": n } as React.CSSProperties}>
                <span className={`slant grid h-12 w-[68px] shrink-0 place-items-center text-white ${n % 2 ? "bg-night" : "bg-brand"}`}>
                  <Icon size={22} weight="bold" />
                </span>
                <span>
                  <span className="block font-display text-lg leading-tight font-bold">{title}</span>
                  <span className="block text-sm text-muted">{sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <Heading title="How It Works" body="The paper membership form, now online. Four steps from the form to your member login.">
            <Link href="/register" className="btn-accent">
              Start Now
            </Link>
          </Heading>
          <ol className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, n) => (
              <li key={s.title} className="reveal" style={{ "--i": n } as React.CSSProperties}>
                <div className="relative h-56">
                  <div aria-hidden className={`slant-soft absolute inset-0 ${s.tile}`} />
                  <div className="slant-soft absolute inset-x-5 top-5 bottom-0 overflow-hidden">
                    <Image src={s.img} alt="" fill sizes="(min-width: 1024px) 270px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                  </div>
                </div>
                <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-muted">
                  <Dash /> Step 0{n + 1}
                </p>
                <h3 className="mt-1.5 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Promo band */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="reveal relative overflow-hidden rounded-2xl bg-night text-white">
            <div aria-hidden className="slant absolute top-0 -right-14 hidden h-full w-32 bg-white/[0.06] lg:block" />
            <div className="relative grid lg:min-h-[340px] lg:grid-cols-[1fr_1.1fr]">
              <div className="relative h-60 lg:h-auto">
                <div aria-hidden className="slant absolute inset-y-0 -left-16 right-14 bg-brand" />
                <div className="slant absolute inset-y-0 -left-6 right-0 overflow-hidden">
                  <Image src="/images/towers.jpg" alt="High-voltage transmission towers at sunset" fill sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />
                </div>
              </div>
              <div className="flex flex-col justify-center px-8 py-10 lg:px-12">
                <h2 className="max-w-md font-display text-3xl leading-tight font-bold sm:text-4xl">Registration Takes About Ten Minutes.</h2>
                <p className="mt-4 text-sm text-white/70">
                  Online fee: <span className="font-semibold text-white">₹0</span>
                  <span className="mx-2 text-white/30">·</span>
                  Subscription deducted from salary
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/register" className="btn-brand px-5 py-2.5">
                    Apply Now
                  </Link>
                  <Link href="/login" className="btn border border-white/30 px-5 py-2.5 text-white hover:bg-white/10">
                    Member Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Membership */}
        <section id="membership" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <Heading
            title="Membership Made Simple"
            body="No online payment. Subscription is deducted from salary, as decided by the general house."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {membership.map(({ icon: Icon, title, items, dark }, n) => (
              <article
                key={title}
                className={`reveal rounded-2xl p-8 ${dark ? "bg-night text-white" : "border border-line bg-surface"}`}
                style={{ "--i": n } as React.CSSProperties}
              >
                <span className={`slant grid h-11 w-[60px] place-items-center text-white ${dark ? "bg-brand" : "bg-night"}`}>
                  <Icon size={20} weight="bold" />
                </span>
                <h3 className="mt-6 font-display text-xl font-bold">{title}</h3>
                <ul className={`mt-4 space-y-3 text-sm ${dark ? "text-white/75" : "text-muted"}`}>
                  {items.map((t) => (
                    <li key={t} className="flex gap-2.5">
                      <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-brand" /> {t}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            If the subscription is not paid for six consecutive months, membership may be ceased without notice.
          </p>
        </section>

        {/* What we work for */}
        <section id="what-we-work-for" className="scroll-mt-20 bg-surface-2">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <Heading center title="What We Work For" body="The demands the association raises with PSPCL and PSTCL management." />
            <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {demands.map(({ icon: Icon, title, body }, n) => (
                <div key={title} className="reveal relative pt-9" style={{ "--i": n } as React.CSSProperties}>
                  <span className="absolute top-0 left-1/2 z-10 grid size-[72px] -translate-x-1/2 place-items-center rounded-full border-4 border-surface-2 bg-brand text-white">
                    <Icon size={28} weight="bold" />
                  </span>
                  <div className="slant-soft h-full bg-night px-9 pt-14 pb-10 text-center text-white">
                    <p className="text-sm leading-relaxed text-white/75">{body}</p>
                    <p className="mt-6 inline-flex items-center gap-2 font-display font-bold">
                      <Dash className="bg-white" /> {title}
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">Charter of demands</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* State Body Leadership */}
        <section id="leadership" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
          <Heading center title="State Body Leadership" body="The office-bearers of the Association of Junior Engineers, Punjab." />
          <div className="mx-auto mt-14 grid max-w-4xl gap-x-6 gap-y-12 md:grid-cols-2">
            {heads.map((h) => (
              <article key={h.role} className="reveal relative pt-9">
                <span className="absolute top-0 left-1/2 z-10 grid size-[72px] -translate-x-1/2 place-items-center rounded-full border-4 border-canvas bg-brand font-display text-xl font-bold text-white">
                  {initials(h.name)}
                </span>
                <div className="slant-soft bg-night px-10 pt-14 pb-10 text-center text-white">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-brand uppercase">{h.role}</p>
                  <h3 className="mt-2 font-display text-2xl font-bold">{h.name}</h3>
                  <p className="mt-1 text-sm text-white/60">{h.office}</p>
                  <p className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1">
                    {h.mobiles.map((n) => (
                      <Mobile key={n} n={n} className="text-white/80 hover:text-white" />
                    ))}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {leaders.map(([role, name, mobile]) => (
              <li key={name} className="reveal rounded-2xl border border-line bg-surface p-5 transition hover:border-brand/60">
                <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">
                  <Dash className="bg-brand" /> {role}
                </p>
                <p className="mt-2.5 font-display font-bold">{name}</p>
                <p className="mt-2">
                  <Mobile n={mobile} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer id="contact" className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1.2fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted">
              Association of Junior Engineers, Punjab (PSPCL/PSTCL) (Regd.). Licence No. PB41/253/351836 dated 03.10.2022.
            </p>
          </div>
          <div>
            <p className="font-display font-bold">Quick Links</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li><Link href="/register" className="hover:text-ink">Register</Link></li>
              <li><Link href="/login" className="hover:text-ink">Member Login</Link></li>
              <li><Link href="/#membership" className="hover:text-ink">Membership</Link></li>
              <li><Link href="/#leadership" className="hover:text-ink">Leadership</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-display font-bold">Head Office</p>
            <address className="mt-4 text-sm text-muted not-italic">
              Engineers&apos; Square, 20E/5, Ground Floor, Tripuri Town, Patiala, Punjab
            </address>
          </div>
          <div>
            <p className="font-display font-bold">Contact</p>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted">General Secretary</p>
              <Mobile n="86993-32052" />
            </div>
          </div>
        </div>
        <p className="border-t border-line py-5 text-center text-xs text-muted">
          Copyright © {new Date().getFullYear()} Association of Junior Engineers, Punjab. All rights reserved.
        </p>
      </footer>
    </>
  );
}
