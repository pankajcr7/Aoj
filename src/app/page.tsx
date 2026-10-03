import {
  Buildings,
  CaretRight,
  Certificate,
  ChatText,
  Check,
  CheckCircle,
  EnvelopeSimple,
  FileText,
  FolderSimple,
  IdentificationCard,
  Lightning,
  MapPin,
  ShieldCheck,
  User,
  UserSquare,
  UsersThree,
} from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { CausesCarousel } from "@/components/causes-carousel";
import { Logo, SiteHeader } from "@/components/site-header";
import { Wave } from "@/components/wave";

const reach = [
  { icon: Lightning, name: "PSPCL" },
  { icon: Buildings, name: "PSTCL" },
  { icon: MapPin, name: "North Zone" },
  { icon: MapPin, name: "South Zone" },
  { icon: MapPin, name: "West Zone" },
  { icon: MapPin, name: "Central Zone" },
  { icon: MapPin, name: "Border Zone" },
];

// Sample data for the interface previews only.
const queue = [
  { name: "Harjeet Kaur", date: "Submitted 13 Oct", status: "Approved" },
  { name: "Amandeep Singh", date: "Submitted 13 Oct", status: "In review" },
  { name: "Rohit Sharma", date: "Submitted 14 Oct", status: "Approved" },
  { name: "Gurpreet Sandhu", date: "Submitted 15 Oct", status: "In review" },
];

const plans = [
  {
    icon: UsersThree,
    title: "Who Can Apply",
    big: "Junior Engineers",
    unit: "",
    items: ["JE (Electrical), JE (Civil), JE (Mechanical)", "Serving in PSPCL or PSTCL", "Posted in any zone or circle", "ITI, Diploma, BE, B.Tech or M.Tech", "Agree to the constitution"],
    cta: { label: "View the Form", href: "/register" },
  },
  {
    icon: Certificate,
    title: "Membership",
    big: "₹0",
    unit: "online",
    items: ["Your own AOJ membership number", "Member login and profile", "Representation on pay and promotions", "Updates by email and SMS", "Subscription deducted from salary"],
    cta: { label: "Register Now", href: "/register" },
    featured: true,
  },
  {
    icon: FolderSimple,
    title: "Keep Ready",
    big: "10 Minutes",
    unit: "to apply",
    items: ["Employee ID number", "Date of joining PSPCL/PSTCL", "Date of joining current post", "Zone, circle, division, sub-division", "A recent passport-size photo"],
    cta: { label: "Member Login", href: "/login" },
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section id="about" className="relative overflow-hidden">
          <div className="relative z-10 mx-auto max-w-4xl px-4 pt-16 text-center sm:px-6 md:pt-24">
            <Link
              href="/register"
              className="rise inline-flex items-center gap-3 rounded-full border border-line bg-ink/[0.04] py-1 pr-3 pl-1 text-sm text-ink/75 transition hover:bg-ink/[0.07]"
            >
              <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-xs font-semibold text-ink">New</span>
              Online membership registration is open
              <CaretRight size={12} weight="bold" />
            </Link>
            <h1
              className="rise mt-7 text-[2.6rem] leading-[1.08] font-semibold tracking-tight sm:text-6xl lg:text-[4.1rem]"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              One Voice for Punjab&apos;s
              <br />
              <span className="text-accent">Power</span> Engineers
            </h1>
            <p className="rise mx-auto mt-6 max-w-xl text-ink/75" style={{ "--i": 2 } as React.CSSProperties}>
              The Association of Junior Engineers, Punjab (PSPCL/PSTCL). Apply for membership online and receive your
              login after approval.
            </p>
            <div className="rise mt-9 flex flex-wrap justify-center gap-3" style={{ "--i": 3 } as React.CSSProperties}>
              <Link href="/register" className="btn-accent px-6 py-3">
                Register Now <CaretRight size={14} weight="bold" />
              </Link>
              <Link href="/login" className="btn-outline px-6 py-3">
                Member Login
              </Link>
            </div>
          </div>
          <Wave className="drift pointer-events-none -mt-6 h-56 w-full sm:-mt-40 sm:h-[26rem]" />
        </section>

        {/* Reach strip */}
        <section className="mx-auto max-w-6xl px-4 pt-6 pb-24 text-center sm:px-6">
          <p className="text-sm text-ink/75">Representing Junior Engineers across PSPCL and PSTCL</p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 text-ink/60">
            {reach.map(({ icon: Icon, name }) => (
              <li key={name} className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Icon size={22} weight="fill" /> {name}
              </li>
            ))}
          </ul>
        </section>

        {/* Feature cards with interface previews */}
        <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-28 sm:px-6 md:grid-cols-3">
          <FeatureCard title="Simple Online Form" body="The paper membership form, now online. Fill it in on your phone in minutes.">
            <div className="absolute bottom-0 left-4 h-40 w-32 rounded-t-xl border border-line bg-surface-2/70" />
            <div className="absolute right-4 bottom-0 left-12 rounded-t-xl border border-line bg-surface-2 p-4 shadow-2xl">
              <p className="inline-block border-b-2 border-accent pb-1 text-xs font-semibold">Membership Form</p>
              <div className="mt-3 flex gap-3">
                <div className="grid h-16 w-13 shrink-0 place-items-center rounded-md border border-dashed border-ink/20 text-muted">
                  <UserSquare size={22} />
                </div>
                <div className="flex-1 space-y-2.5">
                  {["Name", "Employee ID No.", "Posting Circle"].map((l) => (
                    <div key={l}>
                      <p className="text-[10px] text-muted">{l}</p>
                      <div className="mt-1 h-2 rounded-full bg-ink/10" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 h-7 rounded-md bg-accent/90" />
            </div>
          </FeatureCard>

          <FeatureCard title="Quick Review" body="The Operation Team reviews every application from one dashboard.">
            <div className="absolute inset-x-5 top-4 rounded-xl border border-accent/15 bg-tint p-3">
              <div className="grid grid-cols-7 text-center text-[10px] text-muted">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, n) => (
                  <span key={n}>{d}</span>
                ))}
              </div>
              <div className="mt-1.5 grid grid-cols-7 text-center text-xs">
                {[11, 12, 13, 14, 15, 16, 17].map((d) => (
                  <span key={d} className={`mx-auto rounded-md px-1.5 py-1 ${d === 13 || d === 15 ? "border border-ink/25" : ""}`}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <ul className="absolute inset-x-8 top-24 bottom-0 divide-y divide-line rounded-t-xl border border-line bg-surface-2 px-3">
              {queue.map((q) => (
                <li key={q.name} className="flex items-center gap-2.5 py-2">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-ink/10">
                    <FileText size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{q.name}</span>
                    <span className="block text-[10px] text-muted">{q.date}</span>
                  </span>
                  <span className={`text-[10px] font-semibold ${q.status === "Approved" ? "text-accent" : "text-muted"}`}>{q.status}</span>
                </li>
              ))}
            </ul>
          </FeatureCard>

          <FeatureCard title="Instant Login" body="Once approved, your membership number and login reach you by email and SMS.">
            <div className="absolute top-14 -left-3 w-52 rotate-[-4deg] rounded-xl border border-line bg-surface-2/80 p-3.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-muted">
                <ChatText size={14} weight="fill" className="text-accent" /> SMS
              </p>
              <p className="mt-2 text-xs leading-relaxed">Your AOJ login ID is aoj0418. Welcome to the association.</p>
            </div>
            <div className="absolute top-4 -right-3 w-56 rounded-xl border border-line bg-surface-2 p-4 shadow-2xl">
              <div className="flex gap-1 text-accent">
                {[0, 1, 2, 3].map((n) => (
                  <CheckCircle key={n} size={16} weight="fill" />
                ))}
              </div>
              <p className="mt-2.5 text-xs leading-relaxed">
                Your membership <b>AOJE-0418</b> is approved. Log in with the password sent to your email.
              </p>
              <p className="mt-3 flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-accent text-on-accent">
                  <EnvelopeSimple size={14} weight="bold" />
                </span>
                <span>
                  <span className="block text-[11px] font-semibold">Operation Team</span>
                  <span className="block text-[10px] text-muted">AOJ Punjab</span>
                </span>
              </p>
            </div>
          </FeatureCard>
        </section>

        {/* How it works bento */}
        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-28 sm:px-6">
          <SectionHead title="How It Works" body="From the membership form to your member login, in four steps." />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <StepCard n={1} title="Fill the Form" body="Enter your personal, service and posting details." />
            <StepCard n={2} title="Upload Your Photo" body="Add a passport-size photo and accept the declaration." />
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-[2fr_3fr]">
            <div className="card reveal flex flex-col overflow-hidden p-6">
              <div className="relative flex h-52 flex-col items-center justify-center">
                <span className="rounded-lg border border-line bg-ink/[0.06] px-5 py-2 text-sm font-semibold">Operation Team</span>
                <svg viewBox="0 0 240 50" className="h-12 w-60 text-ink/15" fill="none" stroke="currentColor" aria-hidden>
                  <path d="M120 0v50M120 10C120 30 30 20 30 50M120 10c0 20 90 10 90 40" />
                </svg>
                <div className="flex gap-4">
                  {[IdentificationCard, Buildings, ShieldCheck].map((Icon, n) => (
                    <span
                      key={n}
                      className="grid size-16 place-items-center rounded-xl border border-line bg-linear-to-b from-tint to-tint-2 text-accent"
                    >
                      <Icon size={30} weight="duotone" />
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="mt-6 font-semibold">3. Verification</h3>
              <p className="mt-1 text-sm text-muted">Details are checked against employee records and posting.</p>
            </div>

            <div className="card reveal flex flex-col overflow-hidden p-6">
              <div className="relative flex h-52 items-center justify-center">
                <div className="w-full max-w-xs rounded-xl border border-line bg-linear-to-b from-surface-2 to-surface p-5">
                  <span className="grid size-9 place-items-center rounded-full bg-ink/10">
                    <ShieldCheck size={18} weight="fill" />
                  </span>
                  <p className="mt-3 text-xl font-semibold">Member</p>
                  <p className="text-sm font-semibold">
                    AOJE-0418 <span className="text-xs font-normal text-muted">/membership no.</span>
                  </p>
                  <div className="my-3 h-px bg-line" />
                  <p className="flex items-center gap-2 text-xs text-ink/80">
                    <Check size={14} weight="bold" className="text-accent" /> Login ID and password sent
                  </p>
                </div>
                <span className="absolute top-1/2 right-[8%] grid size-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-tint text-accent shadow-[0_0_24px_-4px_var(--accent)]">
                  <User size={20} weight="fill" />
                </span>
              </div>
              <h3 className="mt-6 font-semibold">4. Receive Your Login</h3>
              <p className="mt-1 text-sm text-muted">Log in to see your membership details and updates.</p>
            </div>
          </div>
        </section>

        {/* Membership, pricing-style cards */}
        <section id="membership" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-28 sm:px-6">
          <SectionHead
            title="Membership Made Simple"
            body="No online payment. Subscription is deducted from salary, as decided by the general house."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {plans.map((p) => (
              <article
                key={p.title}
                className={`card reveal flex flex-col p-6 ${p.featured ? "border-accent/40 shadow-[0_0_60px_-30px_var(--accent)]" : ""}`}
              >
                <span className="grid size-10 place-items-center rounded-full bg-ink/[0.06]">
                  <p.icon size={18} weight="fill" className={p.featured ? "text-accent" : ""} />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{p.title}</h3>
                <p className="text-2xl font-semibold tracking-tight">
                  {p.big}
                  {p.unit && <span className="text-xs font-normal text-muted"> /{p.unit}</span>}
                </p>
                <div className="my-5 h-px bg-line" />
                <ul className="flex-1 space-y-3 text-sm text-ink/80">
                  {p.items.map((t) => (
                    <li key={t} className="flex gap-2.5">
                      <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-accent" /> {t}
                    </li>
                  ))}
                </ul>
                <Link href={p.cta.href} className={`${p.featured ? "btn-accent" : "btn-outline"} mt-7 w-full py-3`}>
                  {p.cta.label}
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* What we work for */}
        <section id="what-we-work-for" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-28 sm:px-6">
          <SectionHead title="What We Work For" body="The demands the association raises with PSPCL and PSTCL management." />
          <div className="mt-12">
            <CausesCarousel />
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Association of Junior Engineers, Punjab (PSPCL/PSTCL) (Regd.). Licence No. PB41/253/351836 dated
              03.10.2022.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Quick Links</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li><Link href="/register" className="hover:text-ink">Register Now</Link></li>
              <li><Link href="/login" className="hover:text-ink">Member Login</Link></li>
              <li><Link href="/#membership" className="hover:text-ink">Membership</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Head Office</p>
            <address className="mt-4 flex gap-2 text-sm leading-relaxed text-muted not-italic">
              <MapPin size={18} className="mt-0.5 shrink-0 text-accent" />
              <span>Engineers&apos; Square, 20E/5, Ground Floor, Tripuri Town, Patiala, Punjab</span>
            </address>
          </div>
        </div>
        <p className="border-t border-line py-5 text-center text-xs text-muted">
          © {new Date().getFullYear()} Association of Junior Engineers, Punjab. All rights reserved.
        </p>
      </footer>
    </>
  );
}

function SectionHead({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{body}</p>
    </div>
  );
}

function FeatureCard({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <article className="card reveal flex flex-col overflow-hidden">
      <div className="p-6 pb-0">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      </div>
      <div className="relative mt-6 h-60 overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent)]" aria-hidden>
        {children}
      </div>
    </article>
  );
}

function StepCard({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="card reveal px-6 py-5">
      <h3 className="font-semibold">
        {n}. {title}
      </h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
