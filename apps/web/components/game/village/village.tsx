"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { GameStore } from "@/lib/game/store";
import { VILLAGE } from "@/lib/village-rules";
import { shortAddress } from "@/lib/wallet";
import { Stick } from "../stick";
import { VillageNet } from "./net";

// Royal Harbor, the village every rig shares. The Phaser scene fills the window; on top sit the way back
// to the rig, who's here, the chat, the sign-in card and the phone stick. The rig keeps running meanwhile.

function VillageWorld({ store, net }: { store: GameStore; net: VillageNet }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let game: import("phaser").Game | null = null;
    let cancelled = false;
    (async () => {
      const Phaser = await import("phaser");
      const { villageScene } = await import("./scene");
      if (cancelled || !host.current) return;
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host.current,
        backgroundColor: "#1a73d9",
        pixelArt: true,
        roundPixels: true,
        scale: { mode: Phaser.Scale.RESIZE, width: host.current.clientWidth, height: host.current.clientHeight },
        scene: [villageScene(Phaser, store, net)],
        banner: false,
        audio: { noAudio: true },
      });
    })();
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [store, net]);
  return <div ref={host} className="absolute inset-0" aria-label="The village. Walk with WASD or the arrow keys, or the stick on a phone." role="application" />;
}

const HAT_COLORS = ["#e8453c", "#1a73d9", "#15905f", "#7a4fc0", "#4a5878", "#e8743c", "#4a5878", "#d64f9a"];
const colorFor = (wallet: string) => HAT_COLORS[parseInt(wallet.slice(-4), 16) % HAT_COLORS.length];

function Chat({ net }: { net: VillageNet }) {
  const s = useSyncExternalStore(net.subscribe, net.get, net.get);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(true);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [s.chat.length, open]);

  const send = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const err = await net.say(text);
    setBusy(false);
    setError(err);
    if (!err) setText("");
  };

  if (!open)
    return (
      <button type="button" className="btn btn-white pointer-events-auto absolute bottom-6 right-6 z-20" onClick={() => setOpen(true)}>
        Chat {s.chat.length ? `· ${s.chat.length}` : ""}
      </button>
    );

  return (
    <section aria-label="Village chat" className="box pointer-events-auto absolute bottom-3 right-3 z-20 flex max-h-[46vh] w-[calc(100%-176px)] max-w-[380px] flex-col overflow-hidden lg:bottom-6 lg:right-6 lg:max-h-[60vh]">
      <header className="flex items-center justify-between gap-3 border-b-[3px] border-brand-ink bg-brand-sun-pale px-3 py-1.5">
        <h2 className="font-display text-lg font-bold">Harbor chat</h2>
        <button type="button" className="btn btn-white min-h-8! px-2! text-sm!" onClick={() => setOpen(false)} aria-label="Hide chat">
          –
        </button>
      </header>
      <ol ref={list} className="flex min-h-[120px] flex-col gap-1.5 overflow-y-auto bg-white px-3 py-2 text-sm">
        {s.chat.length === 0 && <li className="text-brand-ink-2">No one has said anything yet. Say GM!</li>}
        {s.chat.map((l) => (
          <li key={l.id} className="break-words leading-snug">
            <span className="font-mono text-xs font-bold" style={{ color: l.wallet === s.you ? "#b8780f" : colorFor(l.wallet) }}>
              {l.wallet === s.you ? "You" : shortAddress(l.wallet)}
            </span>{" "}
            {l.body}
          </li>
        ))}
      </ol>
      <form
        className="flex flex-col gap-1 border-t-[3px] border-brand-ink bg-brand-sun-pale p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
            maxLength={VILLAGE.chatMax}
            placeholder="Say something…"
            aria-label="Chat message"
            className="pixel-sm min-w-0 flex-1 bg-white px-2 py-1.5 text-sm"
            disabled={s.status !== "live" && s.status !== "away"}
          />
          <button type="submit" className="btn btn-red min-h-9! px-3! text-sm!" disabled={busy || !text.trim()}>
            Send
          </button>
        </div>
        <p className={`text-xs ${error ? "font-bold text-brand-red" : "text-brand-ink-2"}`}>{error ?? "Be kind. No links or wallet addresses."}</p>
      </form>
    </section>
  );
}

export function Village({ store, account, onLeave }: { store: GameStore; account: string; onLeave: () => void }) {
  const [net] = useState(() => new VillageNet(account));
  const s = useSyncExternalStore(net.subscribe, net.get, net.get);
  const [nearBoat, setNearBoat] = useState(false);

  useEffect(() => {
    net.start();
    return () => net.stop();
  }, [net]);

  // the scene marks the boat; check it a few times a second for the prompt
  useEffect(() => {
    const t = setInterval(() => setNearBoat(net.nearBoat), 150);
    return () => clearInterval(t);
  }, [net]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.repeat) return;
      if ((e.key === "e" || e.key === "E" || e.key === "Enter") && net.nearBoat) onLeave();
      net.resume();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [net, onLeave]);

  return (
    <>
      <VillageWorld store={store} net={net} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 p-3 sm:gap-3 sm:p-4">
        <button type="button" className="btn btn-white pointer-events-auto" onClick={onLeave}>
          ← Back to your rig
        </button>
        <span className="pixel-sm bg-brand-sun px-3 py-1 font-display font-bold">Royal Harbor</span>
        {s.status === "live" && (
          <span className="pixel-sm flex items-center gap-2 bg-white px-3 py-1 text-sm font-bold">
            <span className="inline-block h-2.5 w-2.5 bg-brand-leaf" /> {s.online} here now
          </span>
        )}
      </div>

      {nearBoat && (
        <div className="absolute bottom-40 left-1/2 z-10 -translate-x-1/2 lg:bottom-8">
          <button type="button" className="btn btn-red" onClick={onLeave}>
            Row back to your rig
            <kbd className="hidden rounded-none border-2 border-white/60 px-1 text-xs lg:inline">E</kbd>
          </button>
        </div>
      )}

      <Chat net={net} />

      <div className="absolute bottom-6 left-6 z-10 lg:hidden">
        <Stick store={store} />
      </div>

      {(s.status === "sign" || s.status === "entering" || s.status === "closed" || s.status === "away") && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-brand-ink/50 p-4">
          <div className="box flex w-full max-w-md flex-col items-center gap-4 bg-white p-6 text-center">
            <h2 className="font-display text-3xl font-bold">{s.status === "away" ? "Still there?" : s.status === "closed" ? "The harbor is closed" : "Welcome to Royal Harbor"}</h2>
            {s.status === "away" ? (
              <>
                <p>You stepped away for a while, so we took you off the square.</p>
                <button type="button" className="btn btn-red" onClick={() => net.resume()}>
                  I&apos;m back
                </button>
              </>
            ) : s.status === "closed" ? (
              <>
                <p>{s.error}</p>
                <button type="button" className="btn btn-white" onClick={onLeave}>
                  Back to your rig
                </button>
              </>
            ) : (
              <>
                <p>
                  The village every rig shares: meet other roughnecks, chat and hang out by the fire. Sign a message with your wallet to prove it&apos;s
                  you. Signing is free and sends no transaction.
                </p>
                {s.error && <p className="font-bold text-brand-red">{s.error}</p>}
                <div className="flex flex-wrap justify-center gap-2">
                  <button type="button" className="btn btn-red" disabled={s.status === "entering"} onClick={() => void net.enter()}>
                    {s.status === "entering" ? "Check your wallet…" : "Sign and enter"}
                  </button>
                  <button type="button" className="btn btn-white" onClick={onLeave}>
                    Not now
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
