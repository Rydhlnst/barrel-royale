# Barrel Royale launch videos

Five 1920 × 1080, 60 fps videos for X, made with Remotion from the site's own
pixel art (`apps/web/lib/palette.ts`, `components/pixel`, `components/scenes`)
and footage filmed on barrelroyale.io.

| Composition     | Length | File in `out/`                                  |
| --------------- | ------ | ----------------------------------------------- |
| `WebLive`       | 14 s   | `barrel-royale-web-live-1080p60.mp4`            |
| `LaunchingSoon` | 15 s   | `barrel-royale-launching-soon-1080p60.mp4`      |
| `CaLive`        | 14 s   | `barrel-royale-ca-live-1080p60.mp4`             |
| `TokenBurn`     | 18 s   | `barrel-royale-token-burn-1080p60.mp4`          |
| `HowToPlay`     | 45 s   | `barrel-royale-how-to-play-1080p60.mp4`         |

```bash
npm install
npm run record            # films home, play, whitelist and docs into public/footage
npm run studio            # preview at http://localhost:3133
npm run render            # all five into out/
```

`npm run render -- CaLive` renders one. `node scripts/render.mjs --stills HowToPlay:600`
writes a frame to `out/stills/` for a quick look.

## The $ROYAL contract address

`CaLive` shows the address from its `ca` prop, a zero-address placeholder until
launch. Set it in `caLiveDefaults` in `src/CaLive.tsx`, or in the Studio's props
panel, and render `CaLive` again.

## Footage

`scripts/record.mjs` films headless Chrome from inside the browser (no desktop
capture) and needs the full FFmpeg build on PATH or in `FFMPEG`. It launches
Chrome on the GPU: the game only holds 60 fps that way. For `/play` it seeds a
level 3 rig in the browser's save, so every step has something to show, then
walks the route and writes the time of each step to `public/footage/play.json`,
which `HowToPlay` cuts by. The MP4s stay out of git; re-record to rebuild them.

## Vault update post

`npm run vault` reads the XOM reward vault on Robinhood Chain (balance and the
latest deposit) and renders `out/barrel-royale-vault-<total>-1080p60.mp4` plus a
`.png` still of the last frame. Add `-- --price 115.40` to show the dollar value.

## Social kit

`npm run social` renders the post kit to `out/social/`: announcement cards and
the roadmap visuals as 1600x900 PNGs, and the gameplay callouts and the roadmap
update as 1080p60 videos. Pass a group to render only part of it:
`npm run social -- cards`, `-- callouts`, `-- roadmap` or `-- features`.

- **Announcement cards** (`src/social/Announce.tsx`): a frame of the real game
  behind a status chip, a two-tone headline, the facts, a call to action and a
  collage of crew cards. Add an entry to `ANNOUNCEMENTS` for a new post; wrap a
  phrase in `[brackets]` to set it in yellow.
- **Gameplay callouts** (`src/social/Callout.tsx`): the play footage full frame
  with one big callout. Add an entry to `CALLOUTS`, picking `from` with the marks
  in `public/footage/play.json`.
- **Roadmap** (`src/social/Roadmap.tsx`): a map of every phase, plus an update
  card and video for the phase in progress. The data in
  `src/social/roadmap-data.ts` mirrors `apps/web/app/roadmap/page.tsx`. When an
  item ships, flip its `ok` in both, then run `npm run roadmap`.
- **Feature updates** (`src/social/Feature.tsx`): a "Shipped" or "Now building"
  chip, a two-line title and three facts, with the feature playing in a window
  or a phone. Add an entry to `FEATURES` (and a demo if it needs a new one), put
  its card frame in the `stills` map in `scripts/social.mjs`, then run
  `npm run features`. Site features scroll a screenshot of the live page from
  `public/shots/`; retake them with `node scripts/shots.mjs` after the site changes.
- **Feature clips** (`src/social/Clip.tsx`): real footage of the site or the game,
  with the camera pushing in on what matters and a callout per beat. Film the
  footage with `node scripts/record.mjs getroyal live rigs phone`, add an entry to
  `CLIPS` (shots with camera keyframes, and beats), then run `npm run clips`.
- **How to play on a phone** (`src/social/MobileHow.tsx`, `MobileHowToPlay`): the
  real game filmed at phone size with `node scripts/record.mjs mplay`, in a phone
  next to the steps. The recorder brings a stand-in wallet and answers the
  $ROYAL balance check inside its own browser, so nothing reaches a wallet or
  the chain; it also keeps the market panel's export quota lines out of frame.
  Render with `node scripts/render.mjs MobileHowToPlay`.
