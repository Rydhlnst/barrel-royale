import type { Metadata } from "next";
import { site } from "@/lib/site";
import { PlayClient } from "@/components/game/play-client";

export const metadata: Metadata = {
  title: `Play · ${site.name}`,
  description: `Walk your own offshore rig in the browser: drill wells, ride the pressure, refine, fill contracts and brace for storms. No wallet needed.`,
};

export default function PlayPage() {
  return (
    <main>
      <h1 className="sr-only">Play {site.name}</h1>
      <PlayClient />
    </main>
  );
}
