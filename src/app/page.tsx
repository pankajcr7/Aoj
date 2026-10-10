import {
  Check,
  CurrencyInr,
  Lightning,
  ListChecks,
  MapPin,
  Phone,
  UsersThree,
} from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { Logo, SiteHeader } from "@/components/site-header";
import { RAZORPAY_ENABLED } from "@/lib/payment-rules";

const facts = [
  { icon: Lightning, title: "PSPCL & PSTCL", sub: "Both corporations" },
  { icon: MapPin, title: "6 Zones", sub: "Across Punjab" },
  { icon: CurrencyInr, title: "Rs.200 / month", sub: "Or Rs.2,000 / year" },
];

const steps = [
  { title: "Fill in the Form", body: "Your personal, service and posting details, on a phone or computer.", img: "/images/step-1.jpg", tile: "bg-night" },
  { title: RAZORPAY_ENABLED ? "Photo & Payment" : "Photo & Submit", body: RAZORPAY_ENABLED ? "Upload your photo, accept the declaration and pay your selected membership fee." : "Upload your photo, accept the declaration and submit your application.", img: "/images/step-machinery.jpg", tile: "bg-violet" },
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
    icon: ListChecks,
    title: "Keep Ready",
    items: ["Employee ID number", "Dates of joining PSPCL/PSTCL and current post", "Zone, circle, division, sub-division", "A recent passport-size photo"],
  },
];

// State Body Leadership (from the association's office-bearer list).
const heads = [
  { role: "AOJE / State President", name: "Er. Ranjeet Singh Dhillon", image: "/images/state-president-pic.jpeg", office: "O/o Operation Division Kharar", mobiles: ["82880-91003", "96461-10292"] },
  { role: "Finance Secretary / AOJE", name: "Er. Navjot Singh", image: "/images/finance-secretary-PIC.jpeg", office: null, mobiles: ["98592-52000"] },
  { role: "General Secretary / AOJE", name: "Er. Harmandeep", image: "/images/gneeral-scretary-pic.jpeg", office: "O/o Operation Division Samana", mobiles: ["86993-32052", "96461-38121"] },
];
const leaders = [
  ["Sr. Vice President", "Er. Maninder Singh Dhillon AAE", "90412-02088"],
  ["Vice President", "Er. Jagtar Singh AAE", "80544-99135"],
  ["Secretary", "Er. Eshan Bansal AAE", "99140-69149"],
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
                <Link href="/login" target="_blank" rel="noopener noreferrer" className="btn-outline px-6 py-3">
                  Admin Login
                </Link>
              </div>
            </div>

            <div className="rise" style={{ "--i": 2 } as React.CSSProperties}>
              <Image
                src="/images/Cooling Towers Reflected on a Lake.png"
                alt="Power station cooling towers reflected in a lake"
                width={1254}
                height={1254}
                preload
                sizes="(min-width: 1024px) 560px, 100vw"
                className="rounded-2xl"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>
        </section>

        {/* Facts */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
                  Membership: <span className="font-semibold text-white">Rs.200/- monthly or Rs.2,000/- yearly</span>
                  <span className="mt-1 block">Optional physical PVC card: Rs.200/- including printing and delivery.</span>
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
            body="Who can apply and what to keep ready for your membership application."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {membership.map(({ icon: Icon, title, items }, n) => (
              <article
                key={title}
                className="reveal rounded-2xl border border-line bg-surface p-8"
                style={{ "--i": n } as React.CSSProperties}
              >
                <span className="slant grid h-11 w-[60px] place-items-center bg-night text-white">
                  <Icon size={20} weight="bold" />
                </span>
                <h3 className="mt-6 font-display text-xl font-bold">{title}</h3>
                <ul className="mt-4 space-y-3 text-sm text-muted">
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

        {/* State Body Leadership */}
        <section id="leadership" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
          <Heading center title="State Body Leadership" body="The office-bearers of the Association of Junior Engineers, Punjab." />
          <div className="mx-auto mt-14 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))" }}>
            {heads.map((h) => (
              <article key={h.role} className="reveal rounded-2xl bg-night text-center text-white" style={{ padding: "32px 24px" }}>
                <div className="mx-auto overflow-hidden rounded-full border-4 border-canvas bg-surface" style={{ width: 128, height: 128 }}>
                  <Image
                    src={h.image}
                    alt={`Portrait of ${h.name}`}
                    width={128}
                    height={128}
                    sizes="128px"
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                  />
                </div>
                <p className="mt-6 text-[11px] font-semibold tracking-[0.14em] text-brand uppercase">{h.role}</p>
                <h3 className="mt-2 font-display text-2xl font-bold">{h.name}</h3>
                {h.office && <p className="mt-1 text-sm text-white/60">{h.office}</p>}
                <p className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1">
                  {h.mobiles.map((n) => (
                    <Mobile key={n} n={n} className="text-white/80 hover:text-white" />
                  ))}
                </p>
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
              Association of Junior Engineers, Punjab (PSPCL/PSTCL) (Regd.). Licence No. PB41/253/351836, dated 03.10.2022.
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
              H.Q. 67-C Ranjit Nagar Near Tiwana Chownk Patiala (147001)
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
