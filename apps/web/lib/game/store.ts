import * as E from "./engine";

// One live game for the page: ticks the engine, saves to the browser, and lets
// both React (HUD, panels) and Phaser (the world) read and change it.

const SAVE_KEY = "barrel-royale-game-v1";
const TICK_MS = 250;

export type Target = "market" | "dispatch" | "storage" | "quarters" | `pad:${number}`;
export type Toast = { id: number; text: string; tone: "good" | "bad" };

type Snapshot = { game: E.Game; now: number; nearby: Target | null; toast: Toast | null };

function load(now: number): E.Game {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const g = JSON.parse(raw) as E.Game;
      if (g.version === 1 && Array.isArray(g.slots)) {
        // saves from before the export terminal only had coins
        g.royal ??= 0;
        g.exported ??= { day: 0, royal: 0 };
        return E.tick(g, now);
      }
    }
  } catch {
    // a broken or blocked save starts a fresh rig
  }
  return E.newGame(now);
}

export class GameStore {
  private snap: Snapshot;
  private listeners = new Set<() => void>();
  private timers: ReturnType<typeof setInterval>[] = [];
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private toastId = 0;

  /** Movement from the on-screen stick, read by the world every frame; paused while a panel is open. */
  readonly input = { dx: 0, dy: 0, paused: false };

  setStick(dx: number, dy: number) {
    this.input.dx = dx;
    this.input.dy = dy;
  }

  setPaused(paused: boolean) {
    this.input.paused = paused;
  }

  constructor() {
    const now = Date.now();
    this.snap = { game: load(now), now, nearby: null, toast: null };
  }

  start() {
    this.timers.push(setInterval(() => this.set({ game: E.tick(this.snap.game, Date.now()), now: Date.now() }), TICK_MS));
    this.timers.push(setInterval(() => this.save(), 2000));
    const onHide = () => this.save();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      this.timers.forEach(clearInterval);
      this.timers = [];
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
      this.save();
    };
  }

  get = () => this.snap;
  get game() {
    return this.snap.game;
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private set(patch: Partial<Snapshot>) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.snap.game));
    } catch {
      // private windows can refuse storage; the game still runs
    }
  }

  say(text: string, tone: "good" | "bad") {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.set({ toast: { id: ++this.toastId, text, tone } });
    this.toastTimer = setTimeout(() => this.set({ toast: null }), 2200);
  }

  /** Apply one engine action and report its result. */
  run = (fn: (g: E.Game, now: number) => E.Result) => {
    const now = Date.now();
    const res = fn(this.snap.game, now);
    this.set({ game: res.game, now });
    this.save();
    if (res.error) this.say(res.error, "bad");
    else if (res.note) this.say(res.note, res.note.startsWith("Wrong") ? "bad" : "good");
    return res;
  };

  reset() {
    const now = Date.now();
    this.set({ game: E.newGame(now), now });
    this.save();
  }

  setNearby(t: Target | null) {
    if (t !== this.snap.nearby) this.set({ nearby: t });
  }
}
