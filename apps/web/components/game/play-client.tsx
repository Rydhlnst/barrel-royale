"use client";

import dynamic from "next/dynamic";
import { useHolder } from "@/lib/holder";
import { disconnectWallet, useWallet } from "@/lib/wallet";
import { ConnectGate, HolderGate } from "./connect-gate";

// The game reads the browser's save and runs Phaser, so it renders only on the client.
const Play = dynamic(() => import("./play"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 grid place-items-center bg-brand-sea">
      <p className="outlined-sm font-logo text-2xl font-bold uppercase">Rowing out to your rig…</p>
    </div>
  ),
});

/** /play opens once a wallet is connected and, once $ROYAL is live, holds enough $ROYAL. Each wallet keeps its own rig. */
export function PlayClient() {
  const wallet = useWallet();
  const account = wallet.status === "connected" ? wallet.account : null;
  const { holder, recheck } = useHolder(account);
  if (!account) return <ConnectGate wallet={wallet} />;
  if (holder.status !== "off" && holder.status !== "holder") return <HolderGate account={account} holder={holder} recheck={recheck} />;
  return <Play key={account.toLowerCase()} account={account} onDisconnect={disconnectWallet} />;
}
