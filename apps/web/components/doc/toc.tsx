"use client";

import { useEffect, useState } from "react";

export type TocItem = { id: string; label: string };

/** Sticky section list that highlights the section in view. */
export function Toc({ title, items }: { title: string; items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const first = items.find((i) => seen.get(i.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-120px 0px -55% 0px" },
    );
    for (const i of items) {
      const el = document.getElementById(i.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [items]);

  return (
    <nav aria-label={`${title} sections`} className="box flex flex-col gap-1 p-4 lg:sticky lg:top-6">
      <p className="mb-1 font-display text-xl font-bold text-brand-red">{title}</p>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 py-1 whitespace-nowrap lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0 lg:pb-0 lg:whitespace-normal">
        {items.map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            aria-current={active === i.id ? "true" : undefined}
            className="pixel-sm px-2.5 py-1.5 text-sm font-bold [--pxc:rgb(30_42_74/0.15)] hover:bg-brand-sun-pale aria-[current=true]:bg-brand-sun aria-[current=true]:[--pxc:var(--color-brand-ink)] lg:[--pxc:transparent] lg:aria-[current=true]:[--pxc:var(--color-brand-ink)]"
          >
            {i.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
