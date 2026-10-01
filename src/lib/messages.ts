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

function layout(heading: string, intro: string, rows: Row[], outro: string, button?: { label: string; url: string }) {
  const rowHtml = rows
    .map(
      ([l, v, mono]) =>
        `<tr><td style="padding:10px 0;color:#5a6b62;font-size:13px;width:40%">${esc(l)}</td><td style="padding:10px 0;font-size:15px;font-weight:600;color:#0e1a14;${mono ? "font-family:Consolas,Menlo,monospace;letter-spacing:.5px" : ""}">${esc(v)}</td></tr>`,
    )
    .join("");
  const buttonHtml = button
    ? `<p style="margin:28px 0 8px"><a href="${esc(button.url)}" style="display:inline-block;background:#a8e25e;color:#0d1a06;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:8px">${esc(button.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f4f7f3;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f3;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e9e1">
<tr><td style="background:#0a1018;padding:18px 28px;color:#ffffff;font-size:18px;font-weight:700"><span style="color:#a8e25e">&#9889;</span> AOJ Punjab</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:22px;color:#0e1a14">${esc(heading)}</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#33443b">${intro}</p>
${rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e3e9e1;border-bottom:1px solid #e3e9e1">${rowHtml}</table>` : ""}
${buttonHtml}
<p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#33443b">${outro}</p>
</td></tr>
<tr><td style="padding:18px 28px;background:#f8faf7;color:#7a8a81;font-size:12px;line-height:1.5">Association of Junior Engineers, Punjab (PSPCL/PSTCL) (Regd.)<br>Engineers' Square, 20E/5, Tripuri Town, Patiala, Punjab</td></tr>
</table></td></tr></table></body></html>`;
}

const text = (lines: (string | false | undefined)[]) =>
  [...lines.filter(Boolean), "", "Association of Junior Engineers, Punjab", "Engineers' Square, 20E/5, Tripuri Town, Patiala"].join("\n");

export function buildMessage(kind: Kind, d: MessageData): Message {
  const hi = `Dear ${esc(d.name)},`;
  const name = smsVar(d.name);

  switch (kind) {
    case "received":
      return {
        email: {
          subject: "We received your AOJ membership application",
          html: layout(
            "Application received",
            `${hi} thank you for applying for membership of the Association of Junior Engineers, Punjab.`,
            [["Reference", d.ref, true]],
            "The Operation Team will review your details. Once approved, you will receive your membership number and login by email and SMS.",
          ),
          text: text([`Dear ${d.name},`, "", "We received your AOJ Punjab membership application.", `Reference: ${d.ref}`, "", "You will receive your membership number and login after approval."]),
        },
        sms: { name, ref: d.ref },
      };

    case "approved":
      return {
        email: {
          subject: `Your AOJ membership is approved: ${d.membershipNo}`,
          html: layout(
            "Welcome to the association",
            `${hi} your membership application has been approved. Here are your membership details and login.`,
            [
              ["Membership No.", d.membershipNo!, true],
              ["Login ID", d.loginId!, true],
              ["Password", d.password!, true],
            ],
            "Please change your password after your first login (Account &rarr; Change password). Keep these details private.",
            { label: "Log in to AOJ Punjab", url: d.loginUrl },
          ),
          text: text([
            `Dear ${d.name},`,
            "",
            "Your AOJ Punjab membership is approved.",
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
          subject: "Update on your AOJ membership application",
          html: layout(
            "Application not approved",
            `${hi} after review, your membership application could not be approved.`,
            [
              ["Reference", d.ref, true],
              ["Reason", d.reason!],
            ],
            "If you think this is a mistake, please correct the details and apply again, or contact the head office at Tripuri Town, Patiala.",
          ),
          text: text([`Dear ${d.name},`, "", "Your AOJ Punjab membership application was not approved.", `Reference: ${d.ref}`, `Reason: ${d.reason}`, "", "You can correct the details and apply again."]),
        },
        sms: { name, ref: d.ref, reason: smsVar(d.reason!) },
      };

    case "password":
      return {
        email: {
          subject: "Your AOJ Punjab password was reset",
          html: layout(
            "New password issued",
            `${hi} a new password has been issued for your AOJ Punjab account.`,
            [
              ["Login ID", d.loginId!, true],
              ["New password", d.password!, true],
            ],
            "Please change it after you log in. If you did not ask for this, contact the association office.",
            { label: "Log in to AOJ Punjab", url: d.loginUrl },
          ),
          text: text([`Dear ${d.name},`, "", "A new password was issued for your AOJ Punjab account.", `Login ID: ${d.loginId}`, `New password: ${d.password}`, `Log in: ${d.loginUrl}`]),
        },
        sms: { name, login: smsVar(d.loginId!), password: smsVar(d.password!) },
      };
  }
}
