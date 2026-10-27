"use client";

import { useState, useSyncExternalStore } from "react";
import { site } from "@/lib/site";
import { patterns, type Spot } from "@/lib/whitelist-rules";

const noop = () => () => {};

type State = { kind: "idle" } | { kind: "busy" } | { kind: "error"; message: string } | { kind: "done"; spot: Spot; existing: boolean };

/** Join form, and once joined: rank, tier, points and a referral link to share. */
export function WhitelistForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  // read from the address bar after hydration; the server render has neither
  const search = useSyncExternalStore(noop, () => window.location.search, () => "");
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const r = new URLSearchParams(search).get("ref")?.toUpperCase() ?? "";
  const ref = patterns.code.test(r) ? r : "";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(["wallet", "x", "email", "website"].map((k) => [k, String(form.get(k) ?? "")]));
    if (!patterns.wallet.test(body.wallet.trim())) return setState({ kind: "error", message: "Enter a wallet address that starts with 0x and has 40 characters after it." });
    if (!patterns.x.test(body.x.trim())) return setState({ kind: "error", message: "Enter your X handle, like @barrelroyale." });
    setState({ kind: "busy" });
    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, ref }),
      });
      const data = await res.json();
      if (!res.ok) return setState({ kind: "error", message: data.error ?? "Something went wrong. Try again." });
      setState({ kind: "done", spot: data.spot, existing: data.existing });
    } catch {
      setState({ kind: "error", message: "Could not reach the server. Check your connection and try again." });
    }
  }

  if (state.kind === "done") {
    const { spot } = state;
    const link = `${origin}/whitelist?ref=${spot.code}`;
    const tweet = `I'm on the ${site.name} whitelist: an offshore drilling game on Robinhood Chain. Join with my link:`;
    return (
      <div className="flex flex-col gap-5">
        <p className="font-display text-2xl font-bold">{state.existing ? "You're already on the list." : "You're on the list!"}</p>
        <dl className="grid grid-cols-3 gap-4 text-center">
          {[
            ["Rank", `#${spot.rank}`, `of ${spot.total}`],
            ["Points", String(spot.points), `${spot.referrals} referrals`],
            ["Tier", spot.tier, "right now"],
          ].map(([k, v, sub]) => (
            <div key={k} className="pixel-sm flex flex-col gap-1 bg-brand-sun-pale p-3">
              <dt className="text-xs font-extrabold uppercase tracking-wide text-brand-ink-2">{k}</dt>
              <dd className="font-display text-xl font-bold leading-tight sm:text-2xl">{v}</dd>
              <dd className="text-xs text-brand-ink-2">{sub}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-2">
          <p className="font-bold">Climb the list: every friend who joins with your link is +5 points.</p>
          <div className="pixel-sm flex items-stretch bg-white">
            <span className="min-w-0 flex-1 truncate px-3 py-2.5 font-mono text-sm">{link}</span>
            <button
              type="button"
              className="border-l-[3px] border-brand-ink bg-brand-sun px-3 font-display text-sm font-bold"
              onClick={async () => {
                await navigator.clipboard.writeText(link).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="btn btn-red" href={`https://x.com/intent/post?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(link)}`} target="_blank" rel="noopener">
              Share on X
            </a>
            <a className="btn btn-white" href={site.links.play}>
              Enter the rig
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="font-display font-bold">Wallet address</span>
        <input name="wallet" required autoComplete="off" spellCheck={false} placeholder="0x…" className="field font-mono" />
        <span className="text-sm text-brand-ink-2">An EVM wallet you&apos;ll mint with on Robinhood Chain. Never share a seed phrase.</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-display font-bold">X handle</span>
        <input name="x" required autoComplete="off" spellCheck={false} placeholder="@yourhandle" className="field" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-display font-bold">
          Email <span className="font-body text-sm font-semibold text-brand-ink-2">(optional, for the mint date)</span>
        </span>
        <input name="email" type="email" autoComplete="email" placeholder="you@example.com" className="field" />
      </label>
      {/* left empty by people; filled in by bots */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {ref && (
        <p className="pixel-sm bg-brand-sun-pale px-3 py-2 text-sm">
          Joining with referral code <b className="font-mono">{ref}</b>
        </p>
      )}
      {state.kind === "error" && (
        <p role="alert" className="pixel-sm bg-[#ffd9d4] px-3 py-2 text-sm font-bold text-[#a22118]">
          {state.message}
        </p>
      )}
      <button type="submit" className="btn btn-red self-start" disabled={state.kind === "busy"}>
        {state.kind === "busy" ? "Joining…" : "Join the whitelist"}
      </button>
    </form>
  );
}
