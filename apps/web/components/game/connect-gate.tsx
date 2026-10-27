"use client";

import Link from "next/link";
import { site } from "@/lib/site";
import { ROBINHOOD_CHAIN, connectWallet, type WalletState } from "@/lib/wallet";
import { PixelIcon } from "@/components/pixel/sprite";
import { barrel, base, logo, logoPalette, roughneck } from "@/components/pixel/sprites";

// The screen in front of /play: connect a wallet on Robinhood Chain, then row out to your rig.

const PLAY_URL = "barrelroyale.io/play";
const OPEN_IN = [
  { name: "MetaMask", href: `https://metamask.app.link/dapp/${PLAY_URL}` },
  { name: "Coinbase Wallet", href: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(`https://${PLAY_URL}`)}` },
  { name: "Trust Wallet", href: `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(`https://${PLAY_URL}`)}` },
];
const INSTALL = [
  { name: "MetaMask", href: "https://metamask.io/download/" },
  { name: "Rabby", href: "https://rabby.io/" },
];

export function ConnectGate({ wallet }: { wallet: WalletState }) {
  const busy = wallet.status === "connecting" || wallet.status === "checking";
  return (
    <div className="sunburst fixed inset-0 grid place-items-center overflow-y-auto px-4 py-10">
      <div className="box flex w-full max-w-md flex-col items-center gap-5 bg-white p-6 text-center sm:p-8">
        <Link href="/" aria-label={`${site.name} home`}>
          <PixelIcon rows={logo} palette={logoPalette} scale={2} className="pixel-sm m-[3px] h-16 w-16" />
        </Link>
        <h2 className="font-display text-3xl font-bold leading-tight">Connect to play</h2>
        <p className="text-brand-ink-2">
          Your wallet is your rig&apos;s key. Connect it on {ROBINHOOD_CHAIN.name} and your rig is saved to your address, ready whenever you come back.
          Connecting is free and sends no transaction.
        </p>
        <PixelIcon rows={roughneck} palette={base} scale={4} />

        {wallet.status === "missing" ? (
          <div className="flex w-full flex-col gap-4">
            <p className="font-bold">Open {site.name} in your wallet app</p>
            <div className="flex flex-wrap justify-center gap-2">
              {OPEN_IN.map((w) => (
                <a key={w.name} href={w.href} className="btn btn-sun">
                  {w.name}
                </a>
              ))}
            </div>
            <p className="text-sm text-brand-ink-2">
              On a computer, add a browser wallet such as{" "}
              {INSTALL.map((w, i) => (
                <span key={w.name}>
                  {i > 0 && " or "}
                  <a href={w.href} target="_blank" rel="noopener" className="font-bold text-brand-sea-deep underline">
                    {w.name}
                  </a>
                </span>
              ))}
              , then reload this page.
            </p>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <p className="font-bold">{wallet.status === "checking" ? "Looking for wallets in this browser…" : "Pick your wallet"}</p>
            <ul className="flex flex-col gap-2" aria-busy={busy}>
              {wallet.wallets.map((w) => {
                const waiting = wallet.status === "connecting" && wallet.walletId === w.id;
                return (
                  <li key={w.id}>
                    <button
                      type="button"
                      className="btn btn-white w-full justify-start gap-3"
                      onClick={() => connectWallet(w.id)}
                      disabled={busy}
                    >
                      {w.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element -- wallets hand over their icon as a data URI
                        <img src={w.icon} alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
                      ) : (
                        <PixelIcon rows={barrel} palette={base} scale={2} className="shrink-0" />
                      )}
                      <span className="flex-1 text-left">{waiting ? `Check ${w.name}…` : w.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {wallet.message && (
          <p role="status" className="pixel-sm bg-brand-sun-pale px-3 py-2 text-sm font-bold">
            {wallet.message}
          </p>
        )}
      </div>
    </div>
  );
}
