# Emerald — interactive portfolio model

This is a standalone website folder. It contains the revised mechanical beetle, with dark cool gunmetal joints for the portfolio version, emerald shells and champagne trim. The source Blender scene and the silent film retain their existing finish.

## Film studio appearance

The viewer now uses the film look: a seamless graphite studio, warm softbox reflections, a cool rim, softer ground shadows, and ivory/champagne controls. The hero camera matches the film’s lower three-quarter direction. Cool gunmetal joints and all existing interactive controls remain. The GLB geometry and materials are unchanged; the appearance comes from the viewer’s lighting and environment.

The new `assets/poster-film.png` fallback is captured from this real-time viewer. The film’s procedural flakes, subtle grading and ray-traced light transport remain specific to Blender.

## Put it on your website

Upload this entire folder to a path such as `/beetle/` on your static website host. Keep `assets/` and `vendor/` beside `index.html`. No React, Node build step, API key, account or external CDN is needed at runtime.

Embed it in your portfolio:

```html
<iframe
  src="/beetle/index.html"
  title="Interactive emerald mechanical beetle"
  loading="lazy"
  style="display:block;width:100%;height:720px;border:0"
></iframe>
```

Use a height of at least 560px on narrow screens. `embed-example.html` is a working example. If hosting the viewer on another domain, use its full HTTPS URL and allow that domain in your site's `frame-src` policy. The viewer host must allow your portfolio to frame it. Most static hosts handle the JavaScript, GLB and WebAssembly MIME types automatically (`text/javascript`, `model/gltf-binary`, `application/wasm`). If you set a strict CSP, allow local scripts, WebAssembly compilation, and blob workers for Draco; the viewer does not require network calls to third parties.

## Preview locally

From this folder, run:

```sh
python3 -m http.server 3004 --bind 127.0.0.1
```

Open `http://127.0.0.1:3004/`. Serve over HTTP/HTTPS; opening `index.html` as a `file://` URL will not load the module/model assets reliably.

## Controls

- Drag to orbit. Scroll or pinch to zoom.
- Open/close the shells or scrub their opening with the slider.
- Rotate view starts/stops automatic camera rotation. Dragging stops automatic rotation.
- Run motor opens the shells and spins the existing central drum around its axle.
- Pause all stops automatic orbit, shell motion and motor rotation at their current states.
- Hero and Top switch camera views. Reset returns to the closed, stationary hero view.
- Keyboard: focus the 3D region and use arrow keys to orbit, +/- to zoom, Space to pause, Home to reset. The shell slider supports normal keyboard range controls.

Automatic motion starts only when requested. Offscreen/hidden viewers stop rendering; reduced-motion preferences make shell changes immediate. The studio poster remains available if 3D loading fails.

## Model file

`assets/beetle.glb` is a reusable glTF 2.0 model with Draco geometry compression. It includes the complete revised geometry in nine assemblies and one coordinated `Shells` animation clip. That clip drives both covers, telescoping supports and the upper actuator. `Motor_Rotor` is a separately named assembly with its pivot centered on the physical drum axle; rotate it about its local X axis. Other GLB viewers need Draco support; this package includes its decoder.

The web model retains the detailed geometry instead of substituting a simplified redesign. It is approximately 5 MB compressed, but the decoded geometry is substantial. WebGL2 and a modern browser are required; performance on older phones may vary. Device pixel ratio is capped at 1.5 and static views render on demand.

The materials use standard real-time PBR values. Procedural Blender metallic flake and edge wear are not baked into the GLB, so the real-time finish and lighting will differ slightly from the Cycles film renders. Motor rotation is an interactive demonstration, not a mechanically linked simulation of every internal component.

## Dependencies and rights

Three.js r170 is included under the MIT license (`vendor/THREE-LICENSE.txt`). The bundled Draco decoder is from Three.js r170's glTF decoder distribution, with the Google Draco license in `vendor/draco/LICENSE`. Vendor imports are adjusted to local relative paths for portability. The generated beetle assets are provided for this project; dependency licenses apply only to the bundled libraries.

## October 24 film revision

Open `portfolio.html` for the complete portfolio page. The updated GLB uses the approved mirrored shoulder axes and 60° opening. The viewer adds filtered microflake, AgX tonemapping, finer shadows, amber optics and a darker graphite ground. The portfolio pairs it with the revised 202-second film and downloadable model.
