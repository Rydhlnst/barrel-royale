import { ClipView } from "./Clip";

// Gameplay callouts for posts on X: the real game plays whole in the clip
// frame (so the HUD stays in view) while one big callout sits in the column
// beside it: a chip, a big number or word, what it means and what it's instead
// of. Each callout is a set of props (CALLOUTS below), cut from the marked play
// footage in public/footage/play.json.

export const CALLOUT_SECONDS = 8;

export type Callout = {
  /** Seconds into the play footage, and the playback rate. */
  from: number;
  rate: number;
  kicker: string;
  big: string;
  label: string;
  sub: string;
};

export const CALLOUTS: Record<string, Callout> = {
  CalloutOverdrive: { from: 13.6, rate: 1.4, kicker: "Choke on Overdrive", big: "1.5x", label: "output", sub: "Instead of 1.0x on Normal" },
  CalloutCapFree: { from: 25.4, rate: 0.75, kicker: "Blowout?", big: "Free", label: "capping", sub: "Close the valves in order" },
  CalloutJet: { from: 46.6, rate: 0.7, kicker: "Distillation Lv 2", big: "Jet fuel", label: "", sub: "3 light crude in, 1 jet fuel out" },
  CalloutDispatch: { from: 58.6, rate: 0.8, kicker: "Dispatch board", big: "Premium", label: "contracts", sub: "Paid above the market base" },
};

export function CalloutVideo({ id = "CalloutOverdrive" }: { id?: string }) {
  const c = CALLOUTS[id];
  return (
    <ClipView
      clip={{
        seconds: CALLOUT_SECONDS,
        link: "barrelroyale.io/play",
        shots: [{ src: "play", from: c.from, rate: c.rate, start: 0, end: CALLOUT_SECONDS }],
        beats: [{ at: 0.6, until: CALLOUT_SECONDS - 0.3, kicker: c.kicker, big: c.big, label: c.label || undefined, sub: c.sub }],
      }}
    />
  );
}
