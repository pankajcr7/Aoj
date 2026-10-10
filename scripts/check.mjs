// npm run check — self-checks for the pure helpers.
import assert from "node:assert/strict";
import { generatePassword, memberLoginId, membershipNo } from "../src/lib/credentials.ts";
import { toCsv } from "../src/lib/csv.ts";
import { buildMessage, esc, refFor, smsVar } from "../src/lib/messages.ts";
import { latin1, membershipCardPdf } from "../src/lib/card-pdf.ts";
import { PDFDocument } from "pdf-lib";
import { readFileSync } from "node:fs";

assert.equal(membershipNo(7), "AOJE-0007");
assert.equal(membershipNo(12345), "AOJE-12345");
assert.equal(memberLoginId(418), "aoj0418");

const pw = generatePassword();
assert.equal(pw.length, 10);
assert.match(pw, /^[A-HJ-NP-Za-km-np-z2-9]+$/);
assert.notEqual(generatePassword(), generatePassword());

assert.equal(toCsv(["a", "b"], [["x", 1]]), "a,b\r\nx,1");
assert.equal(toCsv(["a"], [['He said "hi", ok']]), 'a\r\n"He said ""hi"", ok"');
assert.equal(toCsv(["a"], [["=SUM(A1)"]]), "a\r\n'=SUM(A1)");
assert.equal(toCsv(["a"], [[null], [new Date("2026-09-30T10:00:00Z")]]), "a\r\n\r\n2026-09-30");

// Notifications
assert.equal(esc(`<b>"Tom" & 'Jerry'</b>`), "&lt;b&gt;&quot;Tom&quot; &amp; &#39;Jerry&#39;&lt;/b&gt;");
assert.equal(smsVar("x".repeat(30)), "x".repeat(30));
assert.equal(smsVar("y".repeat(31)), "y".repeat(27) + "...");
assert.equal(refFor("3f2a9c1e-0000-4000-8000-000000000000"), "3F2A9C1E");
const base = { name: "Harjeet <Kaur>", ref: "3F2A9C1E", loginUrl: "https://aoj.example/login" };
const approved = buildMessage("approved", { ...base, membershipNo: "AOJE-0001", loginId: "aoj0001", password: "Pw3xYz9Kq2" });
assert.match(approved.email.subject, /AOJE-0001/);
assert.ok(approved.email.html.includes("Harjeet &lt;Kaur&gt;") && !approved.email.html.includes("<Kaur>"), "names are HTML-escaped");
assert.ok(approved.email.text.includes("Password: Pw3xYz9Kq2") && approved.email.html.includes("Pw3xYz9Kq2"));
assert.ok(!approved.email.html.includes("attached"), "no card note unless the card is attached");
assert.ok(buildMessage("approved", { ...base, membershipNo: "AOJE-0001", loginId: "aoj0001", password: "x", cardAttached: true }).email.text.includes("card is attached"));
assert.deepEqual(approved.sms,{ name: "Harjeet <Kaur>", number: "AOJE-0001", login: "aoj0001", password: "Pw3xYz9Kq2" });
const rejected = buildMessage("rejected", { ...base, reason: "Employee ID does not match PSTCL records" });
assert.equal(rejected.sms.reason, "Employee ID does not match...");
assert.ok(rejected.email.text.includes("Employee ID does not match PSTCL records"), "email keeps the full reason");
const received = buildMessage("received", base);
assert.ok(!/password/i.test(received.email.text), "no credentials before approval");
for (const m of [approved, rejected, received, buildMessage("password", { ...base, loginId: "aoj0001", password: "x" })])
  assert.ok(!/[–—]/.test(m.email.text + m.email.subject), "no en/em dashes in copy");

// Membership card PDF
assert.equal(latin1("José Ñúñez"), "Jose Nunez");
assert.equal(latin1("ਹਰਜੀਤ Kaur"), "Kaur", "unsupported scripts are dropped, not crashed on");
const png1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const card = await membershipCardPdf({
  name: "Gurpreet Singh Sandhu With A Very Long Name Indeed", fatherName: "Balwinder Singh", designation: "JE (Electrical)",
  address: "20E/5 Tripuri Town, Patiala", division: "Patiala", subDivision: "City", posting: null,
  company: "PSPCL", employeeId: "PSPCL/JE/40718", membershipNo: "AOJE-0001", memberSince: "30 Sept 2026", circle: "Patiala",
  zone: "South (Patiala)", contact: "9876543210", bloodGroup: "O+", photo: png1x1, photoType: "image/png",
  signature: png1x1, signatureType: "image/png", logo: readFileSync("public/logo.jpeg"),
});
const loaded = await PDFDocument.load(card);
assert.equal(loaded.getPageCount(), 1);
assert.deepEqual(Object.values(loaded.getPage(0).getSize()).map(Math.round), [595, 842], "A4");
assert.match(loaded.getTitle(), /AOJE-0001/);

console.log("all checks passed");
