"use client";

import { useRef, useState } from "react";

const FRAME = 260; // px, longest side of the crop frame

/**
 * Drag-to-position, slider-to-zoom cropper with a fixed-aspect frame.
 * Returns a JPEG (longest side max 800px, white background), the whole image if not cropped, or null if unreadable.
 */
export function ImageCropper({
  src,
  name,
  aspect,
  title,
  onDone,
}: {
  src: string;
  name: string;
  aspect: number; // width / height
  title: string;
  onDone: (file: File | null) => void;
}) {
  const fw = aspect >= 1 ? FRAME : Math.round(FRAME * aspect);
  const fh = aspect >= 1 ? Math.round(FRAME / aspect) : FRAME;
  const img = useRef<HTMLImageElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number }>(undefined);
  const [nat, setNat] = useState<{ w: number; h: number }>();
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // image top-left relative to the frame, px

  const base = nat ? Math.max(fw / nat.w, fh / nat.h) : 1; // "cover" scale
  const s = base * zoom;
  // Keep the frame fully covered by the image.
  const clamp = (p: { x: number; y: number }, sc = s) =>
    nat ? { x: Math.min(0, Math.max(fw - nat.w * sc, p.x)), y: Math.min(0, Math.max(fh - nat.h * sc, p.y)) } : p;

  function loaded() {
    const el = img.current!;
    const n = { w: el.naturalWidth, h: el.naturalHeight };
    const b = Math.max(fw / n.w, fh / n.h);
    setNat(n);
    setPos({ x: (fw - n.w * b) / 2, y: (fh - n.h * b) / 2 });
  }

  // Zoom around the centre of the frame.
  function zoomTo(z: number) {
    const ns = base * z;
    setPos(clamp({ x: fw / 2 - ((fw / 2 - pos.x) * ns) / s, y: fh / 2 - ((fh / 2 - pos.y) * ns) / s }, ns));
    setZoom(z);
  }

  async function finish(crop: boolean) {
    const el = img.current;
    if (!el || !nat) return onDone(null);
    const [sx, sy, sw, sh] = crop ? [-pos.x / s, -pos.y / s, fw / s, fh / s] : [0, 0, nat.w, nat.h];
    const k = Math.min(1, 800 / Math.max(sw, sh));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * k);
    canvas.height = Math.round(sh * k);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff"; // transparent PNGs get a white background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(el, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    onDone(blob && new File([blob], name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }));
  }

  return (
    <div role="dialog" aria-modal aria-label={title} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 text-[#16233b] shadow-2xl">
        <p className="text-[17px] font-bold">{title}</p>
        <p className="mt-1 text-[13px] text-[#4a5a72]">Drag the picture to position it, and use the slider to zoom.</p>

        <div
          className="relative mx-auto mt-4 cursor-grab touch-none overflow-hidden rounded-md bg-[#16233b] select-none active:cursor-grabbing"
          style={{ width: fw, height: fh }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d) setPos(clamp({ x: d.x + e.clientX - d.px, y: d.y + e.clientY - d.py }));
          }}
          onPointerUp={() => (drag.current = undefined)}
          onPointerCancel={() => (drag.current = undefined)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img
            ref={img}
            src={src}
            alt=""
            draggable={false}
            onLoad={loaded}
            onError={() => onDone(null)}
            className={`absolute top-0 left-0 max-w-none origin-top-left ${nat ? "" : "opacity-0"}`}
            style={{ width: nat?.w, height: nat?.h, transform: `translate(${pos.x}px, ${pos.y}px) scale(${s})` }}
          />
        </div>

        <label className="mt-4 flex items-center gap-3 text-[13px] text-[#4a5a72]">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => zoomTo(Number(e.target.value))}
            className="flex-1 accent-[#0b2c6e]"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => finish(false)} className="rounded-md border border-[#c6d9f1] px-4 py-2 text-[14px] font-semibold">
            Use full photo
          </button>
          <button
            type="button"
            onClick={() => finish(true)}
            disabled={!nat}
            className="rounded-md bg-[#0b2c6e] px-4 py-2 text-[14px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            Crop &amp; use
          </button>
        </div>
      </div>
    </div>
  );
}
