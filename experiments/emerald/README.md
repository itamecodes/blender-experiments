# Emerald

Interactive edition of the 3:22 Emerald build film. The revised geometry includes two mirrored 60° shoulder hinges, a separately rotatable central drum, and six detailed legs. This edition keeps the requested cool gunmetal joints.

## Run locally

From `viewer/`, run `python3 -m http.server 3004 --bind 127.0.0.1` and open `http://127.0.0.1:3004/portfolio.html`.

`viewer/index.html` is the standalone embeddable model. `viewer/portfolio.html` adds the film, actual process stills and model download. No API keys or external CDN are required at runtime.

## Files

- `models/Emerald-Beetle.glb`: reusable Draco-compressed glTF model.
- `viewer/`: portable website, libraries and assets.
- `film/`: transcript and subtitles.

The portfolio streams the completed film from the `emerald-v1` GitHub Release. The downloadable website ZIP includes a local film file and works without third-party runtime services. MP4 files are excluded from Git history.

Real-time light transport and antialiasing approximate the offline film; this is an interactive model, not a pixel-identical Cycles render. Browser-controlled microflake is filtered for stable motion. Motor rotation is a visual demonstration.
