"use client";

import { useCallback, useEffect, useState } from "react";
import { encodeFunctionData, parseAbi } from "viem";
import { site } from "@/lib/site";
import { CONTRACTS } from "@/lib/contracts";
import { OIL_BONUS } from "@/lib/game/content";
import { bonusMessage, type BonusStatus } from "@/lib/bonus-rules";
import { sendTransaction, signMessage } from "@/lib/wallet";

// The Oil Bonus panel: sign up once with a free signature, wait for a weekly vault round, then claim the XOM
// to your wallet with one transaction. The status comes from /api/bonus, which reads the queue and the vault.

const CLAIM = parseAbi(["function claim(uint256 week, uint256 amount, bytes32[] proof)"]);
const usd = `$${OIL_BONUS.usd.toFixed(2)}`;
const day = (ms: number) => new Date(ms).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" }) + " UTC";

/** The wallet's Oil Bonus status, fetched on mount; null while loading or when the bonus is offline. */
export function useBonus(wallet: string) {
  const [status, setStatus] = useState<BonusStatus | null>(null);
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/bonus?wallet=${wallet}`, { cache: "no-store" });
      if (res.ok) setStatus((await res.json()) as BonusStatus);
    } catch {
      // the panel shows nothing new; the next refresh tries again
    }
  }, [wallet]);
  useEffect(() => {
    // first read on mount; refresh() only sets state after the fetch resolves
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);
  return { status, setStatus, refresh };
}

/** Whether the HUD button should wave for attention: not signed up yet, or ready to claim. */
export const bonusWaiting = (s: BonusStatus | null) => s?.state === "open" || s?.state === "claimable";

export function BonusPanel({ wallet, bonus }: { wallet: string; bonus: ReturnType<typeof useBonus> }) {
  const { status, setStatus, refresh } = bonus;
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const signUp = async () => {
    setBusy(true);
    setNote(null);
    const issued = new Date().toISOString();
    let signature = "dev";
    if (!site.devOpenPlay) {
      try {
        signature = await signMessage(bonusMessage(wallet, issued));
      } catch {
        setBusy(false);
        return setNote("The signature was cancelled. Sign to join the line.");
      }
    }
    try {
      const res = await fetch("/api/bonus", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ wallet, issued, signature }) });
      const json = await res.json();
      if (!res.ok) setNote(String(json.error ?? "Could not sign you up. Try again."));
      else setStatus(json as BonusStatus);
    } catch {
      setNote("Could not reach the rig office. Try again.");
    }
    setBusy(false);
  };

  const claim = async () => {
    if (status?.state !== "claimable") return;
    setBusy(true);
    setNote(null);
    try {
      const data = encodeFunctionData({ abi: CLAIM, functionName: "claim", args: [BigInt(status.week), BigInt(status.amount), status.proof as `0x${string}`[]] });
      await sendTransaction({ to: CONTRACTS.vault, data });
      setNote(`Sent! Your ${site.reward} lands in your wallet in a few seconds.`);
      setTimeout(() => void refresh(), 8_000);
    } catch {
      setNote("The transaction was cancelled. Claim again whenever you like.");
    }
    setBusy(false);
  };

  return (
    <>
      <p className="text-sm text-brand-ink-2">
        Every holder wallet gets a one-time bonus of {usd} in {site.reward}, {OIL_BONUS.xom} {site.reward}, paid from the reward vault straight to your wallet.
      </p>
      <ol className="flex flex-col gap-1.5 text-sm">
        <li className="pixel-sm bg-white px-3 py-2">1. Sign up with a free signature. No transaction.</li>
        <li className="pixel-sm bg-white px-3 py-2">2. Each weekly vault round pays the next wallets in line.</li>
        <li className="pixel-sm bg-white px-3 py-2">3. Two days after your round is posted, claim it to your wallet.</li>
      </ol>

      {status === null && <p className="pixel-sm bg-brand-sun-pale px-3 py-3 text-center font-bold">Checking your bonus…</p>}
      {status?.state === "open" && (
        <button type="button" className="btn btn-red" disabled={busy} onClick={signUp}>
          {busy ? "Signing…" : `Sign up for ${usd} ${site.reward}`}
        </button>
      )}
      {status?.state === "queued" && (
        <p className="pixel-sm bg-brand-sun-pale px-3 py-3 text-center font-bold">
          You&apos;re in line: number {status.place}. The next weekly round pays the wallets at the front.
        </p>
      )}
      {status?.state === "posting" && <p className="pixel-sm bg-brand-sun-pale px-3 py-3 text-center font-bold">You&apos;re in this week&apos;s round. It&apos;s being posted to the vault now.</p>}
      {status?.state === "posted" && <p className="pixel-sm bg-brand-sun-pale px-3 py-3 text-center font-bold">Your round is posted. Claim opens {day(status.opensAt)}.</p>}
      {status?.state === "claimable" && (
        <button type="button" className="btn btn-red" disabled={busy} onClick={claim}>
          {busy ? "Check your wallet…" : `Claim ${OIL_BONUS.xom} ${site.reward} to your wallet`}
        </button>
      )}
      {status?.state === "claimed" && <p className="pixel-sm bg-[#d8f3e6] px-3 py-3 text-center font-bold">Paid! Your Oil Bonus is in your wallet.</p>}
      {status?.state === "expired" && <p className="pixel-sm bg-white px-3 py-3 text-center font-bold">Your round&apos;s claim window has closed.</p>}
      {note && (
        <p role="status" className="text-sm font-bold">
          {note}
        </p>
      )}
    </>
  );
}
