"use client";

import dynamic from "next/dynamic";
import { disconnectWallet, useWallet } from "@/lib/wallet";
import { ConnectGate } from "./connect-gate";

// The game reads the browser's save and runs Phaser, so it renders only on the client.
const Play = dynamic(() => import("./play"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 grid place-items-center bg-brand-sea">
      <p className="outlined-sm font-logo text-2xl font-bold uppercase">Rowing out to your rig…</p>
    </div>
  ),
});

/** /play opens once a wallet is connected; each wallet keeps its own rig. */
export function PlayClient() {
  const wallet = useWallet();
  if (wallet.status !== "connected" || !wallet.account) return <ConnectGate wallet={wallet} />;
  return <Play key={wallet.account.toLowerCase()} account={wallet.account} onDisconnect={disconnectWallet} />;
}
