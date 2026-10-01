// Soft 3D "energy wave" behind the hero: layered mounds with glowing rims, generated as SVG.
const W = 1440;
const H = 480;

const bump = (u: number, c: number, w: number) => Math.exp(-(((u - c) / w) ** 2));

type Layer = { base: number; humps: [c: number, w: number, a: number][] };

const layers: Layer[] = [
  { base: 330, humps: [[0.05, 0.12, 240], [0.4, 0.14, 120], [0.82, 0.16, 250]] },
  { base: 400, humps: [[0.18, 0.13, 180], [0.62, 0.2, 170], [1.02, 0.1, 120]] },
  { base: 470, humps: [[0.3, 0.16, 130], [0.78, 0.18, 110]] },
];

function edge({ base, humps }: Layer) {
  let d = "";
  for (let x = 0; x <= W; x += 16) {
    const u = x / W;
    const y = humps.reduce((acc, [c, w, a]) => acc - a * bump(u, c, w), base);
    d += `${x ? "L" : "M"}${x} ${y.toFixed(1)}`;
  }
  return d;
}

const edges = layers.map(edge);

export function Wave({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="wave-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--wave-top)" }} />
          <stop offset="0.55" style={{ stopColor: "var(--wave-mid)" }} />
          <stop offset="1" style={{ stopColor: "var(--canvas)" }} />
        </linearGradient>
        <linearGradient id="wave-rim" x1="0" x2="1">
          <stop offset="0" style={{ stopColor: "var(--rim-a)" }} stopOpacity="0.9" />
          <stop offset="0.35" style={{ stopColor: "var(--rim-b)" }} stopOpacity="0.35" />
          <stop offset="0.6" style={{ stopColor: "var(--rim-a)" }} stopOpacity="0.8" />
          <stop offset="1" style={{ stopColor: "var(--rim-c)" }} stopOpacity="0.35" />
        </linearGradient>
        <filter id="wave-glow" x="-5%" y="-40%" width="110%" height="180%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      {edges.map((d, i) => (
        <g key={i} opacity={1 - i * 0.12}>
          <path d={`${d}L${W} ${H}L0 ${H}Z`} fill="url(#wave-body)" />
          <path d={d} fill="none" stroke="url(#wave-rim)" strokeWidth="8" filter="url(#wave-glow)" opacity="0.55" />
          <path d={d} fill="none" stroke="url(#wave-rim)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  );
}
