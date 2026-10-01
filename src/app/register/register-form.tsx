"use client";

import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Buildings,
  Camera,
  Check,
  CheckCircle,
  ClipboardText,
  EnvelopeSimple,
  GearSix,
  HardHat,
  House,
  IdentificationCard,
  Info,
  Lightning,
  MapPin,
  PencilSimple,
  Phone,
  Trash,
  TreeStructure,
  UploadSimple,
  User,
  WarningCircle,
  type Icon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { register, type RegisterState } from "./actions";

type Errors = NonNullable<RegisterState["errors"]>;
type Name = keyof Errors;
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const MAX_PHOTO = 500 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png"];

const STEPS: { title: string; short: string; desc: string; icon: Icon; fields: Name[] }[] = [
  {
    title: "Personal Details",
    short: "Personal",
    desc: "Tell us who you are and where you live.",
    icon: User,
    fields: ["name", "fatherName", "dob", "contact", "email", "address", "pinCode"],
  },
  {
    title: "Service Details",
    short: "Service",
    desc: "Your organisation, post, joining dates and qualification.",
    icon: Briefcase,
    fields: ["company", "designation", "employeeId", "dojCompany", "dojCompanyAs", "dojCurrentPost", "dojCurrentPostAs", "qualification", "discipline"],
  },
  {
    title: "Posting Details",
    short: "Posting",
    desc: "Where you are posted right now.",
    icon: TreeStructure,
    fields: ["zone", "circle", "division", "subDivision", "officeAddress"],
  },
  {
    title: "Passport Photo",
    short: "Photo",
    desc: "A recent passport-size photo for your member record.",
    icon: Camera,
    fields: ["photo"],
  },
  {
    title: "Review and Submit",
    short: "Review",
    desc: "Check your details, accept the declaration and submit.",
    icon: ClipboardText,
    fields: ["declarationAccepted"],
  },
];
const LAST = STEPS.length - 1;

const REVIEW: { step: number; title: string; rows: [string, string][] }[] = [
  {
    step: 0,
    title: "Personal Details",
    rows: [["Name", "name"], ["Father's Name", "fatherName"], ["Date of Birth", "dob"], ["Mobile", "contact"], ["Email", "email"], ["Pin Code", "pinCode"], ["Address", "address"]],
  },
  {
    step: 1,
    title: "Service Details",
    rows: [["Organisation", "company"], ["Designation", "designation"], ["Employee ID", "employeeId"], ["Joined Service", "dojCompany"], ["Joined As", "dojCompanyAs"], ["Current Post Since", "dojCurrentPost"], ["Current Post", "dojCurrentPostAs"], ["Qualification", "qualification"], ["Discipline", "discipline"]],
  },
  {
    step: 2,
    title: "Posting Details",
    rows: [["Zone", "zone"], ["Circle", "circle"], ["Division", "division"], ["Sub Division", "subDivision"], ["Office Address", "officeAddress"]],
  },
];

/** Resize to max 800px and re-encode as JPEG, so any phone photo fits the 500 KB limit and the PDF card. */
async function toJpeg(f: File): Promise<File> {
  const bmp = await createImageBitmap(f); // honours EXIF rotation
  const scale = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // transparent PNGs get a white background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new Error("encode failed");
  return new File([blob], f.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

const today = () => new Date().toISOString().slice(0, 10);
const showDate = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v.split("-").reverse().join("-") : v);

function photoError(f?: File | null) {
  if (!f) return "Please add your passport-size photo";
  if (!PHOTO_TYPES.includes(f.type)) return "Use a JPG or PNG image";
  if (f.size > MAX_PHOTO) return "Photo must be under 500 KB";
  return null;
}

function messageFor(el: Control) {
  if (el instanceof HTMLInputElement && el.type === "file") return photoError(el.files?.[0]);
  const v = el.validity;
  if (v.valueMissing) {
    if (el.type === "radio") return "Please choose one";
    if (el.type === "checkbox") return "Please accept the declaration";
    return "This field is required";
  }
  if (v.typeMismatch) return "Enter a valid email address";
  if (v.patternMismatch) return el.dataset.msg ?? "Check the format";
  if (el.type === "date" && el.value > today()) return "Date cannot be in the future";
  return null;
}

export function RegisterForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<{ url: string; name: string; size: number }>();
  const [done, setDone] = useState<{ ref?: string }>();
  const [pending, startTransition] = useTransition();

  const panel = (i: number) => formRef.current?.querySelector<HTMLElement>(`[data-step="${i}"]`);

  function checkStep(i: number) {
    const errs: Errors = {};
    panel(i)?.querySelectorAll<Control>("input,select,textarea").forEach((el) => {
      const name = el.name as Name;
      if (!name || errs[name]) return;
      const msg = messageFor(el);
      if (msg) errs[name] = [msg];
    });
    return errs;
  }

  function goTo(i: number) {
    if (i === LAST && formRef.current) {
      const data = new FormData(formRef.current);
      setSummary(Object.fromEntries([...data].filter(([, v]) => typeof v === "string")) as Record<string, string>);
    }
    setStep(i);
    setMaxStep((m) => Math.max(m, i));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function next() {
    const errs = checkStep(step);
    setErrors((prev) => {
      const kept = { ...prev };
      STEPS[step].fields.forEach((f) => delete kept[f]);
      return { ...kept, ...errs };
    });
    const first = Object.keys(errs)[0];
    if (first) {
      panel(step)?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setMessage("");
    goTo(step + 1);
  }

  function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (step < LAST) return next();
    const errs = checkStep(LAST);
    if (Object.keys(errs).length) return setErrors(errs);

    const data = new FormData(ev.currentTarget);
    startTransition(async () => {
      try {
        const res = await register({}, data);
        if (res.ok) return setDone({ ref: res.ref });
        setErrors(res.errors ?? {});
        setMessage(res.message ?? "Please check the highlighted fields.");
        const bad = STEPS.findIndex((s) => s.fields.some((f) => res.errors?.[f]));
        if (bad >= 0) setStep(bad);
      } catch {
        setMessage("Could not submit right now. Please try again in a moment.");
      }
    });
  }

  function clearError(ev: React.FormEvent<HTMLFormElement>) {
    const name = (ev.target as Control).name as Name;
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  }

  async function pickPhoto(picked?: File) {
    const input = photoRef.current!;
    if (!picked) return setPhoto(undefined);
    let f: File | undefined;
    try {
      f = await toJpeg(picked);
      const dt = new DataTransfer();
      dt.items.add(f);
      input.files = dt.files; // the converted JPEG is what gets submitted
    } catch {
      f = undefined;
    }
    const err = f ? photoError(f) : "Could not read this image. Please choose a JPG or PNG photo.";
    setPhoto(f && !err ? { url: URL.createObjectURL(f), name: picked.name, size: f.size } : undefined);
    if (err) {
      setErrors((prev) => ({ ...prev, photo: [err] }));
      input.value = "";
    }
  }

  if (done) return <Success refNo={done.ref} />;

  const current = STEPS[step];
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
      {/* Stepper */}
      <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block">
        <ol className="card p-3">
          {STEPS.map((s, i) => {
            const isCurrent = i === step;
            const isDone = !isCurrent && i < maxStep;
            return (
              <li key={s.short} className="relative">
                {i < LAST && <span className="absolute top-[3.25rem] left-[1.94rem] h-4 w-px bg-line" aria-hidden />}
                <button
                  type="button"
                  disabled={i > maxStep}
                  onClick={() => goTo(i)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition disabled:cursor-not-allowed ${
                    isCurrent ? "bg-accent-soft" : "enabled:hover:bg-ink/[0.04]"
                  }`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full border transition ${
                      isDone ? "border-accent bg-accent text-on-accent" : isCurrent ? "border-accent text-accent" : "border-line text-muted"
                    }`}
                  >
                    {isDone ? <Check size={16} weight="bold" /> : <s.icon size={17} weight={isCurrent ? "fill" : "regular"} />}
                  </span>
                  <span>
                    <span className="block text-xs text-muted">Step {i + 1}</span>
                    <span className={`block text-sm font-semibold ${i > maxStep ? "text-muted" : ""}`}>{s.short}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="card flex gap-3 p-4 text-sm">
          <Info size={20} weight="fill" className="mt-0.5 shrink-0 text-accent" />
          <p className="text-muted">
            Your details are only seen by the Operation Team. Need help? Visit the head office at Tripuri Town, Patiala.
          </p>
        </div>
      </aside>

      {/* Form card */}
      <form ref={formRef} noValidate onSubmit={submit} onChange={clearError} className="card scroll-mt-24 overflow-hidden">
        <header className="border-b border-line p-6 sm:p-8">
          <div className="flex items-center justify-between text-xs font-medium text-muted">
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
            <span>{pct}% complete</span>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-6 flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <current.icon size={24} weight="duotone" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{current.title}</h2>
              <p className="mt-1 text-sm text-muted">{current.desc}</p>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-8">
          {/* 1. Personal */}
          <StepPanel index={0} step={step}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full Name" name="name" icon={User} e={errors} autoComplete="name" placeholder="As in service records" />
              <Field label="Father's Name" name="fatherName" icon={User} e={errors} />
              <Field label="Date of Birth" name="dob" type="date" e={errors} />
              <Field
                label="Mobile Number"
                name="contact"
                icon={Phone}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[6-9][0-9]{9}"
                data-msg="Enter a 10-digit mobile number"
                autoComplete="tel-national"
                placeholder="98XXXXXXXX"
                e={errors}
              />
              <Field label="Email Address" name="email" icon={EnvelopeSimple} type="email" autoComplete="email" placeholder="you@example.com" e={errors} className="sm:col-span-2" />
              <Field label="Residential Address" name="address" icon={House} textarea e={errors} className="sm:col-span-2" />
              <Field
                label="Pin Code"
                name="pinCode"
                icon={MapPin}
                inputMode="numeric"
                maxLength={6}
                pattern="[1-9][0-9]{5}"
                data-msg="Enter a 6-digit PIN code"
                autoComplete="postal-code"
                e={errors}
              />
            </div>
          </StepPanel>

          {/* 2. Service */}
          <StepPanel index={1} step={step}>
            <div className="space-y-7">
              <Choice
                label="Organisation"
                name="company"
                e={errors}
                className="sm:grid-cols-2"
                options={[
                  { value: "PSPCL", label: "PSPCL", sub: "Punjab State Power Corporation Ltd.", icon: Lightning },
                  { value: "PSTCL", label: "PSTCL", sub: "Punjab State Transmission Corporation Ltd.", icon: Buildings },
                ]}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Designation" name="designation" icon={Briefcase} list="designations" hint="For example JE (Electrical)" e={errors} />
                <Field label="Employee ID No." name="employeeId" icon={IdentificationCard} hint="As on your department ID card" e={errors} />
                <Field label="Date of Joining PSPCL/PSTCL" name="dojCompany" type="date" e={errors} />
                <Field label="Joined As" name="dojCompanyAs" list="designations" placeholder="Post at joining" e={errors} />
                <Field label="Date of Joining Current Post" name="dojCurrentPost" type="date" e={errors} />
                <Field label="Current Post" name="dojCurrentPostAs" list="designations" placeholder="Present post" e={errors} />
              </div>
              <Choice
                label="Technical Qualification"
                name="qualification"
                e={errors}
                chips
                options={["ITI", "Diploma", "BE", "B.Tech", "M.Tech"].map((q) => ({ value: q, label: q }))}
              />
              <Choice
                label="Discipline"
                name="discipline"
                e={errors}
                className="sm:grid-cols-3"
                options={[
                  { value: "Civil", label: "Civil", icon: HardHat },
                  { value: "Electrical", label: "Electrical", icon: Lightning },
                  { value: "Mechanical", label: "Mechanical", icon: GearSix },
                ]}
              />
            </div>
            <datalist id="designations">
              {["JE (Electrical)", "JE (Civil)", "JE (Mechanical)", "AAE"].map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </StepPanel>

          {/* 3. Posting */}
          <StepPanel index={2} step={step}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nearby or Posting Zone" name="zone" icon={MapPin} list="zones" hint="Pick from the list or type" e={errors} />
              <Field label="Nearby or Posting Circle" name="circle" icon={MapPin} e={errors} />
              <Field label="Division / Office" name="division" icon={Buildings} e={errors} />
              <Field label="Sub Division / Office" name="subDivision" icon={Buildings} e={errors} />
              <Field label="Office Address" name="officeAddress" icon={House} textarea e={errors} className="sm:col-span-2" />
            </div>
            <datalist id="zones">
              {["North (Jalandhar)", "South (Patiala)", "West (Bathinda)", "Central (Ludhiana)", "Border (Amritsar)"].map((z) => (
                <option key={z} value={z} />
              ))}
            </datalist>
          </StepPanel>

          {/* 4. Photo */}
          <StepPanel index={3} step={step}>
            <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
              <div className="mx-auto w-full max-w-[220px]">
                <div
                  className={`relative grid aspect-[3/4] place-items-center overflow-hidden rounded-2xl border-2 border-dashed bg-ink/[0.02] transition ${
                    errors.photo ? "border-danger" : photo ? "border-accent/50" : "border-line hover:border-accent/60"
                  }`}
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                    <img src={photo.url} alt="Your selected photo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="px-4 text-center">
                      <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
                        <UploadSimple size={22} weight="bold" />
                      </span>
                      <p className="mt-3 text-sm font-semibold">Upload photo</p>
                      <p className="mt-1 text-xs text-muted">Click or drag and drop</p>
                    </div>
                  )}
                  <input
                    ref={photoRef}
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/*"
                    required
                    aria-label="Passport-size photo"
                    aria-invalid={!!errors.photo}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(ev) => pickPhoto(ev.target.files?.[0])}
                  />
                </div>
                {photo && (
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-muted">
                      {photo.name} · {Math.round(photo.size / 1024)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (photoRef.current) photoRef.current.value = "";
                        setPhoto(undefined);
                      }}
                      className="flex shrink-0 items-center gap-1 font-semibold text-danger"
                    >
                      <Trash size={14} /> Remove
                    </button>
                  </div>
                )}
                <FieldError msg={errors.photo} />
              </div>
              <div className="rounded-2xl border border-line bg-ink/[0.02] p-5">
                <p className="font-semibold">Photo guidelines</p>
                <ul className="mt-4 space-y-3 text-sm text-ink/80">
                  {["Recent passport-size colour photo", "Plain, light background", "Face clearly visible, looking at the camera", "Any photo from your phone or computer; we resize it for you"].map((t) => (
                    <li key={t} className="flex gap-2.5">
                      <CheckCircle size={18} weight="fill" className="shrink-0 text-accent" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </StepPanel>

          {/* 5. Review */}
          <StepPanel index={4} step={step}>
            <div className="space-y-4">
              {REVIEW.map((g) => (
                <section key={g.title} className="rounded-2xl border border-line bg-ink/[0.02] p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{g.title}</h3>
                    <button type="button" onClick={() => goTo(g.step)} className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                      <PencilSimple size={14} weight="bold" /> Edit
                    </button>
                  </div>
                  <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {g.rows.map(([label, key]) => (
                      <div key={key} className={key.toLowerCase().includes("address") ? "sm:col-span-2" : ""}>
                        <dt className="text-xs text-muted">{label}</dt>
                        <dd className="mt-0.5 text-sm font-medium break-words">{showDate(summary[key] ?? "") || "-"}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              <section className="flex items-center gap-4 rounded-2xl border border-line bg-ink/[0.02] p-5">
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                  <img src={photo.url} alt="Your selected photo" className="h-20 w-16 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">Passport Photo</h3>
                  <p className="truncate text-sm text-muted">{photo?.name ?? "No photo selected"}</p>
                </div>
                <button type="button" onClick={() => goTo(3)} className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                  <PencilSimple size={14} weight="bold" /> Edit
                </button>
              </section>

              <label
                className={`flex cursor-pointer gap-4 rounded-2xl border p-5 text-sm leading-relaxed transition has-checked:border-accent/60 has-checked:bg-accent-soft ${
                  errors.declarationAccepted ? "border-danger" : "border-line"
                }`}
              >
                <input type="checkbox" name="declarationAccepted" required className="peer sr-only" />
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-line text-transparent transition peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:ring-4 peer-focus-visible:ring-accent/20">
                  <Check size={13} weight="bold" />
                </span>
                <span className="text-ink/85">
                  I, <strong className="text-ink">{summary.name || "the applicant"}</strong>, solemnly affirm that I want to be a member
                  of the “Association of Junior Engineers”. I shall abide by the rules of its constitution and perform the duties
                  assigned to me. I subscribe to the membership (as decided by the general house, including special contribution, if
                  any) and authorize the Association and PSPCL/PSTCL to deduct it from my salary. If I fail to pay for six consecutive
                  months, my membership may be ceased without notice.
                </span>
              </label>
              <FieldError msg={errors.declarationAccepted} />
            </div>
          </StepPanel>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-line p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          {step > 0 ? (
            <button type="button" onClick={() => goTo(step - 1)} className="btn-outline px-5 py-3">
              <ArrowLeft size={16} weight="bold" /> Back
            </button>
          ) : (
            <Link href="/" className="btn-outline px-5 py-3">
              Cancel
            </Link>
          )}
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {message && (
              <p className="flex items-center gap-1.5 text-sm text-danger" aria-live="polite">
                <WarningCircle size={16} weight="fill" className="shrink-0" /> {message}
              </p>
            )}
            <button type="submit" disabled={pending} className="btn-accent px-6 py-3">
              {step < LAST ? (
                <>
                  Continue <ArrowRight size={16} weight="bold" />
                </>
              ) : pending ? (
                "Submitting…"
              ) : (
                <>
                  Submit Application <Check size={16} weight="bold" />
                </>
              )}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

function StepPanel({ index, step, children }: { index: number; step: number; children: React.ReactNode }) {
  // Every step stays mounted (hidden) so all inputs are part of the final FormData.
  return (
    <div data-step={index} hidden={index !== step}
      className={index === step ? "step-in" : undefined}
    >
      {children}
    </div>
  );
}

function FieldError({ msg }: { msg?: string[] }) {
  return msg ? (
    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-danger">
      <WarningCircle size={15} weight="fill" className="shrink-0" /> {msg[0]}
    </p>
  ) : null;
}

type FieldProps = {
  label: string;
  name: Name;
  e: Errors;
  icon?: Icon;
  hint?: string;
  textarea?: boolean;
  className?: string;
  "data-msg"?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "className">;

function Field({ label, name, e, icon: Icon, hint, textarea, className, ...rest }: FieldProps) {
  const pad = Icon ? "pl-10!" : "";
  const common = { id: name, name, required: true, "aria-invalid": !!e[name] };
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon size={18} className="pointer-events-none absolute top-3 left-3.5 text-muted" />}
        {textarea ? (
          <textarea rows={3} {...common} className={`field resize-none ${pad}`} />
        ) : (
          <input type="text" {...rest} {...common} className={`field ${pad}`} />
        )}
      </div>
      {e[name] ? <FieldError msg={e[name]} /> : hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function Choice({
  label,
  name,
  e,
  options,
  chips,
  className = "",
}: {
  label: string;
  name: Name;
  e: Errors;
  options: { value: string; label: string; sub?: string; icon?: Icon }[];
  chips?: boolean;
  className?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className={chips ? "flex flex-wrap gap-2" : `grid gap-3 ${className}`}>
        {options.map((o) => (
          <label
            key={o.value}
            className={`group flex cursor-pointer items-center border transition has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:ring-4 has-focus-visible:ring-accent/20 ${
              e[name] ? "border-danger/60" : "border-line hover:border-ink/25"
            } ${chips ? "rounded-full px-4 py-2 text-sm font-semibold" : "gap-3 rounded-xl p-4"}`}
          >
            <input type="radio" name={name} value={o.value} required className="sr-only" />
            {o.icon && (
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-ink/[0.05] text-muted transition group-has-checked:bg-accent group-has-checked:text-on-accent">
                <o.icon size={20} weight="duotone" />
              </span>
            )}
            {chips ? (
              <>
                <Check size={14} weight="bold" className="mr-1.5 -ml-1 hidden text-accent group-has-checked:block" />
                {o.label}
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{o.label}</span>
                  {o.sub && <span className="block text-xs text-muted">{o.sub}</span>}
                </span>
                <span className="grid size-5 shrink-0 place-items-center rounded-full border border-line text-transparent transition group-has-checked:border-accent group-has-checked:bg-accent group-has-checked:text-on-accent">
                  <Check size={12} weight="bold" />
                </span>
              </>
            )}
          </label>
        ))}
      </div>
      <FieldError msg={e[name]} />
    </fieldset>
  );
}

function Success({ refNo }: { refNo?: string }) {
  return (
    <div className="card mx-auto max-w-xl p-10 text-center">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-accent-soft text-accent">
        <CheckCircle size={44} weight="fill" />
      </span>
      <h2 className="mt-6 text-3xl font-semibold tracking-tight">Application Submitted</h2>
      {refNo && (
        <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-lg bg-ink/[0.05] px-4 py-2 text-sm">
          Reference <span className="font-mono font-semibold text-accent">{refNo}</span>
        </p>
      )}
      <p className="mx-auto mt-3 max-w-md text-muted">
        Thank you. We have sent a confirmation to your email and mobile. Once the Operation Team approves your application,
        your membership number, login ID and password will be sent the same way.
      </p>
      <Link href="/" className="btn-accent mt-8 px-6 py-3">
        Back to Home
      </Link>
    </div>
  );
}
