import { site } from "@/lib/site";

// Robinhood Chain, and the $ROYAL balance read straight from its public RPC. Plain functions with no
// browser APIs, so both the /play holder check and the village's server routes can use them.

export const ROBINHOOD_CHAIN = {
  id: 4663,
  hex: "0x1237",
  name: "Robinhood Chain",
  rpc: "https://rpc.mainnet.chain.robinhood.com",
  explorer: site.explorer,
};

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
