type Cell = string | number | boolean | Date | null | undefined;

const cell = (v: Cell) => {
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? "");
  // Quote when needed; prefix formula-like values so Excel doesn't execute them.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function toCsv(header: string[], rows: Cell[][]) {
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
