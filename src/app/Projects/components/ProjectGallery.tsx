"use client";

import { useEffect, useState } from "react";

type props = {
    name: string;
    images: string[];
  };

  // Photo grid; clicking a photo opens it full size, arrow keys flip through, Esc closes
  export default function ProjectGallery({ name, images }: props) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const showPrevious = () =>
      setOpenIndex((index) => index === null ? null : (index - 1 + images.length) % images.length);
    const showNext = () =>
      setOpenIndex((index) => index === null ? null : (index + 1) % images.length);

    useEffect(() => {
      if (openIndex === null) return;

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") setOpenIndex(null);
        if (event.key === "ArrowLeft") showPrevious();
        if (event.key === "ArrowRight") showNext();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    });

    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <button
              key={image}
              onClick={() => setOpenIndex(index)}
              className={`group overflow-hidden rounded-xl border border-border bg-surface ${
                // A lone photo, or the first of an odd number, spans the full width
                index === 0 && images.length % 2 === 1 ? "sm:col-span-2" : ""
              }`}
            >
              <img
                src={image}
                alt={`${name} screenshot ${index + 1}`}
                className="mx-auto max-h-[480px] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </button>
          ))}
        </div>

        {openIndex !== null && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${name} photo ${openIndex + 1} of ${images.length}`}
            onClick={() => setOpenIndex(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-10"
          >
            <img
              src={images[openIndex]}
              alt={`${name} screenshot ${openIndex + 1}`}
              onClick={(event) => event.stopPropagation()}
              className="max-h-full max-w-full rounded-lg object-contain"
            />

            <button
              onClick={() => setOpenIndex(null)}
              aria-label="Close"
              className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={(event) => { event.stopPropagation(); showPrevious(); }}
                  aria-label="Previous photo"
                  className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={(event) => { event.stopPropagation(); showNext(); }}
                  aria-label="Next photo"
                  className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
                <span className="absolute bottom-4 text-sm text-white/80">
                  {openIndex + 1} / {images.length}
                </span>
              </>
            )}
          </div>
        )}
      </>
  )
}
