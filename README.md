# Vice Sunset Cover Maker

An offline web app that turns your photos and a caption into GTA 6-style
cover art: a multi-panel poster with a Vice City neon-sunset grade, bold
caption lettering, and one-click PNG export in the common post sizes.

## How it works

1. Add up to three photos from your machine (two free sample photos are
   pre-loaded so you can try it straight away).
2. Pick a layout: **Poster grid** (one hero panel + three stacked panels),
   **Diagonal slices**, or **Film strip**.
3. Click any panel to select it, then crop it: drag inside the panel to move
   the photo, or use the zoom and pan sliders. One photo can fill every panel,
   or each panel can hold a different photo.
4. Write the title and subtitle, pick a title colour and size.
5. Tune the look: sunset warmth, neon glow, palm silhouettes, film grain.
6. Choose a post size — 1080 × 1080, 1080 × 1350, or 1920 × 1080 — and hit
   **Export PNG**.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests, no uploads: every file the app loads is
under `app/`, and your photos never leave your machine.

## Original art

Everything the app draws is its own: the sunset sky, sun disc and palm
silhouettes are canvas primitives, and the display typeface is
[Anton](https://github.com/google/fonts/tree/main/ofl/anton) (SIL Open Font
License, see `app/fonts/OFL.txt`), vendored under `app/fonts/`. No Rockstar
Games logo, wordmark, artwork, character or font is used. The two sample
photos under `app/samples/` were made with an image model for make.fun and
are free to use.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored make.fun library.

## License

MIT — see `LICENSE`.
