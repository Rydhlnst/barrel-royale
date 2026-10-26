import { C } from "@/lib/palette";
import { PixelIcon } from "@/components/pixel/sprite";
import { base, roughneck } from "@/components/pixel/sprites";
import { Footer, StickyCta, TopBar } from "@/components/chrome";
import { Dither } from "@/components/ui";
import { Toc, type TocItem } from "./toc";

// Layout and building blocks for the docs, litepaper and roadmap pages.

export function DocPage({
  current,
  eyebrow,
  title,
  lede,
  meta,
  toc,
  children,
}: {
  current: string;
  eyebrow: string;
  title: string;
  lede: string;
  meta?: string[];
  toc?: { title: string; items: TocItem[] };
  children: React.ReactNode;
}) {
  return (
    <>
      <TopBar current={current} />
      <StickyCta />
      <header className="sunburst relative overflow-hidden border-b-[3px] border-brand-ink">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-8 px-4 pt-36 sm:px-8 lg:pt-32">
          <div className="flex max-w-3xl flex-col gap-4 pb-10 sm:pb-14">
            <span className="self-start pixel bg-white px-3 py-1 font-display text-sm font-bold">{eyebrow}</span>
            <h1 className="outlined font-logo text-4xl font-bold uppercase leading-tight sm:text-6xl">{title}</h1>
            <p className="pixel bg-white/90 px-4 py-3 text-base leading-relaxed sm:text-lg">{lede}</p>
            {meta && (
              <div className="flex flex-wrap gap-2">
                {meta.map((m) => (
                  <span key={m} className="pixel-sm bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wide">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
          <PixelIcon rows={roughneck} palette={base} scale={10} className="hidden self-end md:block" />
        </div>
      </header>
      <Dither from={C.sunDeep} to={C.sky} />
      <main className="bg-brand-sky px-4 pb-24 pt-10 sm:px-8">
        {/* minmax(0, 1fr) keeps the scrolling chip row of the section list from widening the page on phones */}
        <div className={`mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-10 ${toc ? "lg:grid-cols-[260px_minmax(0,1fr)]" : ""}`}>
          {toc && (
            <aside className="min-w-0">
              <Toc title={toc.title} items={toc.items} />
            </aside>
          )}
          <article className={`doc-prose min-w-0 ${toc ? "max-w-3xl" : ""}`}>{children}</article>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="note">
      <b>{title}</b> {children}
    </div>
  );
}

export function Formula({ children }: { children: React.ReactNode }) {
  return <div className="formula">{children}</div>;
}

export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
