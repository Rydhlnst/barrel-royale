import type { Metadata } from "next";
import { C } from "@/lib/palette";
import { site } from "@/lib/site";
import { POINTS_JOIN, POINTS_REFERRAL, tiers } from "@/lib/whitelist-rules";
import { PixelIcon } from "@/components/pixel/sprite";
import { base, crownBarrel, icons, roughneck, xMark } from "@/components/pixel/sprites";
import { Footer, StickyCta, TopBar } from "@/components/chrome";
import { Dither } from "@/components/ui";
import { WhitelistForm } from "@/components/whitelist-form";

export const metadata: Metadata = {
  title: `Whitelist · ${site.name}`,
  description: `Join the ${site.name} whitelist: a guaranteed spot in the rig mint for the top roughnecks, early alpha access, and +${POINTS_REFERRAL} points for every friend you bring.`,
};

const quests = [
  { icon: crownBarrel, title: "Join the list", points: `+${POINTS_JOIN}`, body: "Your wallet and X handle. One spot per wallet and per X account." },
  { icon: icons.hardHat, title: "Bring your crew", points: `+${POINTS_REFERRAL} each`, body: "Share your referral link. Every friend who joins with it moves you up." },
  { icon: xMark, title: "Follow and post", points: "+5", body: "Follow the X account and post your link. Checked by the team before the snapshot." },
  { icon: icons.derrick, title: "Spread the word", points: "+5", body: "Repost the launch post from @barrelroyale. Checked by the team before the snapshot." },
];

const steps = [
  { title: "Join", body: "Sign up with your wallet and X handle and get your referral link." },
  { title: "Climb", body: "Bring friends and complete quests. Your rank updates as people join." },
  { title: "Snapshot", body: "On snapshot day, announced on X a week ahead, the list freezes and tiers are set by rank." },
  { title: "Mint", body: "OG Roughnecks mint first, then Crew, then the public mint opens." },
];

const faq = [
  ["Does joining cost anything?", "No. Joining is free and needs no transaction."],
  ["Can I use more than one wallet?", "One spot per wallet and per X account keeps the list fair. Duplicate and bot entries are removed before the snapshot."],
  ["What does a whitelist spot give me?", `Early access to the rig mint and the alpha, in the order of your tier. Once you hold a rig, ${site.reward} rewards follow the rules in the docs.`],
  ["When is the snapshot?", "It will be announced on X at least a week ahead."],
];

export default function Whitelist() {
  return (
    <>
      <TopBar current={site.links.whitelist} />
      <StickyCta />
      <main>
        <section className="sunburst relative overflow-hidden px-4 pb-16 pt-36 sm:px-8 lg:pt-32">
          <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[1fr_minmax(0,520px)]">
            <div className="flex flex-col gap-5">
              <span className="pixel-sm self-start bg-white px-3 py-1 font-display text-sm font-bold">Whitelist · pre-launch</span>
              <h1 className="outlined font-logo text-4xl font-bold uppercase leading-tight sm:text-6xl">Claim your spot on the rig</h1>
              <p className="pixel max-w-xl bg-white/90 px-4 py-3 text-lg leading-relaxed">
                {site.name} is building its crew before launch. Join the whitelist, bring your friends, and the top roughnecks get a guaranteed spot in
                the rig mint and the first look at the alpha.
              </p>
              <PixelIcon rows={roughneck} palette={base} scale={10} className="mt-2 hidden lg:block" />
            </div>
            <div className="box p-6 sm:p-8">
              <WhitelistForm />
            </div>
          </div>
        </section>
        <Dither from={C.sunDeep} to={C.sky} />

        <section id="tiers" className="scroll-mt-24 bg-brand-sky px-4 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <p className="font-display text-lg font-bold text-brand-red">Tiers at snapshot</p>
            <h2 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Rank decides your tier</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {tiers.map((t, i) => (
                <article key={t.name} className={`box flex flex-col gap-3 p-6 ${i === 0 ? "bg-brand-sun!" : ""}`}>
                  <span className="pixel-sm self-start bg-white px-2.5 text-xs font-extrabold uppercase tracking-wide">
                    {i === 0 ? `Top ${t.upTo}` : t.upTo === Infinity ? `Rank ${tiers[i - 1].upTo + 1}+` : `Rank ${tiers[i - 1].upTo + 1}–${t.upTo}`}
                  </span>
                  <h3 className="font-display text-3xl font-bold">{t.name}</h3>
                  <ul className="flex flex-col gap-2">
                    {t.perks.map((p) => (
                      <li key={p} className="flex gap-3">
                        <span aria-hidden className="pixel-sm mt-1.5 h-3 w-3 shrink-0 bg-brand-red" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Dither from={C.sky} to={C.sunPale} />
        <section className="bg-brand-sun-pale px-4 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <p className="font-display text-lg font-bold text-brand-red">Quests</p>
            <h2 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Ways to climb</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {quests.map((q) => (
                <article key={q.title} className="box flex flex-col gap-3 p-6">
                  <div className="flex items-start justify-between">
                    <PixelIcon rows={q.icon} palette={base} scale={4} />
                    <span className="pixel-sm bg-brand-sun px-2.5 font-display font-bold">{q.points}</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold">{q.title}</h3>
                  <p className="text-brand-ink-2">{q.body}</p>
                </article>
              ))}
            </div>
            <ol className="mt-14 grid gap-6 md:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex flex-col gap-2">
                  <span className="pixel grid h-12 w-12 place-items-center bg-brand-red font-display text-xl font-bold text-white">{i + 1}</span>
                  <h3 className="mt-2 font-display text-xl font-bold">{s.title}</h3>
                  <p className="text-brand-ink-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Dither from={C.sunPale} to={C.sky} />
        <section className="bg-brand-sky px-4 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-4xl font-bold">FAQ</h2>
            <div className="mt-8 flex flex-col gap-5">
              {faq.map(([q, a]) => (
                <details key={q} className="box group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-bold">
                    {q}
                    <span aria-hidden className="font-display text-2xl text-brand-red group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-brand-ink-2">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
