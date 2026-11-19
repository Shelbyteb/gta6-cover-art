[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Shelbyteb/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Shelbyteb/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Sunset Cover Maker

A small, fully offline web app for turning your own photos and a caption into
GTA 6-style cover art. It builds a multi-panel poster with a Vice City
neon-sunset look — warm skies, glowing lettering, palm silhouettes — and
exports it as a PNG ready to post.

Built for the make.fun bounty **"Make GTA 6 Cover Art"**:
https://make.fun/bounty/gta6-cover-art-01

## What it does

- **Three panel layouts** — a poster grid with one hero panel plus three
  stacked panels, diagonal slices, or a classic film strip.
- **Your photos, your crop** — drop in up to three pictures, or start with
  the two included sample photos. Click a panel to select it, drag to move
  the photo inside it, and fine-tune with the zoom and pan sliders. A single
  photo can span every panel, or each panel can show a different shot.
- **Big cover type** — a bold title and subtitle with your choice of colour
  and size, drawn in the vendored Anton display face.
- **Sunset styling** — dial in warmth, neon glow, palm silhouettes and film
  grain until the poster feels like a Vice City evening.
- **One-click export** — PNG in 1080 × 1080, 1080 × 1350 or 1920 × 1080.
  The export is a pixel-exact render of what the preview shows, so what you
  see on screen is exactly what gets posted.

## How to run it

```sh
node serve.ts
# then open http://localhost:8080
```

That is all there is to it: no build step, no install, no network calls.
Every file the app needs lives under `app/`, and the photos you add never
leave your machine.

## Producing the entry output

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and
writes `dossier.json` using the vendored make.fun library.

## Original artwork

Nothing in the app is borrowed from the game: the sunset sky, sun disc and
palm trees are drawn as canvas primitives, and the display font is
[Anton](https://github.com/google/fonts/tree/main/ofl/anton) under the SIL
Open Font License (see `app/fonts/OFL.txt`), vendored under `app/fonts/`.
No Rockstar Games logo, wordmark, artwork, character or font is used. The
two sample photos in `app/samples/` were generated with an image model for
this make.fun entry and are free to use.

## License

MIT — see `LICENSE`.
