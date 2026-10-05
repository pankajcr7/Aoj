"use client";

import {
  Article,
  Briefcase,
  Buildings,
  Camera,
  CaretDown,
  Check,
  CheckCircle,
  ClipboardText,
  IdentificationCard,
  Leaf,
  MapPin,
  PenNib,
  User,
  UserCircle,
  UsersThree,
  WarningCircle,
  type Icon,
} from "@phosphor-icons/react";
import { Archivo, Kaushan_Script } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useTransition } from "react";
import { DESIGNATIONS, DISCIPLINES, HEADQUARTERS, MEMBERSHIP_TYPES, QUALIFICATIONS, ZONES } from "@/lib/form-options";
import { updateApplication } from "@/app/dashboard/actions";
import { register, type FormErrors } from "./actions";

const script = Kaushan_Script({ weight: "400", subsets: ["latin"] });
// The form keeps its original paper-form look (and font), independent of the site theme.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"] });

type Errors = FormErrors;
type Name = keyof Errors;
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Preview = { url: string; name: string };

/** A saved application, shown read-only to the admin / operation team. */
export type SavedApplication = {
  id: string;
  status: "pending" | "approved" | "rejected" | "suspended" | "terminated";
  hasSignature: boolean;
  values: Record<string, string | null>; // column -> value, dates as YYYY-MM-DD
  audit: [when: string, what: string, by: string][];
  masterId: string; // login of the staff member viewing
  canEdit: boolean; // Master ID (admin) may correct the details
};

// Non-null when showing a saved application: fields start with its values, read-only unless the Master ID is editing.
const Saved = createContext<{ values: Record<string, string | null>; locked: boolean } | null>(null);

const MAX_PHOTO = 500 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png"];
const NAVY = "#0b2c6e";

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

function imageError(f?: File | null, required = true) {
  if (!f) return required ? "Please add your passport-size photo" : null;
  if (!PHOTO_TYPES.includes(f.type)) return "Use a JPG or PNG image";
  if (f.size > MAX_PHOTO) return "Image must be under 500 KB";
  return null;
}

function messageFor(el: Control) {
  if (el instanceof HTMLInputElement && el.type === "file") return imageError(el.files?.[0], el.required);
  const v = el.validity;
  if (v.valueMissing) {
    if (el.type === "radio") return "Please choose one";
    if (el.type === "checkbox") return "Please accept the declaration";
    return el instanceof HTMLSelectElement ? "Please select one" : "This field is required";
  }
  if (v.typeMismatch) return "Enter a valid email address";
  if (v.patternMismatch) return el.dataset.msg ?? "Check the format";
  if (el.type === "date" && el.value > today()) return "Date cannot be in the future";
  return null;
}

const INP =
  "h-[30px] w-full rounded-[3px] border border-[#bccbdf] bg-white px-2.5 text-[14px] text-[#16233b] outline-none transition placeholder:text-[#7b8798] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 aria-invalid:border-[#e11d48] aria-invalid:ring-2 aria-invalid:ring-[#e11d48]/15 disabled:cursor-not-allowed disabled:bg-[#fafbfd]";
const AREA = INP.replace("h-[30px]", "resize-none py-1.5 leading-snug");
const GREEN_BTN =
  "rounded-md bg-[#2f9a46] px-3 py-1.5 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60";

// Section 5 signatories (images in /public). Update here when office-bearers change.
const AUTHORITIES = [
  { title: "General Secretary", name: "Er. Harmandeep AAE", sign: "/General-Secretary-Sign.png" },
  { title: "State President", name: "Er. Ranjit Singh Dhillon JE", sign: "/President-Sign.png" },
];

/** Applicants get only the fields they fill in; staff (`saved`) get the full sheet including office sections 4-6. */
export function MembershipForm({ saved, office }: { saved?: SavedApplication; office?: React.ReactNode }) {
  const v = saved?.values ?? null;
  const ro = !!saved;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const locked = ro && !editing;
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [name, setName] = useState(v?.name ?? "");
  const [posting, setPosting] = useState(v?.posting ?? "");
  const [hq, setHq] = useState(v?.headquarters ?? "");
  const savedPhoto = saved && { url: `/api/photo/${saved.id}`, name: "" };
  const savedSignature = saved?.hasSignature ? { url: `/api/photo/${saved.id}?signature`, name: "" } : undefined;
  const [photo, setPhoto] = useState<Preview | undefined>(savedPhoto);
  const [signature, setSignature] = useState<Preview | undefined>(savedSignature);
  const [done, setDone] = useState<{ ref?: string }>();
  const [pending, startTransition] = useTransition();

  function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const errs: Errors = {};
    form.querySelectorAll<Control>("[name]:not(:disabled)").forEach((el) => {
      const n = el.name as Name;
      const msg = errs[n] ? null : messageFor(el);
      if (msg) errs[n] = [msg];
    });
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      setMessage("Please fix the highlighted fields.");
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const data = new FormData(form);
    setMessage("");
    startTransition(async () => {
      try {
        if (saved) {
          const res = await updateApplication(saved.id, data);
          if (res.ok) {
            router.refresh();
            setEditing(false);
            return;
          }
          setErrors(res.errors ?? {});
          setMessage(res.message ?? "Please check the highlighted fields.");
          return;
        }
        const res = await register({}, data);
        if (res.ok) return setDone({ ref: res.ref });
        setErrors(res.errors ?? {});
        setMessage(res.message ?? "Please check the highlighted fields.");
      } catch {
        setMessage("Could not submit right now. Please try again in a moment.");
      }
    });
  }

  function cancelEdit() {
    setEditing(false);
    setErrors({});
    setMessage("");
    setName(v?.name ?? "");
    setPosting(v?.posting ?? "");
    setHq(v?.headquarters ?? "");
    setPhoto(savedPhoto);
    setSignature(savedSignature);
  }

  function clearError(ev: React.FormEvent<HTMLFormElement>) {
    const n = (ev.target as Control).name as Name;
    if (errors[n]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[n];
        return copy;
      });
    }
  }

  async function pickImage(input: HTMLInputElement, set: (p?: Preview) => void) {
    const picked = input.files?.[0];
    if (!picked) return set(undefined);
    let f: File | undefined;
    try {
      f = await toJpeg(picked);
      const dt = new DataTransfer();
      dt.items.add(f);
      input.files = dt.files; // the converted JPEG is what gets submitted
    } catch {
      f = undefined;
    }
    const err = f ? imageError(f) : "Could not read this image. Please choose a JPG or PNG.";
    set(f && !err ? { url: URL.createObjectURL(f), name: picked.name } : undefined);
    if (err) {
      setErrors((prev) => ({ ...prev, [input.name]: [err] }));
      input.value = "";
    }
  }

  if (done) return <Success refNo={done.ref} />;

  const e = errors;

  const sheet = `${archivo.className} mx-auto w-full max-w-[1240px] overflow-hidden rounded-xl bg-[#f4f8fd] text-[#16233b] shadow-[0_20px_60px_-30px_rgb(11_44_110/0.45)] ring-1 ring-[#0b2c6e]/10`;

  const body = (
    <>
      <Banner />

      <div className="space-y-3.5 px-3 pt-3 pb-4 sm:px-5">
        {/* Title row */}
        <div className={`grid grid-cols-1 gap-3.5 ${ro ? "md:grid-cols-[1fr_350px]" : ""}`}>
          <div className="flex min-h-[52px] items-center gap-4 rounded-md bg-linear-to-r from-[#0a2a66] to-[#1c4c9e] px-5 text-white shadow-sm">
            <User size={34} weight="fill" />
            <h2 className="text-[20px] font-bold tracking-tight uppercase sm:text-[27px]">Membership Application Form</h2>
          </div>
          {ro && (
            <div className="flex min-h-[52px] items-center justify-between gap-3 rounded-md border border-[#c6d9f1] bg-[#e9f2fd] px-4">
              <span className="text-[17px] font-semibold" style={{ color: NAVY }}>
                Membership No.
              </span>
              <MembershipNo value={v?.membershipNo} className="text-[24px]" />
            </div>
          )}
        </div>

        {editing && (
          <p className="rounded-md border border-[#f6c98b] bg-[#fff8ef] px-4 py-2.5 text-[14px] text-[#5a3b0b]">
            <strong>Editing as Master ID.</strong> Correct any field, then press <strong>Save changes</strong> in section 6. Every change
            is recorded in the audit trail.
          </p>
        )}

        {/* Personal | photo | posting summary */}
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_222px_338px]">
          <Panel>
            <Head n={1} title="Personal Details" icon={User} />
            <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 p-4 sm:grid-cols-[160px_1fr] sm:items-center">
              <Row label="Full Name" req htmlFor="name" />
              <Text name="name" e={e} autoComplete="name" placeholder="As in service records" onChange={(ev) => setName(ev.target.value)} />
              <Row label="Father's Name" req htmlFor="fatherName" />
              <Text name="fatherName" e={e} />
              <Row label="Mobile Number" req htmlFor="contact" />
              <Text
                name="contact"
                e={e}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[6-9][0-9]{9}"
                data-msg="Enter a 10-digit mobile number"
                autoComplete="tel-national"
                placeholder="98XXXXXXXX"
              />
              <Row label="Email Address" req htmlFor="email" />
              <Text name="email" e={e} type="email" autoComplete="email" placeholder="you@example.com" />
              <Row label="Date of Birth" req htmlFor="dob" />
              <Text name="dob" e={e} type="date" max={today()} className="sm:max-w-[196px]" />
              <Row label="Residential Address" req htmlFor="address" className="self-start pt-1.5" />
              <Text name="address" e={e} textarea rows={2} className="h-[56px]" />
              <Row label="Pin Code" req htmlFor="pinCode" />
              <Text
                name="pinCode"
                e={e}
                inputMode="numeric"
                maxLength={6}
                pattern="[1-9][0-9]{5}"
                data-msg="Enter a 6-digit PIN code"
                autoComplete="postal-code"
                className="sm:max-w-[196px]"
              />
            </div>
          </Panel>

          <Panel className="flex flex-col p-2.5">
            <label
              className={`relative mx-auto block h-[156px] w-[136px] cursor-pointer overflow-hidden rounded-md border-2 bg-[#eef3fa] transition ${
                e.photo ? "border-[#e11d48]" : "border-[#1e3a6e] hover:border-[#2563eb]"
              }`}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={photo.url} alt="Passport photo" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full place-items-center px-2 text-center text-[12px] text-[#4a5a72]">
                  <span>
                    <Camera size={30} className="mx-auto mb-1.5 text-[#1e3a6e]" />
                    Upload passport photo <span className="text-[#e11d48]">*</span>
                  </span>
                </span>
              )}
              {!locked && <input
                name="photo"
                type="file"
                accept="image/*"
                required={!ro}
                aria-label="Passport-size photo"
                aria-invalid={!!e.photo}
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(ev) => pickImage(ev.target, setPhoto)}
              />}
            </label>
            <FieldError msg={e.photo} center />
            <p className="mt-2 truncate rounded-md px-2 py-1.5 text-center text-[19px] font-bold text-white uppercase" style={{ background: NAVY }}>
              {name.trim() || "Your Name"}
            </p>
            <label
              className={`relative mt-2 grid h-[82px] cursor-pointer place-items-center overflow-hidden rounded-md border bg-white transition ${
                e.signature ? "border-[#e11d48]" : "border-[#c6d9f1] hover:border-[#2563eb]"
              }`}
            >
              {signature ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={signature.url} alt="Your signature" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="flex items-center gap-1.5 text-[12px] text-[#4a5a72]">
                  <PenNib size={18} className="text-[#1e3a6e]" /> {locked ? "No signature uploaded" : "Upload signature"}
                </span>
              )}
              {!locked && <input
                name="signature"
                type="file"
                accept="image/*"
                aria-label="Member signature"
                aria-invalid={!!e.signature}
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(ev) => pickImage(ev.target, setSignature)}
              />}
            </label>
            <FieldError msg={e.signature} center />
            <p className="mt-1.5 text-center text-[13px] leading-tight text-[#26344d]">
              <span className="font-semibold">Member Signature</span>
              <br />
              (Uploaded at the time of signup)
            </p>
          </Panel>

          <Panel className="divide-y divide-[#cfdcee] bg-[#eef5fe] px-4 py-2">
            <Info icon={MapPin} title="Posting / Office">
              <p className={`min-h-[44px] text-[15px] leading-snug break-words ${posting ? "" : "text-[#7b8798]"}`}>
                {posting || "For Ex: Patiala Circle under South Zone, PSPCL, Patiala"}
              </p>
            </Info>
            <Info icon={Buildings} title="Headquarters">
              <input
                list="headquarters-list"
                aria-label="Headquarters"
                value={hq}
                readOnly={locked}
                onChange={(ev) => setHq(ev.target.value)}
                placeholder="Select or type headquarters"
                aria-invalid={!!e.headquarters}
                className={INP}
              />
            </Info>
            <Info icon={Briefcase} title="Designation" req>
              <Select name="designation" e={e} defaultValue="">
                <option value="" disabled>
                  Select Designation
                </option>
                {DESIGNATIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </Info>
            <Info icon={UsersThree} title="Organisation">
              <Select name="company" e={e} defaultValue="PSPCL">
                <option>PSPCL</option>
                <option>PSTCL</option>
              </Select>
            </Info>
          </Panel>
        </div>

        {/* Professional + membership | approval */}
        <div className={`grid grid-cols-1 gap-3.5 ${ro ? "lg:grid-cols-[1fr_475px]" : ""}`}>
          <div className="space-y-3.5">
            <Panel>
              <Head n={2} title="Professional Details" icon={Article} />
              <div className="grid grid-cols-1 gap-x-8 gap-y-3 p-4 md:grid-cols-2 md:divide-x md:divide-[#dbe5f2]">
                <div className="space-y-3 md:pr-2">
                  <Stack label="Employee ID No." req name="employeeId">
                    <Text name="employeeId" e={e} placeholder="As on your department ID card" />
                  </Stack>
                  <Stack label="Nearby or Posting Zone" req name="zone">
                    <Text name="zone" e={e} list="zones" placeholder="Pick from the list or type" />
                  </Stack>
                  <Stack label="Nearby or Posting Circle" req name="circle">
                    <Text name="circle" e={e} />
                  </Stack>
                  <Stack label="Division / Office" req name="division">
                    <Text name="division" e={e} />
                  </Stack>
                  <Stack label="Sub Division / Office" req name="subDivision">
                    <Text name="subDivision" e={e} />
                  </Stack>
                </div>
                <div className="space-y-3 md:pl-6">
                  <Stack label="Contact No. (Office)" name="officeContact">
                    <Text name="officeContact" e={e} type="tel" required={false} />
                  </Stack>
                  <Stack label="Email (Official)" name="officialEmail">
                    <Text name="officialEmail" e={e} type="email" required={false} />
                  </Stack>
                  <Stack label="Headquarters" req name="headquarters">
                    <Text
                      name="headquarters"
                      e={e}
                      list="headquarters-list"
                      value={hq}
                      onChange={(ev) => setHq(ev.target.value)}
                      placeholder="Select or type headquarters / office"
                    />
                  </Stack>
                  <Stack label="Posting / Office" req name="posting">
                    <Text
                      name="posting"
                      e={e}
                      textarea
                      rows={2}
                      className="h-[46px]"
                      placeholder="For Ex: Patiala Circle under South Zone, PSPCL, Patiala"
                      onChange={(ev) => setPosting(ev.target.value)}
                    />
                  </Stack>
                  <Stack label="Office Address" req name="officeAddress">
                    <Text name="officeAddress" e={e} textarea rows={2} className="h-[46px]" />
                  </Stack>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-3 border-t border-[#dbe5f2] p-4 md:grid-cols-2">
                <Stack label="Date of Joining PSPCL/PSTCL" req name="dojCompany">
                  <Text name="dojCompany" e={e} type="date" max={today()} />
                </Stack>
                <Stack label="Joined As" req name="dojCompanyAs">
                  <Text name="dojCompanyAs" e={e} list="designations" placeholder="Post at joining" />
                </Stack>
                <Stack label="Date of Joining Current Post" req name="dojCurrentPost">
                  <Text name="dojCurrentPost" e={e} type="date" max={today()} />
                </Stack>
                <Stack label="Current Post" req name="dojCurrentPostAs">
                  <Text name="dojCurrentPostAs" e={e} list="designations" placeholder="Present post" />
                </Stack>
                <Stack label="Technical Qualification" req name="qualification">
                  <Choices name="qualification" e={e} options={QUALIFICATIONS} />
                </Stack>
                <Stack label="Discipline" req name="discipline">
                  <Choices name="discipline" e={e} options={DISCIPLINES} />
                </Stack>
              </div>
              <datalist id="headquarters-list">
                {HEADQUARTERS.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
              <datalist id="zones">
                {ZONES.map((z) => (
                  <option key={z} value={z} />
                ))}
              </datalist>
              <datalist id="designations">
                {DESIGNATIONS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </Panel>

            <Panel>
              <Head n={3} title="Membership Details" icon={IdentificationCard} />
              <div className={`grid grid-cols-1 gap-4 p-4 ${ro ? "md:grid-cols-[1fr_215px]" : "md:max-w-[620px]"}`}>
                <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-[140px_1fr] sm:items-center">
                  <Row label="Membership Type" htmlFor="membershipType" />
                  <Select name="membershipType" id="membershipType" e={e} defaultValue="" required={false}>
                    <option value="">Select Membership Type</option>
                    {MEMBERSHIP_TYPES.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </Select>
                  <Row label="Date of Application" htmlFor="appDate" />
                  <input id="appDate" type="date" value={v?.createdAt ?? today()} readOnly className={INP} />
                </div>
                {ro && (
                  <div className="grid place-items-center rounded-md border border-[#c6d9f1] bg-[#e9f2fd] px-3 py-2.5 text-center">
                    <div>
                      <p className="text-[14px] font-semibold" style={{ color: NAVY }}>
                        Membership No.
                      </p>
                      <MembershipNo value={v?.membershipNo} className="mt-1 text-[19px]" />
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {saved && (

          <Panel>
            <Head n={4} title="Approval / Remarks" icon={ClipboardText} note="For office use" />
            <div className="space-y-3 p-4 text-[14px]">
              <fieldset disabled>
                <legend className="mb-1.5 font-semibold" style={{ color: NAVY }}>
                  Application Status
                </legend>
                <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                  {["pending", "approved", "rejected", ...["suspended", "terminated"].filter((x) => x === saved.status)].map((st) => (
                    <Radio key={st} name="office-status" label={st[0].toUpperCase() + st.slice(1)} checked={saved.status === st} />
                  ))}
                </div>
              </fieldset>
              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[150px_1fr]">
                <p className="font-semibold" style={{ color: NAVY }}>
                  {saved.status === "rejected" ? "Rejected By" : "Approved By"}
                </p>
                <input readOnly aria-label="Reviewed by" value={v?.reviewer ?? ""} className={INP} />
                <p className="font-semibold" style={{ color: NAVY }}>
                  {saved.status === "rejected" ? "Rejection Date" : "Approval Date"}
                </p>
                <input readOnly type="date" aria-label="Review date" value={v?.reviewedAt ?? ""} className={INP} />
              </div>
              <div>
                <p className="mb-1.5 font-semibold" style={{ color: NAVY }}>
                  Comments / Remarks
                </p>
                <textarea readOnly aria-label="Remarks" value={v?.rejectionReason ?? ""} className={`${AREA} h-[60px]`} />
              </div>
              {office && !editing && <div className="border-t border-[#dbe5f2] pt-3">{office}</div>}
            </div>
          </Panel>
          )}
        </div>

        {saved && (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[470px_1fr]">
          <Panel tone="orange">
            <Head n={5} title="Approving Authority" icon={UserCircle} tone="orange" />
            <div className="grid grid-cols-2 gap-3 p-2.5">
              {AUTHORITIES.map((a) => (
                <div key={a.title} className="flex h-[150px] flex-col rounded-md border border-[#f3d3a6] bg-white/70 px-3 pt-2.5 pb-1.5 text-center">
                  <p className="text-[14px] leading-tight font-semibold">
                    {a.title}
                    <br />
                    AOJE Punjab
                  </p>
                  {/* Signed automatically once the application is approved. */}
                  {saved.status !== "pending" && saved.status !== "rejected" && (
                    // eslint-disable-next-line @next/next/no-img-element -- tiny static PNG, no optimisation needed
                    <img src={a.sign} alt={`Signature of ${a.name}`} className="mx-auto mt-auto h-11 max-w-full object-contain" />
                  )}
                  <div className="mx-2 mt-auto border-t border-[#8a97a8]" />
                  <p className="mt-1.5 text-[12.5px] leading-tight text-[#3b4658]">
                    <span className="block font-semibold text-[#16233b]">{a.name}</span>
                    {a.title}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel tone="green">
            <Head n={6} title="Admin / Master ID" small="(For Any Changes)" icon={Leaf} tone="green" />
            <div className="grid grid-cols-1 gap-3 p-2.5 text-[13px] md:grid-cols-[200px_1fr]">
              <div className="space-y-1.5">
                <span className="block">Master ID</span>
                <input readOnly aria-label="Master ID" value={saved.masterId} className={`${INP} h-[26px]`} />
                {v?.loginId && <p className="text-[11.5px] text-[#4a5a72]">Member login: {v.loginId}</p>}
                {saved.canEdit && !editing && (
                  <button type="button" onClick={() => setEditing(true)} className={`${GREEN_BTN} mt-1 w-full`}>
                    Correct Details
                  </button>
                )}
                {editing && (
                  <>
                    <label htmlFor="editRemarks" className="block pt-1">
                      Remarks
                    </label>
                    <textarea
                      id="editRemarks"
                      name="editRemarks"
                      placeholder="Reason for the change..."
                      className={`${AREA} h-[58px] text-[12.5px]`}
                    />
                    <div className="flex gap-2">
                      <button type="submit" disabled={pending} className={`${GREEN_BTN} flex-1`}>
                        {pending ? "Saving…" : "Save changes"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-md border border-[#bfe0c3] bg-white px-3 py-1.5 font-semibold text-[#1d5a2a]"
                      >
                        Cancel
                      </button>
                    </div>
                    {message && (
                      <p className="flex items-center gap-1 text-[12.5px] text-[#e11d48]" aria-live="polite">
                        <WarningCircle size={14} weight="fill" className="shrink-0" /> {message}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="rounded-md border border-[#bfe0c3] bg-white/70 p-1.5">
                <p className="mb-1 flex items-center gap-1 text-[12.5px] font-semibold text-[#1d5a2a]">
                  <Check size={12} weight="bold" /> Edit History / Audit Trail
                </p>
                <table className="w-full border-collapse text-[11.5px]">
                  <thead>
                    <tr className="bg-[#eef7ef]">
                      {["Date & Time", "Field Changed", "Changed By"].map((h) => (
                        <th key={h} className="border border-[#d4e6d6] px-1.5 py-1 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {saved.audit.map((row, i) => (
                      <tr key={i}>
                        {row.map((c, j) => (
                          <td key={j} className="border border-[#d4e6d6] px-1.5 py-1">
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        </div>
        )}

        {/* Declaration + submit */}
        <Panel className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
          <label className="flex flex-1 cursor-pointer gap-3 text-[13px] leading-relaxed text-[#26344d]">
            <input
              type="checkbox"
              name="declarationAccepted"
              required
              defaultChecked={ro}
              disabled={ro}
              aria-invalid={!!e.declarationAccepted}
              className="mt-0.5 size-4 shrink-0 accent-[#0b2c6e]"
            />
            <span>
              I, <strong>{name.trim() || "the applicant"}</strong>, solemnly affirm that I want to be a member of the
              “Association of Junior Engineers”. I shall abide by the rules of its constitution and perform the duties assigned to
              me. I subscribe to the membership (as decided by the general house, including special contribution, if any) and
              authorize the Association and PSPCL/PSTCL to deduct it from my salary. If I fail to pay for six consecutive months, my
              membership may be ceased without notice.
              <FieldError msg={e.declarationAccepted} />
            </span>
          </label>
          {!ro && <div className="flex shrink-0 flex-col items-stretch gap-2 md:items-end">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-linear-to-r from-[#0a2a66] to-[#1c4c9e] px-7 py-3 text-[15px] font-bold text-white uppercase shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Submitting…" : (
                <>
                  Submit Application <Check size={16} weight="bold" />
                </>
              )}
            </button>
            {message && (
              <p className="flex items-center gap-1.5 text-[13px] text-[#e11d48]" aria-live="polite">
                <WarningCircle size={15} weight="fill" className="shrink-0" /> {message}
              </p>
            )}
          </div>}
        </Panel>
      </div>

      {/* Footer band */}
      <div className="relative flex h-[42px] items-center gap-3 overflow-hidden px-5 text-white" style={{ background: NAVY }}>
        <UsersThree size={26} weight="fill" className="shrink-0" />
        <p className="truncate pr-40 text-[13px] font-semibold sm:text-[15px]">
          AOJ Punjab – Empowering Junior Engineers, Building a Better Future
        </p>
        <span className="absolute top-0 right-[110px] h-full w-[70px] -skew-x-[40deg] bg-[#2f6fd6]" aria-hidden />
        <span className="absolute top-0 right-[30px] h-full w-[70px] -skew-x-[40deg] bg-[#f5b316]" aria-hidden />
        <span className="absolute top-0 -right-[40px] h-full w-[60px] -skew-x-[40deg] bg-[#2f6fd6]" aria-hidden />
      </div>
    </>
  );

  // Read-only staff view is a plain div: the review controls in `office` carry their own forms. Always light, like the paper form.
  return (
    <Saved value={v && { values: v, locked }}>
      {locked ? (
        <div data-theme="light" className={sheet}>
          {body}
        </div>
      ) : (
        <form data-theme="light" noValidate onSubmit={submit} onChange={clearError} className={sheet}>
          {body}
        </form>
      )}
    </Saved>
  );
}

function Banner() {
  return (
    <header className="relative overflow-hidden bg-linear-to-b from-white to-[#eef4fc] pb-8">
      {/* navy diagonal panel with pylon, right side */}
      <div
        className="absolute inset-y-0 right-0 hidden w-[34%] bg-linear-to-r from-[#eef4fc] via-[#5b86c8] to-[#0b2c6e] md:block"
        style={{ clipPath: "polygon(28% 0, 100% 0, 100% 100%, 0 100%)" }}
        aria-hidden
      />
      <svg viewBox="0 0 120 200" className="absolute top-3 right-[200px] hidden h-[200px] text-[#13336f]/75 lg:block" aria-hidden>
        <g stroke="currentColor" strokeWidth="2.2" fill="none">
          <path d="M60 4 L36 196 M60 4 L84 196 M20 52 H100 M28 88 H92 M44 70 H76 M38 120 H82" />
          <path d="M60 4 L44 70 L76 70 Z M44 70 L82 120 M76 70 L38 120 M38 120 L84 196 M82 120 L36 196" />
          <path d="M20 52 l0 10 M100 52 l0 10 M28 88 l0 10 M92 88 l0 10" />
        </g>
      </svg>

      <div className="relative grid items-center gap-3 px-4 pt-4 md:grid-cols-[200px_1fr_200px] md:px-6">
        <Image
          src="/logo.jpeg"
          alt="Association of Junior Engineers Punjab logo"
          width={200}
          height={200}
          priority
          className="mx-auto size-[130px] rounded-full object-cover shadow-md ring-2 ring-white md:size-[196px]"
        />
        <div className="text-center" style={{ color: NAVY }}>
          <h1 className="text-[28px] leading-[0.98] font-extrabold uppercase [font-stretch:78%] sm:text-[40px] lg:text-[54px]">
            Association of
            <br />
            Junior Engineers Punjab
          </h1>
          <p className="mt-1 text-[20px] font-bold sm:text-[30px]">(PSPCL/PSTCL) Regd.</p>
          <p className={`${script.className} mt-1 text-[20px] sm:text-[30px]`}>Together for a Stronger Tomorrow</p>
        </div>
        <div className="hidden text-center text-white md:block">
          <p className="text-[26px] font-black tracking-wide [font-stretch:80%]">AOJE PUNJAB</p>
          <p className="mt-3 text-[22px] leading-[1.15] font-black tracking-[0.14em] [font-stretch:80%]">
            UNITY
            <br />
            SERVICE
            <br />
            PROGRESS
          </p>
        </div>
      </div>

      {/* swoosh */}
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-[44px] w-full" aria-hidden>
        <path d="M0 26 Q 650 70 1200 0 V60 H0Z" fill="#6f9be0" opacity="0.55" />
        <path d="M0 38 Q 700 72 1200 14 V60 H0Z" fill="#2f6fd6" />
        <path d="M500 60 Q 900 52 1200 26 V60Z" fill="#f5b316" />
        <path d="M0 50 Q 750 78 1200 38 V60 H0Z" fill="#f4f8fd" />
      </svg>
    </header>
  );
}

const TONES = {
  blue: { panel: "border-[#c6d9f1] bg-white", head: "from-[#cfe2fa] to-[#eef5fe] text-[#0b3a8a]", icon: "text-[#0b3a8a]" },
  orange: { panel: "border-[#f6c98b] bg-[#fff8ef]", head: "from-[#fde1bb] to-[#fff4e6] text-[#2b2116]", icon: "text-[#ef8a1a]" },
  green: { panel: "border-[#bfe0c3] bg-[#f3faf3]", head: "from-[#d5eed8] to-[#f1f9f1] text-[#1f2a21]", icon: "text-[#2f9a46]" },
};

function Panel({ tone = "blue", className = "", children }: { tone?: keyof typeof TONES; className?: string; children: React.ReactNode }) {
  return <section className={`overflow-hidden rounded-md border ${TONES[tone].panel} ${className}`}>{children}</section>;
}

function Head({ n, title, small, note, icon: I, tone = "blue" }: { n: number; title: string; small?: string; note?: string; icon: Icon; tone?: keyof typeof TONES }) {
  return (
    <div className={`flex min-h-[34px] items-center gap-3 bg-linear-to-r px-3 ${TONES[tone].head}`}>
      <I size={tone === "blue" ? 26 : 22} weight="fill" className={`shrink-0 ${TONES[tone].icon}`} />
      <h3 className={`font-bold tracking-tight uppercase ${tone === "blue" ? "text-[17px]" : "text-[14.5px]"}`}>
        {n}.&nbsp; {title} {small && <span className="text-[12.5px] font-medium normal-case">{small}</span>}
      </h3>
      {note && <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-[#4a5a72]">{note}</span>}
    </div>
  );
}

function Req() {
  return <span className="text-[#e11d48]"> *</span>;
}

function Row({ label, req, htmlFor, className = "" }: { label: string; req?: boolean; htmlFor: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={`text-[15px] text-[#1b2638] ${className}`}>
      {label}
      {req && <Req />}
    </label>
  );
}

function Stack({ label, req, name, children }: { label: string; req?: boolean; name: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-[14.5px] font-medium text-[#1b2638]">
        {label}
        {req && <Req />}
      </label>
      {children}
    </div>
  );
}

function Info({ icon: I, title, req, children }: { icon: Icon; title: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5">
      <I size={28} weight="fill" className="mt-0.5 shrink-0" style={{ color: NAVY }} />
      <div className="min-w-0 flex-1">
        <p className="mb-1.5 text-[16px] font-bold" style={{ color: NAVY }}>
          {title}
          {req && <Req />}
        </p>
        {children}
      </div>
    </div>
  );
}

type TextProps = {
  name: Name;
  e: Errors;
  textarea?: boolean;
  "data-msg"?: string;
  onChange?: (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "onChange">;

function Text({ name, e, textarea, className = "", required = true, ...rest }: TextProps) {
  const ctx = useContext(Saved);
  const common = {
    id: name,
    name,
    required,
    readOnly: !!ctx?.locked,
    defaultValue: rest.value === undefined ? (ctx?.values[name] ?? undefined) : undefined,
    "aria-invalid": !!e[name],
  };
  return (
    <div>
      {textarea ? (
        <textarea {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} {...common} className={`${AREA} ${className}`} />
      ) : (
        <input type="text" {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} {...common} className={`${INP} ${className}`} />
      )}
      <FieldError msg={e[name]} />
    </div>
  );
}

function Select({
  e,
  name,
  invalid,
  className = "",
  required = true,
  children,
  ...rest
}: { e?: Errors; name?: Name; invalid?: boolean } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  const ctx = useContext(Saved);
  const caret = <CaretDown size={13} weight="bold" className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[#16233b]" />;
  if (ctx?.locked) {
    // Saved values may predate the current option lists, so show them as text.
    const value = name ? ctx.values[name] : rest.value;
    return (
      <div className="relative">
        <input readOnly id={rest.id ?? name} aria-label={rest["aria-label"]} value={String(value ?? "")} className={`${INP} pr-8 ${className}`} />
        {caret}
      </div>
    );
  }
  return (
    <div className="relative">
      <select
        id={rest.id ?? name}
        name={name}
        required={!!name && required}
        aria-invalid={invalid || (!!name && !!e?.[name])}
        {...rest}
        {...(ctx && name && { defaultValue: ctx.values[name] ?? "" })}
        className={`${INP} appearance-none pr-8 ${className}`}
      >
        {children}
      </select>
      {caret}
      {name && <FieldError msg={e?.[name]} />}
    </div>
  );
}

function Choices({ name, e, options }: { name: Name; e: Errors; options: readonly string[] }) {
  const ctx = useContext(Saved);
  return (
    <div>
      <div className="flex min-h-[30px] flex-wrap items-center gap-x-5 gap-y-1.5">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-[14px] text-[#26344d]">
            <input
              type="radio"
              name={name}
              value={o}
              required
              disabled={!!ctx?.locked}
              defaultChecked={ctx?.values[name] === o}
              className="size-[16px] accent-[#0b2c6e]"
            />
            {o}
          </label>
        ))}
      </div>
      <FieldError msg={e[name]} />
    </div>
  );
}

function Radio({ name, label, checked }: { name: string; label: string; checked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-[#26344d]">
      <input type="radio" name={name} defaultChecked={checked} className="size-[17px] accent-[#0b2c6e]" />
      {label}
    </label>
  );
}

function MembershipNo({ value, className = "" }: { value?: string | null; className?: string }) {
  return (
    <span
      title="Issued when your application is approved"
      className={`rounded-md border border-[#c6d9f1] bg-white px-3 py-0.5 font-extrabold tracking-wide ${className}`}
      style={{ color: NAVY }}
    >
      {value ?? "AOJE-____"}
    </span>
  );
}

function FieldError({ msg, center }: { msg?: string[]; center?: boolean }) {
  return msg ? (
    <p className={`mt-1 flex items-center gap-1 text-[12.5px] text-[#e11d48] ${center ? "justify-center text-center" : ""}`}>
      <WarningCircle size={14} weight="fill" className="shrink-0" /> {msg[0]}
    </p>
  ) : null;
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
