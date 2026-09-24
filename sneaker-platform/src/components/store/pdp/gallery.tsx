"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { ThemeKey } from "@/themes/registry";

type Img = { url: string; alt?: string };

function Lightbox({ images, index, onClose, setIndex }: { images: Img[]; index: number; onClose: () => void; setIndex: (i: number) => void }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", on);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", on);
      document.documentElement.style.overflow = "";
    };
  }, [index, images.length, onClose, setIndex]);
  return (
    <div role="dialog" aria-modal="true" aria-label="Ürün görselleri" className="fixed inset-0 z-[80] flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 text-black">
        <span className="text-sm">
          {index + 1} / {images.length}
        </span>
        <button type="button" onClick={onClose} aria-label="Kapat" className="grid h-10 w-10 place-items-center">
          <X size={26} />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[index].url} alt={images[index].alt ?? ""} className="max-h-full max-w-full object-contain" />
        <button type="button" aria-label="Önceki" onClick={() => setIndex((index - 1 + images.length) % images.length)} className="absolute left-4 grid h-12 w-12 place-items-center rounded-full bg-black/5 text-black">
          <ChevronLeft />
        </button>
        <button type="button" aria-label="Sonraki" onClick={() => setIndex((index + 1) % images.length)} className="absolute right-4 grid h-12 w-12 place-items-center rounded-full bg-black/5 text-black">
          <ChevronRight />
        </button>
      </div>
      <div className="flex justify-center gap-2 p-4">
        {images.map((im, i) => (
          <button key={im.url} type="button" onClick={() => setIndex(i)} className={clsx("h-16 w-16 overflow-hidden border-2", i === index ? "border-black" : "border-transparent opacity-60")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function Gallery({ images, variant, badge }: { images: Img[]; variant: ThemeKey; badge?: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const on = () => setActive(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);

  const rounded = variant === "pulse" ? "rounded-theme-lg" : variant === "arena" ? "rounded-theme-lg" : "";

  // Mobil: her temada yatay kaydırmalı galeri
  const mobile = (
    <div className="relative md:hidden">
      <div ref={track} className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto">
        {images.map((im, i) => (
          <button key={im.url} type="button" onClick={() => setZoom(i)} className="aspect-square w-full shrink-0 snap-center bg-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.url} alt={im.alt ?? ""} className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
          </button>
        ))}
      </div>
      {badge && <div className="absolute left-0 top-3">{badge}</div>}
      <div className="mt-3 flex justify-center gap-1.5">
        {images.map((im, i) => (
          <span key={im.url} className={clsx("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-fg" : "w-1.5 bg-line")} />
        ))}
      </div>
    </div>
  );

  let desktop: React.ReactNode;
  if (variant === "urban") {
    desktop = (
      <div className="relative hidden grid-cols-2 gap-2 md:grid">
        {images.map((im, i) => (
          <button key={im.url} type="button" onClick={() => setZoom(i)} className={clsx("group relative aspect-square overflow-hidden bg-soft", i === 0 && images.length % 2 === 1 && "col-span-2 aspect-[2/1.1]")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.url} alt={im.alt ?? ""} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading={i < 2 ? "eager" : "lazy"} />
          </button>
        ))}
        {badge && <div className="absolute left-3 top-3">{badge}</div>}
      </div>
    );
  } else if (variant === "studio") {
    desktop = (
      <div className="relative hidden space-y-3 md:block">
        {images.map((im, i) => (
          <button key={im.url} type="button" onClick={() => setZoom(i)} className="block aspect-[4/5] w-full overflow-hidden bg-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.url} alt={im.alt ?? ""} className="h-full w-full object-cover" loading={i < 1 ? "eager" : "lazy"} />
          </button>
        ))}
        {badge && <div className="absolute left-3 top-3">{badge}</div>}
      </div>
    );
  } else {
    const thumbsLeft = variant === "arena";
    desktop = (
      <div className={clsx("hidden gap-3 md:flex", thumbsLeft ? "flex-row" : "flex-col")}>
        {thumbsLeft && (
          <div className="flex w-20 shrink-0 flex-col gap-2">
            {images.map((im, i) => (
              <button key={im.url} type="button" onClick={() => setActive(i)} className={clsx("aspect-square overflow-hidden rounded-theme border-2 bg-soft", i === active ? "border-primary" : "border-transparent")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className={clsx("group relative flex-1 overflow-hidden bg-soft", rounded, variant === "neon" ? "aspect-[4/5] ring-1 ring-line" : "aspect-square")}>
          {images.map((im, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={im.url}
              src={im.url}
              alt={im.alt ?? ""}
              className={clsx("absolute inset-0 h-full w-full object-cover transition-opacity duration-300", i === active ? "opacity-100" : "opacity-0")}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}
          {badge && <div className="absolute left-3 top-3 z-10">{badge}</div>}
          <button type="button" onClick={() => setZoom(active)} aria-label="Büyüt" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-black opacity-0 transition-opacity group-hover:opacity-100">
            <Expand size={18} />
          </button>
          <button type="button" aria-label="Önceki görsel" onClick={() => setActive((active - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-black shadow">
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="Sonraki görsel" onClick={() => setActive((active + 1) % images.length)} className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-black shadow">
            <ChevronRight size={20} />
          </button>
        </div>
        {!thumbsLeft && (
          <div className="grid grid-cols-5 gap-2">
            {images.map((im, i) => (
              <button
                key={im.url}
                type="button"
                onClick={() => setActive(i)}
                className={clsx("aspect-square overflow-hidden border-2 bg-soft", variant === "pulse" ? "rounded-2xl" : "", i === active ? (variant === "neon" ? "border-primary" : "border-fg") : "border-transparent opacity-70 hover:opacity-100")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {mobile}
      {desktop}
      {zoom !== null && <Lightbox images={images} index={zoom} setIndex={setZoom} onClose={() => setZoom(null)} />}
    </div>
  );
}
