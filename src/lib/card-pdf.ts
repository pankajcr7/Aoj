// Membership card PDF: CR80 card (85.6 x 54 mm), front + back side by side on A4 for print, cut, fold, laminate.
import {
  appendBezierCurve,
  clip,
  closePath,
  endPath,
  moveTo,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";

export type CardData = {
  name: string;
  fatherName: string;
  designation: string;
  company: string;
  employeeId: string;
  membershipNo: string;
  memberSince: string;
  circle: string;
  zone: string;
  contact: string;
  photo: Uint8Array;
  photoType: string;
  signature?: Uint8Array | null;
  signatureType?: string | null;
  logo: Uint8Array; // JPEG
};

const mm = (v: number) => (v * 72) / 25.4;
const W = mm(85.6);
const H = mm(54);

const INK = rgb(0.055, 0.1, 0.08);
const MUTED = rgb(0.37, 0.43, 0.4);
const DARK = rgb(0.04, 0.063, 0.094);
const LIME = rgb(0.66, 0.886, 0.37);
const GREEN = rgb(0.25, 0.48, 0.05);
const LINE = rgb(0.8, 0.83, 0.81);
const WHITE = rgb(1, 1, 1);

// Standard PDF fonts only cover Latin-1: strip accents, drop anything else rather than crash.
export const latin1 = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .trim();

/** Shrinks text until it fits `maxWidth`, then truncates with "..." as a last resort. */
function fit(text: string, font: PDFFont, size: number, maxWidth: number, min = 5) {
  let t = latin1(text);
  while (size > min && font.widthOfTextAtSize(t, size) > maxWidth) size -= 0.25;
  while (t.length > 1 && font.widthOfTextAtSize(t, size) > maxWidth) t = t.slice(0, -4) + "...";
  return { t, size };
}

function text(page: PDFPage, s: string, x: number, y: number, font: PDFFont, size: number, color = INK, maxWidth = 1e4) {
  const f = fit(s, font, size, maxWidth);
  page.drawText(f.t, { x, y, size: f.size, font, color });
}

/** Draws `img` cropped to a circle of radius r centred on (cx, cy). */
function circleImage(page: PDFPage, img: PDFImage, cx: number, cy: number, r: number) {
  const k = r * 0.5523; // bezier handle length for a quarter circle
  page.pushOperators(
    pushGraphicsState(),
    moveTo(cx + r, cy),
    appendBezierCurve(cx + r, cy + k, cx + k, cy + r, cx, cy + r),
    appendBezierCurve(cx - k, cy + r, cx - r, cy + k, cx - r, cy),
    appendBezierCurve(cx - r, cy - k, cx - k, cy - r, cx, cy - r),
    appendBezierCurve(cx + k, cy - r, cx + r, cy - k, cx + r, cy),
    closePath(),
    clip(),
    endPath(),
  );
  page.drawImage(img, { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r });
  page.pushOperators(popGraphicsState());
}

type Images = { photo: PDFImage; logo: PDFImage; signature?: PDFImage };

function front(page: PDFPage, x: number, y: number, d: CardData, f: { bold: PDFFont; reg: PDFFont }, { photo, logo }: Images) {
  page.drawRectangle({ x, y, width: W, height: H, color: WHITE });
  // Header band
  const hh = mm(10.5);
  page.drawRectangle({ x, y: y + H - hh, width: W, height: hh, color: DARK });
  circleImage(page, logo, x + mm(5.5), y + H - hh / 2, mm(4.4));
  text(page, "ASSOCIATION OF JUNIOR ENGINEERS, PUNJAB", x + mm(11), y + H - mm(4.6), f.bold, 7, WHITE, W - mm(13.5));
  text(page, "(PSPCL/PSTCL) Regd.   Licence No. PB41/253/351836", x + mm(11), y + H - mm(8.2), f.reg, 5, LIME, W - mm(13.5));

  // Photo: fill a 3:4 box, cropping the overflow (like a passport photo)
  const pw = mm(19), ph = mm(25), px = x + mm(3.5), py = y + mm(7.5);
  const s = Math.max(pw / photo.width, ph / photo.height);
  page.pushOperators(pushGraphicsState(), rectangle(px, py, pw, ph), clip(), endPath());
  page.drawImage(photo, { x: px + (pw - photo.width * s) / 2, y: py + (ph - photo.height * s) / 2, width: photo.width * s, height: photo.height * s });
  page.pushOperators(popGraphicsState());
  page.drawRectangle({ x: px, y: py, width: pw, height: ph, borderColor: LINE, borderWidth: 0.5 });

  // Details
  const tx = x + mm(25.5), tw = W - mm(28.5);
  text(page, d.name, tx, y + H - mm(16), f.bold, 10, INK, tw);
  text(page, d.designation, tx, y + H - mm(19.6), f.reg, 6.5, MUTED, tw);
  text(page, "MEMBERSHIP NO.", tx, y + H - mm(24.4), f.bold, 4.8, MUTED);
  text(page, d.membershipNo, tx, y + H - mm(28.8), f.bold, 12, GREEN, tw);
  const col2 = tx + tw / 2;
  text(page, "EMPLOYEE ID", tx, y + mm(12.6), f.bold, 4.5, MUTED);
  text(page, d.employeeId, tx, y + mm(9.4), f.bold, 6.5, INK, tw / 2 - mm(1));
  text(page, "ORGANISATION", col2, y + mm(12.6), f.bold, 4.5, MUTED);
  text(page, d.company, col2, y + mm(9.4), f.bold, 6.5, INK, tw / 2);

  // Footer strip
  const fh = mm(5);
  page.drawRectangle({ x, y, width: W, height: fh, color: LIME });
  text(page, "MEMBER", x + mm(3.5), y + mm(1.6), f.bold, 6.5, DARK);
  const since = latin1(`Member since ${d.memberSince}`);
  page.drawText(since, { x: x + W - mm(3.5) - f.reg.widthOfTextAtSize(since, 5.5), y: y + mm(1.7), size: 5.5, font: f.reg, color: DARK });
}

function back(page: PDFPage, x: number, y: number, d: CardData, f: { bold: PDFFont; reg: PDFFont }, { signature }: Images) {
  page.drawRectangle({ x, y, width: W, height: H, color: WHITE });
  page.drawRectangle({ x, y: y + H - mm(1.6), width: W, height: mm(1.6), color: LIME });

  const lx = x + mm(4), vw = W - mm(8);
  const rows: [string, string][] = [
    ["FATHER'S NAME", d.fatherName],
    ["POSTING", `${d.circle}, ${d.zone}`],
    ["MOBILE", d.contact],
  ];
  rows.forEach(([label, value], i) => {
    const ry = y + H - mm(7) - i * mm(6.4);
    text(page, label, lx, ry, f.bold, 4.5, MUTED);
    text(page, value, lx, ry - mm(2.8), f.bold, 7, INK, vw);
  });

  // Signature lines
  const sy = y + mm(14);
  page.drawLine({ start: { x: lx, y: sy }, end: { x: lx + mm(30), y: sy }, thickness: 0.4, color: MUTED });
  page.drawLine({ start: { x: x + W - mm(34), y: sy }, end: { x: x + W - mm(4), y: sy }, thickness: 0.4, color: MUTED });
  if (signature) {
    const sw = mm(30), sh = mm(7), sc = Math.min(sw / signature.width, sh / signature.height);
    page.drawImage(signature, { x: lx + (sw - signature.width * sc) / 2, y: sy + mm(0.5), width: signature.width * sc, height: signature.height * sc });
  }
  text(page, "Member's signature", lx, sy - mm(2.6), f.reg, 4.8, MUTED);
  text(page, "General Secretary, AOJ Punjab", x + W - mm(34), sy - mm(2.6), f.reg, 4.8, MUTED);

  // Return address
  page.drawRectangle({ x, y, width: W, height: mm(8.5), color: rgb(0.95, 0.96, 0.95) });
  text(page, "If found, please return to:", lx, y + mm(5.6), f.bold, 4.8, INK);
  text(page, "Engineers' Square, 20E/5, Ground Floor, Tripuri Town, Patiala, Punjab", lx, y + mm(2.4), f.reg, 4.8, MUTED, vw);
}

function cropMarks(page: PDFPage, x: number, y: number, w: number, h: number) {
  const len = mm(4), gap = mm(1.5), opts = { thickness: 0.4, color: MUTED };
  for (const [cx, cy, dx, dy] of [[x, y, -1, -1], [x + w, y, 1, -1], [x, y + h, -1, 1], [x + w, y + h, 1, 1]] as const) {
    page.drawLine({ start: { x: cx + dx * gap, y: cy }, end: { x: cx + dx * (gap + len), y: cy }, ...opts });
    page.drawLine({ start: { x: cx, y: cy + dy * gap }, end: { x: cx, y: cy + dy * (gap + len) }, ...opts });
  }
}

export async function membershipCardPdf(d: CardData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`AOJ Punjab membership card ${d.membershipNo}`);
  pdf.setAuthor("Association of Junior Engineers, Punjab");
  pdf.setCreator("AOJ Punjab portal");

  const page = pdf.addPage([595.28, 841.89]); // A4
  const f = { bold: await pdf.embedFont(StandardFonts.HelveticaBold), reg: await pdf.embedFont(StandardFonts.Helvetica) };
  const embed = (bytes: Uint8Array, type?: string | null) => (type === "image/png" ? pdf.embedPng(bytes) : pdf.embedJpg(bytes));
  const img: Images = {
    photo: await embed(d.photo, d.photoType),
    logo: await pdf.embedJpg(d.logo),
    signature: d.signature ? await embed(d.signature, d.signatureType) : undefined,
  };

  const top = page.getHeight() - mm(20);
  text(page, "AOJ Punjab Membership Card", mm(20), top, f.bold, 16);
  text(page, `${latin1(d.name)}  |  ${d.membershipNo}`, mm(20), top - mm(6.5), f.reg, 10, MUTED);
  const steps = [
    "1. Print this page at 100% / actual size (turn off \"fit to page\").",
    "2. Cut along the four corner marks around both sides of the card.",
    "3. Fold along the dashed line so the back is behind the front, then laminate.",
  ];
  steps.forEach((s, i) => text(page, s, mm(20), top - mm(15) - i * mm(5.2), f.reg, 9.5, INK));

  // Front + back side by side, sharing the fold line.
  const x = (page.getWidth() - 2 * W) / 2;
  const y = top - mm(38) - H;
  front(page, x, y, d, f, img);
  back(page, x + W, y, d, f, img);
  page.drawRectangle({ x, y, width: 2 * W, height: H, borderColor: LINE, borderWidth: 0.5 });
  page.drawLine({ start: { x: x + W, y: y - mm(6) }, end: { x: x + W, y: y + H + mm(6) }, thickness: 0.6, color: MUTED, dashArray: [3, 2] });
  text(page, "fold", x + W - mm(2.6), y + H + mm(7.5), f.reg, 6.5, MUTED);
  cropMarks(page, x, y, 2 * W, H);

  text(page, "This card is issued by the Association of Junior Engineers, Punjab (PSPCL/PSTCL) (Regd.).", mm(20), y - mm(16), f.reg, 8, MUTED);
  text(page, "Membership is subject to the rules of the constitution of the Association.", mm(20), y - mm(20.5), f.reg, 8, MUTED);

  return pdf.save();
}
