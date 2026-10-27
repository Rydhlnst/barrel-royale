"use client";

import { useCallback, useEffect, useState } from "react";
import { site } from "@/lib/site";
import { ROBINHOOD_CHAIN } from "@/lib/wallet";

// The $ROYAL holder check for /play. It reads the token balance straight from Robinhood Chain's public
// RPC, so it does not depend on which network the player's wallet is set to. Until the CA is set the
// check is off and every connected wallet plays.

export type HolderState =
  | { status: "off" }
  | { status: "checking" }
  | { status: "holder" | "short"; balance: number }
  | { status: "error"; message: string };

async function rpc(method: string, params: unknown[]) {
  const res = await fetch(ROBINHOOD_CHAIN.rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = (await res.json()) as { result?: string; error?: { message: string } };
  if (json.error || !json.result) throw new Error(json.error?.message ?? "No answer from Robinhood Chain");
  return json.result;
}

const call = (to: string, data: string) => rpc("eth_call", [{ to, data }, "latest"]);

/** The wallet's $ROYAL balance in whole tokens. */
export async function royalBalance(token: string, account: string) {
  const padded = account.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const [raw, dec] = await Promise.all([call(token, `0x70a08231${padded}`), call(token, "0x313ce567")]);
  const decimals = Number(BigInt(dec));
  const units = BigInt(raw);
  const scale = BigInt(10) ** BigInt(decimals);
  // whole part plus four decimals is plenty for a hold threshold
  return Number(units / scale) + Number((units % scale) * BigInt(10_000) / scale) / 10_000;
}

export function useHolder(account: string | null) {
  const [state, setState] = useState<HolderState>(() => (site.ca ? { status: "checking" } : { status: "off" }));

  const check = useCallback(async () => {
    if (!site.ca || !account) return;
    setState({ status: "checking" });
    try {
      const balance = await royalBalance(site.ca, account);
      setState({ status: balance >= site.minHold ? "holder" : "short", balance });
    } catch {
      setState({ status: "error", message: `Could not read your ${site.token} balance. Check your connection and try again.` });
    }
  }, [account]);

  useEffect(() => {
    // read the balance from the chain whenever the connected wallet changes
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the effect starts an async read from Robinhood Chain
    void check();
  }, [check]);

  return { holder: state, recheck: check };
}
