"use client";

import { useState } from "react";
import { site } from "@/lib/site";

// A live $ROYAL chart from GMGN in the corner of the rig, framed like the rest of the HUD. It folds down to a
// small button so it never sits in the way of the deck; the choice is remembered on this device.

const OPEN_KEY = "barrel-royale-chart-open";
const GMGN_CHAIN = "robinhood";

function initialOpen() {
  try {
    const saved = localStorage.getItem(OPEN_KEY);
    if (saved !== null) return saved === "1";
  } catch {
    // storage can be blocked; fall back to the screen size
  }
  return window.matchMedia("(min-width: 1024px)").matches;
}

export function RoyalChart({ hidden }: { hidden: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  if (!site.ca || hidden) return null;

  const toggle = (next: boolean) => {
    setOpen(next);
    try {
      localStorage.setItem(OPEN_KEY, next ? "1" : "0");
    } catch {
      // not remembered, still works for this visit
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => toggle(true)}
        className="btn btn-sun pointer-events-auto absolute bottom-6 right-6 z-[15] min-h-10! px-3! text-base!"
        aria-label={`Show the ${site.token} chart`}
      >
        {site.token} chart
      </button>
    );
  }

  return (
    <section
      aria-label={`${site.token} chart`}
      className="box pointer-events-auto absolute inset-x-3 bottom-3 z-[15] flex flex-col overflow-hidden lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[380px]"
    >
      <header className="flex items-center gap-2 border-b-[3px] border-brand-ink bg-brand-sun px-3 py-1.5">
        <h2 className="font-logo text-base font-bold uppercase">{site.token}</h2>
        <span className="font-display text-sm font-bold text-brand-ink-2">live chart</span>
        <a
          href={`https://gmgn.ai/${GMGN_CHAIN}/token/${site.ca}`}
          target="_blank"
          rel="noopener"
          className="ml-auto font-display text-sm font-bold text-brand-sea-deep underline"
        >
          Trade on GMGN
        </a>
        <button type="button" onClick={() => toggle(false)} className="btn btn-white min-h-8! px-2! text-sm!" aria-label="Fold the chart away">
          ▾
        </button>
      </header>
      <iframe
        title={`${site.token} price chart on GMGN`}
        src={`https://www.gmgn.cc/kline/${GMGN_CHAIN}/${site.ca}?theme=light&interval=15`}
        className="block h-[240px] w-full border-0 bg-white lg:h-[260px]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </section>
  );
}
