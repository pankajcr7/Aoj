// Email + SMS content for every notification. Pure functions (no I/O) so they can be checked in isolation.

export type Kind = "received" | "approved" | "rejected" | "password";
export type MessageData = {
  name: string;
  ref: string;
  loginUrl: string;
  membershipNo?: string;
  loginId?: string;
  password?: string;
  reason?: string;
};
export type Message = { email: { subject: string; html: string; text: string }; sms: Record<string, string> };

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** TRAI DLT caps each SMS variable at 30 characters. */
export const smsVar = (s: string) => (s.length > 30 ? s.slice(0, 27).trimEnd() + "..." : s);

/** Short, readable reference an applicant can quote on the phone. */
export const refFor = (applicationId: string) => applicationId.slice(0, 8).toUpperCase();

type Row = [label: string, value: string, mono?: boolean];

const NAVY = "#0b2c6e";

/** Minimal branded email: logo header, heading, text, detail rows, optional button. `site` is any URL on the portal; the logo is served from it. */
function layout(site: string, heading: string, intro: string, rows: Row[], outro: string, button?: { label: string; url: string }) {
  const logo = new URL("/logo.jpeg", site).href;
  const rowHtml = rows
    .map(
      ([l, v, mono], i) =>
        `<tr><td style="padding:12px 0;${i ? "border-top:1px solid #eceef2;" : ""}color:#6b7280;font-size:13px;width:38%">${esc(l)}</td><td style="padding:12px 0;${i ? "border-top:1px solid #eceef2;" : ""}font-size:15px;font-weight:600;color:#111827;${mono ? "font-family:Consolas,Menlo,monospace;letter-spacing:.5px" : ""}">${esc(v)}</td></tr>`,
    )
    .join("");
  const buttonHtml = button
    ? `<p style="margin:28px 0 0"><a href="${esc(button.url)}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:6px">${esc(button.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#374151">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px">
<tr><td style="padding:28px 36px 22px;border-bottom:1px solid #eceef2">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:14px"><img src="${esc(logo)}" width="52" height="52" alt="AOJE Punjab" style="display:block;border:0;border-radius:50%"></td>
<td><div style="font-size:16px;font-weight:700;color:${NAVY};letter-spacing:.2px">AOJE Punjab</div><div style="font-size:12px;color:#6b7280;margin-top:2px">Association of Junior Engineers, Punjab</div></td>
</tr></table></td></tr>
<tr><td style="padding:32px 36px 36px">
<h1 style="margin:0 0 14px;font-size:20px;font-weight:600;color:#111827">${esc(heading)}</h1>
<p style="margin:0 0 22px;font-size:15px;line-height:1.65">${intro}</p>
${rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:6px;padding:4px 18px">${rowHtml}</table>` : ""}
${buttonHtml}
<p style="margin:24px 0 0;font-size:14px;line-height:1.65;color:#4b5563">${outro}</p>
</td></tr>
</table>
<p style="max-width:560px;margin:20px auto 0;font-size:12px;line-height:1.6;color:#9ca3af;text-align:center">Association of Junior Engineers, Punjab (PSPCL/PSTCL) Regd.<br>H.Q. 67-C Ranjit Nagar Near Tiwana Chownk Patiala (147001)<br>This is an automated message from the AOJE Punjab membership portal.</p>
</td></tr></table></body></html>`;
}

const text = (lines: (string | false | undefined)[]) =>
  [...lines.filter(Boolean), "", "Association of Junior Engineers, Punjab", "H.Q. 67-C Ranjit Nagar Near Tiwana Chownk Patiala (147001)"].join("\n");

export function buildMessage(kind: Kind, d: MessageData): Message {
  const hi = `Dear ${esc(d.name)},`;
  const name = smsVar(d.name);

  switch (kind) {
    case "received":
      return {
        email: {
          subject: "We received your AOJE membership application",
          html: layout(
            d.loginUrl,
            "Application received",
            `${hi} thank you for applying for membership of the Association of Junior Engineers, Punjab.`,
            [["Reference", d.ref, true]],
            "The Operation Team will review your details. Once approved, you will receive your membership number and login by email and SMS.",
          ),
          text: text([`Dear ${d.name},`, "", "We received your AOJE Punjab membership application.", `Reference: ${d.ref}`, "", "You will receive your membership number and login after approval."]),
        },
        sms: { name, ref: d.ref },
      };

    case "approved":
      return {
        email: {
          subject: `Your AOJE membership is approved: ${d.membershipNo}`,
          html: layout(
            d.loginUrl,
            "Welcome to the association",
            `${hi} your membership application has been approved. Here are your membership details and login.`,
            [
              ["Membership No.", d.membershipNo!, true],
              ["Login ID", d.loginId!, true],
              ["Password", d.password!, true],
            ],
            "Please change your password after your first login (Account &rarr; Change password). Keep these details private.",
            { label: "Log in to AOJE Punjab", url: d.loginUrl },
          ),
          text: text([
            `Dear ${d.name},`,
            "",
            "Your AOJE Punjab membership is approved.",
            `Membership No.: ${d.membershipNo}`,
            `Login ID: ${d.loginId}`,
            `Password: ${d.password}`,
            `Log in: ${d.loginUrl}`,
            "",
            "Please change your password after your first login.",
          ]),
        },
        sms: { name, number: smsVar(d.membershipNo!), login: smsVar(d.loginId!), password: smsVar(d.password!) },
      };

    case "rejected":
      return {
        email: {
          subject: "Update on your AOJE membership application",
          html: layout(
            d.loginUrl,
            "Application not approved",
            `${hi} after review, your membership application could not be approved.`,
            [
              ["Reference", d.ref, true],
              ["Reason", d.reason!],
            ],
            "If you think this is a mistake, please correct the details and apply again, or contact the head office at H.Q. 67-C Ranjit Nagar Near Tiwana Chownk Patiala (147001).",
          ),
          text: text([`Dear ${d.name},`, "", "Your AOJE Punjab membership application was not approved.", `Reference: ${d.ref}`, `Reason: ${d.reason}`, "", "You can correct the details and apply again."]),
        },
        sms: { name, ref: d.ref, reason: smsVar(d.reason!) },
      };

    case "password":
      return {
        email: {
          subject: "Your AOJE Punjab password was reset",
          html: layout(
            d.loginUrl,
            "New password issued",
            `${hi} a new password has been issued for your AOJE Punjab account.`,
            [
              ["Login ID", d.loginId!, true],
              ["New password", d.password!, true],
            ],
            "Please change it after you log in. If you did not ask for this, contact the association office.",
            { label: "Log in to AOJE Punjab", url: d.loginUrl },
          ),
          text: text([`Dear ${d.name},`, "", "A new password was issued for your AOJE Punjab account.", `Login ID: ${d.loginId}`, `New password: ${d.password}`, `Log in: ${d.loginUrl}`]),
        },
        sms: { name, login: smsVar(d.loginId!), password: smsVar(d.password!) },
      };
  }
}
