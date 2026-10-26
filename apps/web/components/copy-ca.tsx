"use client";

import { useState } from "react";
import { site } from "@/lib/site";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** The $ROYAL contract address with a copy button, or a "soon" chip before launch. */
export function CopyCa({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const ca = site.ca;

  async function copy() {
    if (!ca) return;
    try {
      await navigator.clipboard.writeText(ca);
    } catch {
      // older browsers and insecure origins: select-and-copy fallback
      const t = document.createElement("textarea");
      t.value = ca;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={`pixel pixel-drop m-1 inline-flex max-w-full items-stretch bg-white ${className}`}>
      <span className="flex items-center bg-brand-ink px-3 font-display text-sm font-bold text-brand-sun">CA</span>
      {ca ? (
        <>
          <a
            href={`${site.explorer}/address/${ca}`}
            target="_blank"
            rel="noopener"
            className="flex min-w-0 items-center px-3 font-mono text-sm font-bold hover:text-brand-red"
            title={ca}
          >
            <span className="sm:hidden">{short(ca)}</span>
            <span className="hidden truncate sm:inline">{ca}</span>
          </a>
          <button
            type="button"
            onClick={copy}
            className="border-l-[3px] border-brand-ink bg-brand-sun px-3 font-display text-sm font-bold hover:bg-brand-sun-deep"
            aria-live="polite"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </>
      ) : (
        <span className="flex items-center px-3 py-2 font-display text-sm font-bold whitespace-nowrap text-brand-ink-2">
          {site.token}
          <span className="hidden sm:inline">&nbsp;contract</span>&nbsp;· posted at launch
        </span>
      )}
    </div>
  );
}
