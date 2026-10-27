"use client";

import Link from "next/link";
import { site } from "@/lib/site";
import { ROBINHOOD_CHAIN, connectWallet, disconnectWallet, shortAddress, type WalletState } from "@/lib/wallet";
import type { HolderState } from "@/lib/holder";
import { PixelIcon } from "@/components/pixel/sprite";
import { barrel, base, logo, logoPalette, roughneck } from "@/components/pixel/sprites";

// The screens in front of /play: connect a wallet on Robinhood Chain and, once $ROYAL is live, hold
// enough $ROYAL; then row out to your rig.

const PLAY_URL = "barrelroyale.io/play";
const OPEN_IN = [
  { name: "MetaMask", href: `https://metamask.app.link/dapp/${PLAY_URL}` },
  {
    name: "Coinbase Wallet",
    href: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(`https://${PLAY_URL}`)}`,
  },
  {
    name: "Trust Wallet",
    href: `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(`https://${PLAY_URL}`)}`,
  },
];
const INSTALL = [
  { name: "MetaMask", href: "https://metamask.io/download/" },
  { name: "Rabby", href: "https://rabby.io/" },
];

const fmtRoyal = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

function GateFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sunburst fixed inset-0 grid place-items-center overflow-y-auto px-4 py-10">
      <div className="box flex w-full max-w-md flex-col items-center gap-5 bg-white p-6 text-center sm:p-8">
        <Link href="/" aria-label={`${site.name} home`}>
          <PixelIcon rows={logo} palette={logoPalette} scale={2} className="pixel-sm m-[3px] h-16 w-16" />
        </Link>
        <h2 className="font-display text-3xl font-bold leading-tight">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function ConnectGate({ wallet }: { wallet: WalletState }) {
  const busy = wallet.status === "connecting" || wallet.status === "checking";
  return (
    <GateFrame title="Connect to play">
      <p className="text-brand-ink-2">
        Your wallet is your rig&apos;s key. Connect it on {ROBINHOOD_CHAIN.name} and your rig is saved to your address, ready whenever you come back.
        {site.ca ? ` The rig opens for ${site.token} holders.` : ""} Connecting is free and sends no transaction.
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
                  <button type="button" className="btn btn-white w-full justify-start gap-3" onClick={() => connectWallet(w.id)} disabled={busy}>
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
    </GateFrame>
  );
}

/** Shown to a connected wallet while its $ROYAL balance is read, and when it holds less than the minimum. */
export function HolderGate({ account, holder, recheck }: { account: string; holder: HolderState; recheck: () => void }) {
  const getUrl = site.buyUrl ?? (site.ca ? `${site.explorer}/token/${site.ca}` : site.links.docs);
  return (
    <GateFrame title={holder.status === "checking" ? "Checking your rig pass" : `Hold ${site.token} to play`}>
      <p className="text-brand-ink-2">
        The rig opens for {site.token} holders: hold at least {fmtRoyal(site.minHold)} {site.token} in your wallet and you are on deck.
      </p>
      <PixelIcon rows={barrel} palette={base} scale={4} />
      <p className="pixel-sm w-full bg-brand-sun-pale px-3 py-2 text-sm">
        <span className="font-mono font-bold">{shortAddress(account)}</span>
        {holder.status === "checking" && " · reading your balance…"}
        {holder.status === "short" && ` · holds ${fmtRoyal(holder.balance)} ${site.token}`}
      </p>
      {holder.status === "error" && (
        <p role="status" className="text-sm font-bold">
          {holder.message}
        </p>
      )}
      <div className="flex w-full flex-col gap-2">
        <a href={getUrl} target="_blank" rel="noopener" className="btn btn-red w-full justify-center">
          Get {site.token}
        </a>
        <button type="button" className="btn btn-white w-full justify-center" onClick={recheck} disabled={holder.status === "checking"}>
          Check again
        </button>
        <button type="button" className="text-sm font-bold text-brand-sea-deep underline" onClick={disconnectWallet}>
          Use another wallet
        </button>
      </div>
    </GateFrame>
  );
}
