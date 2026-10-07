// Membership card PDF: portrait CR80 card (54 x 85.6 mm), front + back side by side on A4 for print, cut, fold, laminate.
import {
  appendBezierCurve,
  clip,
  closePath,
  endPath,
  moveTo,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from "pdf-lib";

export type CardData = {
  name: string;
  fatherName: string;
  designation: string;
  company: string;
  employeeId: string;
  membershipNo: string;
  posting: string | null;
  circle: string;
  zone: string;
  contact: string;
  photo: Uint8Array;
  photoType: string;
  signature?: Uint8Array | null;
  signatureType?: string | null;
  logo: Uint8Array; // JPEG
  authoritySign?: Uint8Array | null; // General Secretary's signature, PNG
};

const mm = (v: number) => (v * 72) / 25.4;
const W = mm(54);
const H = mm(85.6);

const NAVY = rgb(0.043, 0.173, 0.431); // #0b2c6e
const RED = rgb(0.839, 0.157, 0.224); // #d62839
const YELLOW = rgb(0.965, 0.761, 0.11); // #f6c21c
const INK = rgb(0.086, 0.137, 0.231);
const MUTED = rgb(0.38, 0.42, 0.49);
const LINE = rgb(0.8, 0.82, 0.86);
const WHITE = rgb(1, 1, 1);

type Fonts = { bold: PDFFont; reg: PDFFont };
type Images = { photo: PDFImage; logo: PDFImage; signature?: PDFImage; authority?: PDFImage };

// Standard PDF fonts only cover Latin-1: strip accents, drop anything else rather than crash.
export const latin1 = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .trim();

/** Shrinks text until it fits `maxWidth`, then truncates with "..." as a last resort. */
function fit(text: string, font: PDFFont, size: number, maxWidth: number, min = 4.5) {
  let t = latin1(text);
  while (size > min && font.widthOfTextAtSize(t, size) > maxWidth) size -= 0.25;
  while (t.length > 1 && font.widthOfTextAtSize(t, size) > maxWidth) t = t.slice(0, -4) + "...";
  return { t, size };
}

function text(page: PDFPage, s: string, x: number, y: number, font: PDFFont, size: number, color = INK, maxWidth = 1e4) {
  const f = fit(s, font, size, maxWidth);
  page.drawText(f.t, { x, y, size: f.size, font, color });
}

/** Word-wraps into at most `maxLines` lines; anything left over joins the last line (which `text` then shrinks to fit). */
function wrap(s: string, font: PDFFont, size: number, maxWidth: number, maxLines = 2) {
  const lines: string[] = [];
  let line = "";
  for (const word of latin1(s).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (!line || font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length > maxLines ? [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(" ")] : lines;
}

/** Text centred on cx. */
function centred(page: PDFPage, s: string, cx: number, y: number, font: PDFFont, size: number, color = INK, maxWidth = W - mm(6)) {
  const f = fit(s, font, size, maxWidth);
  page.drawText(f.t, { x: cx - font.widthOfTextAtSize(f.t, f.size) / 2, y, size: f.size, font, color });
}

/** SVG path in card millimetres (y down from the card's top-left), like a design tool. */
function shape(page: PDFPage, x: number, y: number, d: string, color: RGB) {
  page.drawSvgPath(d, { x, y: y + H, scale: mm(1), color });
}

/** Draws `img` cropped to a circle (cover-fit, no stretching) of radius r centred on (cx, cy). */
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
  const s = Math.max((2 * r) / img.width, (2 * r) / img.height);
  const w = img.width * s, h = img.height * s;
  page.drawImage(img, { x: cx - w / 2, y: cy - h / 2 + (h - 2 * r) * 0.15, width: w, height: h }); // bias up: keep faces in frame
  page.pushOperators(popGraphicsState());
}

/** Image scaled to fit inside a w x h box, centred horizontally on cx, sitting on y. */
function fitImage(page: PDFPage, img: PDFImage, cx: number, y: number, w: number, h: number) {
  const s = Math.min(w / img.width, h / img.height);
  page.drawImage(img, { x: cx - (img.width * s) / 2, y, width: img.width * s, height: img.height * s });
}

// Code 39 (wide = 1): bar/space/bar/... nine elements per character. Covers what membership numbers use.
const CODE39: Record<string, string> = {
  "0": "000110100", "1": "100100001", "2": "001100001", "3": "101100000", "4": "000110001",
  "5": "100110000", "6": "001110000", "7": "000100101", "8": "100100100", "9": "001100100",
  A: "100001001", E: "100011000", J: "000011100", O: "100010010", "-": "010000101", "*": "010010100",
};

/** Draws a Code 39 barcode of `value` centred on cx; skipped if a character isn't supported. */
function barcode(page: PDFPage, value: string, cx: number, y: number, h: number, maxW: number) {
  const chars = `*${value.toUpperCase()}*`.split("");
  if (chars.some((c) => !CODE39[c])) return;
  const units = chars.length * 16 - 1; // per char: 6 narrow + 3 wide (x3) = 15 units, plus 1 gap
  const n = Math.min(maxW / units, mm(0.3));
  let x = cx - (units * n) / 2;
  chars.forEach((c) => {
    [...CODE39[c]].forEach((bit, i) => {
      const w = bit === "1" ? 3 * n : n;
      if (i % 2 === 0) page.drawRectangle({ x, y, width: w, height: h, color: INK });
      x += w;
    });
    x += n;
  });
}

function front(page: PDFPage, x: number, y: number, d: CardData, f: Fonts, img: Images) {
  page.drawRectangle({ x, y, width: W, height: H, color: WHITE });
  const top = (v: number) => y + H - mm(v); // mm from the top edge
  const cx = x + W / 2;

  // Navy header sweeping down to the left, with a red ribbon along its edge
  shape(page, x, y, "M0 0 H54 V12 C46 12 40 14.5 33 18.5 C25 23 12 22.5 0 27 Z", NAVY);
  shape(page, x, y, "M54 12 V15.5 C47 15.5 41 18 34 22 C26 26.5 12 26.5 0 31 V27 C12 22.5 25 23 33 18.5 C40 14.5 46 12 54 12 Z", RED);
  // Bottom-right corner sweep
  shape(page, x, y, "M54 76 V85.6 H30 C38 85.6 44 80 54 76 Z", NAVY);
  shape(page, x, y, "M54 73.5 V76 C44 80 38 85.6 30 85.6 H26.5 C35 85 42 78.5 54 73.5 Z", RED);

  // Logo + name of the association
  page.drawCircle({ x: x + mm(8.5), y: top(8), size: mm(5), color: WHITE });
  circleImage(page, img.logo, x + mm(8.5), top(8), mm(4.6));
  page.drawText("AOJE", { x: x + mm(15.5), y: top(8.4), size: 13, font: f.bold, color: YELLOW });
  page.drawText("Punjab", { x: x + mm(15.5) + f.bold.widthOfTextAtSize("AOJE ", 13), y: top(8.4), size: 13, font: f.bold, color: WHITE });
  text(page, "Association of Junior Engineers", x + mm(15.5), top(11.6), f.reg, 5.4, WHITE, W - mm(18));

  // Photo in a red ring
  const pr = mm(11), pcy = top(38.5);
  page.drawCircle({ x: cx, y: pcy, size: pr + mm(1.6), color: RED });
  page.drawCircle({ x: cx, y: pcy, size: pr + mm(0.8), color: WHITE });
  circleImage(page, img.photo, cx, pcy, pr);

  // Name: first word red, the rest navy
  const nf = fit(d.name, f.bold, 13, W - mm(6));
  const [first, ...rest] = nf.t.split(" ");
  const restText = rest.length ? ` ${rest.join(" ")}` : "";
  const nameW = f.bold.widthOfTextAtSize(first + restText, nf.size);
  page.drawText(first, { x: cx - nameW / 2, y: top(55.6), size: nf.size, font: f.bold, color: RED });
  if (restText) page.drawText(restText, { x: cx - nameW / 2 + f.bold.widthOfTextAtSize(first, nf.size), y: top(55.6), size: nf.size, font: f.bold, color: NAVY });
  centred(page, d.designation, cx, top(59.2), f.bold, 7.2, INK);

  // Membership number bar: red label tab (sized to its text) + navy band
  const by = top(66), bh = mm(5.6), label = "Membership No :";
  const tabEnd = mm(2.5) + f.bold.widthOfTextAtSize(label, 7) + mm(1);
  page.drawRectangle({ x: x + tabEnd - mm(5), y: by, width: W - tabEnd + mm(5), height: bh, color: NAVY });
  page.drawRectangle({ x, y: by, width: tabEnd, height: bh, color: RED });
  page.drawCircle({ x: x + tabEnd, y: by + bh / 2, size: bh / 2, color: RED });
  page.drawText(label, { x: x + mm(2.5), y: by + mm(1.9), size: 7, font: f.bold, color: WHITE });
  const nx = tabEnd + bh / 2 + mm(2.5);
  text(page, d.membershipNo, x + nx, by + mm(1.6), f.bold, 9.5, WHITE, W - nx - mm(2));

  // Details
  centred(page, `Employee ID: ${d.employeeId}`, cx, top(71), f.reg, 6.4, INK);
  centred(page, `Mobile: ${d.contact}`, cx, top(74.4), f.reg, 6.4, INK);
  centred(page, d.company, cx, top(77.6), f.bold, 5.6, MUTED, W - mm(24));

  barcode(page, d.membershipNo, x + mm(20), top(83.4), mm(4.2), mm(28));
}

function back(page: PDFPage, x: number, y: number, d: CardData, f: Fonts, img: Images) {
  page.drawRectangle({ x, y, width: W, height: H, color: WHITE });
  const top = (v: number) => y + H - mm(v);
  const cx = x + W / 2;
  const lx = x + mm(5), vw = W - mm(10);

  // Top-right corner sweep
  shape(page, x, y, "M24 0 H54 V9 C44 9 36 4 24 0 Z", NAVY);
  shape(page, x, y, "M20 0 H24 C36 4 44 9 54 9 V12 C42 12 33 6 20 0 Z", RED);

  const rows: [string, string | null][] = [
    ["Father's Name", d.fatherName],
    ["Organisation", d.company],
    ["Present Posting", d.posting], // older applications may not have it
    ["Circle", d.circle],
    ["Zone", d.zone],
    ["Mobile", d.contact],
  ];
  let ry = 13; // mm from the top; long values take two lines (fits 6 rows with 2 of them wrapped)
  for (const [label, value] of rows) {
    if (!value) continue;
    text(page, `${label}:`, lx, top(ry), f.bold, 5.9, NAVY);
    const lines = wrap(value, f.reg, 6.2, vw);
    lines.forEach((l, j) => text(page, l, lx, top(ry + 2.6 + j * 2.45), f.reg, 6.2, INK, vw));
    ry += 2.3 + lines.length * 2.6;
  }

  // Signatures: member (left), General Secretary (right)
  const sy = top(56);
  const half = (vw - mm(4)) / 2;
  for (const [i, sign, label] of [[0, img.signature, "Member"], [1, img.authority, "General Secretary"]] as const) {
    const sx = lx + i * (half + mm(4));
    if (sign) fitImage(page, sign, sx + half / 2, sy + mm(0.5), half, mm(6.5));
    page.drawLine({ start: { x: sx, y: sy }, end: { x: sx + half, y: sy }, thickness: 0.4, color: LINE });
    centred(page, label, sx + half / 2, sy - mm(2.6), f.reg, 5, MUTED, half);
  }

  // Return address
  text(page, "If found, please return the card to:", lx, top(62.5), f.reg, 5.6, MUTED, vw);
  text(page, "ASSOCIATION OF JUNIOR ENGINEERS, PUNJAB", lx, top(65.6), f.bold, 6, RED, vw);
  text(page, "Engineers' Square, 20E/5, Ground Floor,", lx, top(68.4), f.reg, 5.4, INK, vw);
  text(page, "Tripuri Town, Patiala, Punjab", lx, top(70.9), f.reg, 5.4, INK, vw);

  // Navy footer with a red sweep and the logo
  shape(page, x, y, "M0 75 C16 70 34 73 54 69 V85.6 H0 Z", RED);
  shape(page, x, y, "M0 77.5 C16 72.5 34 75.5 54 71.5 V85.6 H0 Z", NAVY);
  page.drawCircle({ x: x + mm(11), y: top(80.2), size: mm(3.6), color: WHITE });
  circleImage(page, img.logo, x + mm(11), top(80.2), mm(3.3));
  page.drawText("AOJE", { x: x + mm(16.5), y: top(81.4), size: 11, font: f.bold, color: YELLOW });
  page.drawText("Punjab", { x: x + mm(16.5) + f.bold.widthOfTextAtSize("AOJE ", 11), y: top(81.4), size: 11, font: f.bold, color: WHITE });
  centred(page, "(PSPCL/PSTCL) Regd.", cx + mm(5), top(84), f.reg, 4.6, WHITE);
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
  pdf.setTitle(`AOJE Punjab membership card ${d.membershipNo}`);
  pdf.setAuthor("Association of Junior Engineers, Punjab");
  pdf.setCreator("AOJE Punjab portal");

  const page = pdf.addPage([595.28, 841.89]); // A4
  const f = { bold: await pdf.embedFont(StandardFonts.HelveticaBold), reg: await pdf.embedFont(StandardFonts.Helvetica) };
  const embed = (bytes: Uint8Array, type?: string | null) => (type === "image/png" ? pdf.embedPng(bytes) : pdf.embedJpg(bytes));
  const img: Images = {
    photo: await embed(d.photo, d.photoType),
    logo: await pdf.embedJpg(d.logo),
    signature: d.signature ? await embed(d.signature, d.signatureType) : undefined,
    authority: d.authoritySign ? await pdf.embedPng(d.authoritySign) : undefined,
  };

  const top = page.getHeight() - mm(20);
  text(page, "AOJE Punjab Membership Card", mm(20), top, f.bold, 16, NAVY);
  text(page, `${latin1(d.name)}  |  ${d.membershipNo}`, mm(20), top - mm(6.5), f.reg, 10, MUTED);
  const steps = [
    "1. Print this page at 100% / actual size (turn off \"fit to page\").",
    "2. Cut along the four corner marks around both sides of the card.",
    "3. Fold along the dashed line so the back is behind the front, then laminate.",
  ];
  steps.forEach((s, i) => text(page, s, mm(20), top - mm(15) - i * mm(5.2), f.reg, 9.5, INK));

  // Front + back side by side, sharing the fold line.
  const x = (page.getWidth() - 2 * W) / 2;
  const y = top - mm(36) - H;
  front(page, x, y, d, f, img);
  back(page, x + W, y, d, f, img);
  page.drawRectangle({ x, y, width: 2 * W, height: H, borderColor: LINE, borderWidth: 0.5 });
  page.drawLine({ start: { x: x + W, y: y - mm(6) }, end: { x: x + W, y: y + H + mm(6) }, thickness: 0.6, color: MUTED, dashArray: [3, 2] });
  text(page, "fold", x + W - mm(2.6), y + H + mm(7.5), f.reg, 6.5, MUTED);
  cropMarks(page, x, y, 2 * W, H);
  centred(page, "FRONT", x + W / 2, y - mm(9), f.bold, 8, NAVY, W);
  centred(page, "BACK", x + W * 1.5, y - mm(9), f.bold, 8, RED, W);

  text(page, "This card is issued by the Association of Junior Engineers, Punjab (PSPCL/PSTCL) (Regd.).", mm(20), y - mm(20), f.reg, 8, MUTED);
  text(page, "Membership is subject to the rules of the constitution of the Association.", mm(20), y - mm(24.5), f.reg, 8, MUTED);

  return pdf.save();
}
