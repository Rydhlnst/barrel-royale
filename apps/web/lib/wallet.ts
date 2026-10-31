"use client";

import { useSyncExternalStore } from "react";
import { ROBINHOOD_CHAIN } from "@/lib/chain";

// The browser wallets behind /play. Every installed wallet is found through EIP-6963 (each one announces
// its name and icon), with window.ethereum as a fallback for older wallets and in-app wallet browsers.
// The player picks one; it is moved to Robinhood Chain on connect. Connecting only shares the address
// and sends no transaction.

type Eip1193 = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, fn: (...args: unknown[]) => void): void;
  removeListener?(event: string, fn: (...args: unknown[]) => void): void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  isTrust?: boolean;
  isBraveWallet?: boolean;
  isOkxWallet?: boolean;
};

/** A wallet found in this browser. `id` is stable across visits (the EIP-6963 rdns, or "injected"). */
export type DetectedWallet = { id: string; name: string; icon: string | null; provider: Eip1193 };

type AnnounceEvent = CustomEvent<{ info: { uuid: string; name: string; icon: string; rdns: string }; provider: Eip1193 }>;

export { ROBINHOOD_CHAIN };

export type WalletState = {
  /** checking: still listening for wallets. idle: wallets found, none connected. missing: no wallet in this browser. */
  status: "checking" | "idle" | "connecting" | "connected" | "missing";
  wallets: DetectedWallet[];
  account: string | null;
  walletId: string | null;
  message: string | null;
};

const REMEMBER = "barrel-royale-wallet";
const DETECT_MS = 600;

let state: WalletState = { status: "checking", wallets: [], account: null, walletId: null, message: null };
let started = false;
let active: DetectedWallet | null = null;
const listeners = new Set<() => void>();

const set = (patch: Partial<WalletState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

const remembered = () => {
  try {
    return localStorage.getItem(REMEMBER);
  } catch {
    return null;
  }
};
const remember = (id: string | null) => {
  try {
    if (id) localStorage.setItem(REMEMBER, id);
    else localStorage.removeItem(REMEMBER);
  } catch {
    // private windows can refuse storage; the player just picks the wallet again next time
  }
};

/** Name a plain window.ethereum wallet from the flags wallets set on it. */
function injectedName(p: Eip1193) {
  if (p.isRabby) return "Rabby";
  if (p.isCoinbaseWallet) return "Coinbase Wallet";
  if (p.isTrust) return "Trust Wallet";
  if (p.isOkxWallet) return "OKX Wallet";
  if (p.isBraveWallet) return "Brave Wallet";
  if (p.isMetaMask) return "MetaMask";
  return "Browser wallet";
}

function addWallet(w: DetectedWallet) {
  // one entry per provider: an EIP-6963 announcement replaces the plain window.ethereum entry for the same wallet
  const wallets = state.wallets.filter((x) => x.id !== w.id && x.provider !== w.provider);
  set({ wallets: [...wallets, w], ...(state.status === "missing" ? { status: "idle" as const } : {}) });
}

const onAccountsChanged = (accounts: unknown) => {
  const account = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null;
  if (account) set({ status: "connected", account });
  else forget();
};

function attach(w: DetectedWallet, account: string) {
  active?.provider.removeListener?.("accountsChanged", onAccountsChanged);
  active = w;
  w.provider.on?.("accountsChanged", onAccountsChanged);
  set({ status: "connected", account, walletId: w.id, message: null });
}

function forget() {
  active?.provider.removeListener?.("accountsChanged", onAccountsChanged);
  active = null;
  remember(null);
  set({ status: state.wallets.length ? "idle" : "missing", account: null, walletId: null });
}

/** Listen for wallets, then reconnect the one the player used last time, without a prompt. */
function start() {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("eip6963:announceProvider", (e) => {
    const { info, provider } = (e as AnnounceEvent).detail;
    addWallet({ id: info.rdns || info.uuid, name: info.name, icon: info.icon || null, provider });
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  setTimeout(async () => {
    const injected = (window as unknown as { ethereum?: Eip1193 }).ethereum;
    if (injected && !state.wallets.some((w) => w.provider === injected)) {
      addWallet({ id: "injected", name: injectedName(injected), icon: null, provider: injected });
    }
    const last = remembered();
    const w = state.wallets.find((x) => x.id === last);
    if (w) {
      try {
        const accounts = await w.provider.request({ method: "eth_accounts" });
        if (Array.isArray(accounts) && typeof accounts[0] === "string") return attach(w, accounts[0]);
      } catch {
        // the wallet is locked or gone; fall through to the picker
      }
    }
    set({ status: state.wallets.length ? "idle" : "missing" });
  }, DETECT_MS);
}

async function switchToRobinhood(p: Eip1193) {
  try {
    await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ROBINHOOD_CHAIN.hex }] });
  } catch (e) {
    if ((e as { code?: number }).code !== 4902) return;
    await p
      .request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ROBINHOOD_CHAIN.hex,
            chainName: ROBINHOOD_CHAIN.name,
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: [ROBINHOOD_CHAIN.rpc],
            blockExplorerUrls: [ROBINHOOD_CHAIN.explorer],
          },
        ],
      })
      .catch(() => {});
  }
}

export async function connectWallet(id: string) {
  const w = state.wallets.find((x) => x.id === id);
  if (!w) return;
  set({ status: "connecting", walletId: id, message: null });
  try {
    const accounts = await w.provider.request({ method: "eth_requestAccounts" });
    const account = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null;
    if (!account) throw Object.assign(new Error("No account"), { code: -1 });
    await switchToRobinhood(w.provider);
    remember(w.id);
    attach(w, account);
  } catch (e) {
    const code = (e as { code?: number }).code;
    set({
      status: "idle",
      walletId: null,
      message: code === 4001 ? `The ${w.name} request was closed. Pick a wallet to try again.` : `${w.name} did not answer. Open it and pick it again.`,
    });
  }
}

/** Asks the connected wallet to sign a plain-text message (personal_sign). Signing is free and sends no transaction. */
export async function signMessage(message: string) {
  if (!active || !state.account) throw new Error("Connect your wallet first.");
  const hex = "0x" + Array.from(new TextEncoder().encode(message), (b) => b.toString(16).padStart(2, "0")).join("");
  const signature = await active.provider.request({ method: "personal_sign", params: [hex, state.account] });
  if (typeof signature !== "string") throw new Error("The wallet did not return a signature.");
  return signature;
}

/** Sends a transaction from the connected wallet on Robinhood Chain; returns its hash. The wallet shows it first. */
export async function sendTransaction(tx: { to: string; data: string }) {
  if (!active || !state.account) throw new Error("Connect your wallet first.");
  await switchToRobinhood(active.provider);
  const hash = await active.provider.request({ method: "eth_sendTransaction", params: [{ from: state.account, to: tx.to, data: tx.data, value: "0x0" }] });
  if (typeof hash !== "string") throw new Error("The wallet did not send the transaction.");
  return hash;
}

/** Forget the wallet on this site; the next visit shows the picker again. */
export const disconnectWallet = forget;

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  start();
  return () => listeners.delete(fn);
};
const serverState: WalletState = { status: "checking", wallets: [], account: null, walletId: null, message: null };

export function useWallet() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}

export const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
