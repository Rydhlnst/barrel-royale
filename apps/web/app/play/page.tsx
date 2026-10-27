import type { Metadata } from "next";
import { site } from "@/lib/site";
import { PlayClient } from "@/components/game/play-client";

export const metadata: Metadata = {
  title: `Play · ${site.name}`,
  description: `Connect your wallet and walk your own offshore rig: drill wells, ride the pressure, refine, fill contracts and brace for storms.`,
};

export default function PlayPage() {
  return (
    <main>
      <h1 className="sr-only">Play {site.name}</h1>
      <PlayClient />
    </main>
  );
}
