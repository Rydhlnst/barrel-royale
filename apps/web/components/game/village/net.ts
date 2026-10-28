import { site } from "@/lib/site";
import { signMessage } from "@/lib/wallet";
import { VILLAGE, villageMessage } from "@/lib/village-rules";

// The village's line to the server. Holds the session token (saved per wallet for a day), reports this
// player's position on a timer and keeps who else is here and the chat for the scene and the React overlay.

export type Other = { wallet: string; x: number; y: number; facing: number; moving: boolean; level: number; at: number };
export type Line = { id: number; wallet: string; body: string; at: number };

export type NetState = {
  /** sign: waiting for the player to sign in. entering: signing or checking. live: in the village. away: paused while idle. */
  status: "sign" | "entering" | "live" | "away" | "closed" | "error";
  error: string | null;
  online: number;
  chat: Line[];
  you: string;
};

type Saved = { token: string; expires: number };
const keyFor = (wallet: string) => `barrel-royale-village:${wallet.toLowerCase()}`;

function loadSaved(wallet: string): Saved | null {
  try {
    const raw = localStorage.getItem(keyFor(wallet));
    const s = raw ? (JSON.parse(raw) as Saved) : null;
    return s && s.expires > Date.now() + 60_000 ? s : null;
  } catch {
    return null;
  }
}

function save(wallet: string, s: Saved | null) {
  try {
    if (s) localStorage.setItem(keyFor(wallet), JSON.stringify(s));
    else localStorage.removeItem(keyFor(wallet));
  } catch {
    // not remembered; the player signs again next time
  }
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, json };
}

export class VillageNet {
  /** This player, written by the scene every frame. */
  readonly me = { x: 0, y: 0, facing: 0, moving: false, level: 1 };
  readonly others = new Map<string, Other>();
  /** The latest line from each wallet, for the bubbles over heads. */
  readonly bubbles = new Map<string, { body: string; at: number }>();
  /** Set by the scene: is this player standing at the boat back to the rig? */
  nearBoat = false;

  private state: NetState;
  private listeners = new Set<() => void>();
  private token: string | null = null;
  private since = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** Bumped on every start and stop, so a loop from an earlier start ends quietly. */
  private gen = 0;
  private lastMove = Date.now();

  constructor(readonly wallet: string) {
    this.state = { status: "entering", error: null, online: 0, chat: [], you: wallet.toLowerCase() };
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  get = () => this.state;

  private set(patch: Partial<NetState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  /** Uses a saved pass when there is one; otherwise waits for the player to sign (or, in local development, enters at once). */
  start() {
    this.gen++;
    const saved = loadSaved(this.wallet);
    if (saved) {
      this.token = saved.token;
      this.set({ status: "live" });
      void this.loop(this.gen);
    } else if (site.devOpenPlay) void this.enter();
    else this.set({ status: "sign" });
  }

  /** Signs the entry message and trades it for a pass. Called from a button, so the wallet popup is allowed. */
  async enter() {
    const gen = this.gen;
    this.set({ status: "entering", error: null });
    const issued = new Date().toISOString();
    let signature = "dev";
    if (!site.devOpenPlay) {
      try {
        signature = await signMessage(villageMessage(this.wallet, issued));
      } catch {
        return this.set({ status: "sign", error: "The signature was cancelled. Sign to enter the village." });
      }
    }
    const { status, json } = await post("/api/village/enter", { wallet: this.wallet, issued, signature }).catch(() => ({ status: 0, json: {} as Record<string, unknown> }));
    if (gen !== this.gen) return;
    if (status === 503) return this.set({ status: "closed", error: String(json.error ?? "The village opens soon.") });
    if (status !== 200 || typeof json.token !== "string") return this.set({ status: "sign", error: String(json.error ?? "Could not reach the village. Try again.") });
    this.token = json.token;
    save(this.wallet, { token: json.token, expires: Number(json.expires) });
    this.set({ status: "live", error: null });
    void this.loop(gen);
  }

  /** Back from being away. */
  resume() {
    this.lastMove = Date.now();
    if (this.state.status === "away") {
      this.set({ status: "live" });
      void this.loop(this.gen);
    }
  }

  private async loop(gen: number) {
    if (this.timer) clearTimeout(this.timer);
    if (gen !== this.gen || !this.token) return;
    const now = Date.now();
    if (this.me.moving) this.lastMove = now;
    if (now - this.lastMove > VILLAGE.awayMs) return this.set({ status: "away" });

    if (!document.hidden) {
      const { status, json } = await post("/api/village", { token: this.token, ...this.me, since: this.since }).catch(() => ({ status: 0, json: {} as Record<string, unknown> }));
      if (gen !== this.gen) return;
      if (status === 401) {
        this.token = null;
        save(this.wallet, null);
        return this.set({ status: "sign", error: "Your village pass ran out. Sign to enter again." });
      }
      if (status === 503) return this.set({ status: "closed", error: String(json.error ?? "The village opens soon.") });
      if (status === 200) this.apply(json as unknown as { online: number; players: Omit<Other, "at">[]; chat: Line[] });
    }
    const wait = now - this.lastMove < 3000 ? VILLAGE.tickMs : VILLAGE.idleTickMs;
    this.timer = setTimeout(() => void this.loop(gen), wait);
  }

  private apply(r: { online: number; players: Omit<Other, "at">[]; chat: Line[] }) {
    const now = Date.now();
    const seen = new Set<string>();
    for (const p of r.players) {
      seen.add(p.wallet);
      this.others.set(p.wallet, { ...p, at: now });
    }
    for (const w of [...this.others.keys()]) if (!seen.has(w)) this.others.delete(w);
    this.addLines(r.chat);
    this.set({ online: r.online });
  }

  private addLines(lines: Line[]) {
    if (!lines.length) return;
    const fresh = lines.filter((l) => l.id > this.since);
    if (!fresh.length) return;
    this.since = Math.max(this.since, ...fresh.map((l) => l.id));
    for (const l of fresh) if (Date.now() - l.at < VILLAGE.bubbleMs) this.bubbles.set(l.wallet, { body: l.body, at: Date.now() });
    this.set({ chat: [...this.state.chat, ...fresh].slice(-60) });
  }

  /** Sends a chat line; returns an error to show, or null. */
  async say(text: string): Promise<string | null> {
    if (!this.token) return "Enter the village first.";
    this.resume();
    const { status, json } = await post("/api/village/chat", { token: this.token, text }).catch(() => ({ status: 0, json: {} as Record<string, unknown> }));
    if (status !== 200) return String(json.error ?? "Could not send that. Try again.");
    const line = json.line as Line;
    this.bubbles.set(line.wallet, { body: line.body, at: Date.now() });
    this.addLines([line]);
    return null;
  }

  /** Leaves the village: stop reporting and drop off the square. */
  stop() {
    this.gen++;
    if (this.timer) clearTimeout(this.timer);
    if (this.token) void fetch("/api/village", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: this.token }), keepalive: true }).catch(() => {});
  }
}
