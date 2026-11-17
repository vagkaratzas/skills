---
name: drawio-nf-core-metromaps
description: >
  Use when creating, updating, or exporting an nf-core / Nextflow pipeline metro map (subway-style
  workflow diagram) with draw.io (app.diagrams.net) through Claude in Chrome: redrawing the map for a
  new release, adding or removing module stations and lanes, editing an existing draw.io metro map,
  drawing a map of how several pipelines chain (stations = pipelines with their logos), or exporting
  light and dark PNG/SVG versions into docs/images. Not for maps drawn with Inkscape, the nf-metro
  plugin, or other tools.
---

# nf-core metro maps in draw.io

The map is a draw.io file (usually in Google Drive) edited in the user's Chrome through Claude in
Chrome. You draw it with `scripts/mm_core.js`, a helper library pasted into `javascript_tool`. You
export it with the same library, and `scripts/install_metromaps.sh` puts the exports into the
pipeline repo. Load the `anthropic-skills:chrome-browser` skill before the first browser call.

## What does not work (skip these)

| Tried | Result | Do instead |
|---|---|---|
| Google Drive connector on the `.drawio` file ID from the `#G<id>` URL | "Requested entity was not found" | Edit in the open draw.io tab |
| `fetch` from app.diagrams.net to a localhost relay | Blocked by CSP; a relay server also trips the auto-mode classifier | Do not move data through the network |
| Reading big data out through `javascript_tool` output | Cut at ~1.5k characters; anything that looks like a URL, token or `k=v` returns `[BLOCKED: ...]` | Return short summaries; read the diagram locally from the repo's exported SVG/PNG with `scripts/dump_drawio_svg.py` |
| Pasting large files (images) into `javascript_tool` | Very expensive | Put a temporary `<input type=file>` on the page (`MM.logoInput()`), then `find` + `file_upload`. It only takes paths this session may read (a file in another repo was refused): copy the file into the scratchpad first |
| Loading the helper script from a file (`<input type=file>` + `eval`) or from localhost | `eval` and `fetch` to localhost are blocked by the page CSP | Paste the script as the `javascript_tool` code itself; dropping comment-only lines cuts about 20% |
| `window.ui` / `App._instances` | Not exposed | `MM.getUi()` hooks `EditorUi.prototype.windowResized` and `getCurrentFile`, then fires synthetic `resize` and `focus` events; no click needed. Hooking `refresh` does not work, because a resize never reaches it |
| `a.click()` download from `javascript_tool` | Silently dropped | `MM.downloadButton()`, then click the button with the computer tool. With "Ask where to save" on, Chrome opens a native Save dialog you cannot see: **ask the user to press Save** |
| Clicking the draw.io status bar "Unsaved changes. Click here to save" right after a large build | Froze the renderer and disconnected the extension | `MM.waitSaved()` and let autosave finish; if it stays unsaved, ask the user to save |
| Re-running `MM.build()` after the user edited the page | Wipes their edits | After hand-off, make only targeted edits (find cells by id, geometry or style) |
| Plain `#FFFFFF` / `#000000` on stations, icon labels, bars and triangles | draw.io inverts them in the dark export (black stations, unreadable icon labels) | `light-dark(X,X)`; `mm_core` writes them that way, and `MM.pinDarkColors()` fixes older pages |
| `exportSvg` with fonts off | Maven Pro not embedded | `MM.exportAll()` passes embedFonts = true |
| Committing draw.io SVGs as exported | nf-core `end-of-file-fixer` hook fails | `install_metromaps.sh` appends the final newline |
| Putting a draw.io SVG under the nf-core website's `src/assets` | Netlify main-site preview fails in about 30 s: Astro's image-size only looks at the first 1000 bytes for the end of the root `<svg>` tag, and draw.io keeps the editable diagram (hundreds of KB) in an attribute of it, so `NoImageMetadata` | Ship only the PNGs there (they carry the same diagram); keep the SVGs in the project repo. Reproduce locally with Node 24 and `astro build` in `sites/main-site` |
| `g.removeCells(g.getChildCells(P))` to wipe a page | `getChildCells` skips hidden cells, so the hidden dark logos pile up on every rebuild and bloat the export (fixed in `MM.build`) | `g.removeCells(M.getChildren(P).slice(), true)` |
| `eval(fn.toString().replace(...))` to patch a helper in place | Blocked by the page CSP (`unsafe-eval`), even though it worked earlier in the same tab | Paste the whole edited function again, or edit cell geometry directly |
| `fetch` or `file_upload` for pipeline logos | `fetch` is blocked by the CSP; upload only takes files the user shared | `new Image()` with `crossOrigin='anonymous'` from `raw.githubusercontent.com/nf-core/<p>/HEAD/docs/images/...`, drawn to a canvas, `toDataURL` (see `references/meta-omics-sig-map.js`) |
| Relabelling a library asset by setting its text to plain `FASTA` | Loses the asset's white `<font>` wrapper: the label vanishes on the black file icon | Set `<b>fasta</b>` and put `fontColor=light-dark(#FFFFFF,#FFFFFF)` in the text child's style |
| Line colours as plain hex | draw.io's dark palette dims yellow to near-invisible | `light-dark(X,X)` per line; give the dark brown MAG line its own dark value |
| Two lanes close together, one crossing the other at a corner | The crossing lands inside the arc: a kink. `arcSize` on an edge is twice the corner radius (80 = 40 px) | Cross on straight segments only, and keep corners 40 px clear of other lanes |
| Embedding raw pipeline logos (about 30 KB each, three copies per logo) | PNG 1.8 MB, SVG 2.5 MB | Palette-quantize them in the page (`quant` in `references/meta-omics-sig-map.js`: premultiplied RGBA, true-average palette, falls back to the original PNG when the error is too high): about 40% smaller exports, same pixels. Quantizing straight RGBA merges nearly transparent pixels into opaque white and the text goes grey |
| Box sizes and gaps typed in by hand | Review comments on nf-core/website#4561, one round each: gaps between boxes unequal, bottom padding too large in one box and too small in another, stations unevenly spaced, one box's corners rounder | Compute each box from its content (fixed bottom `PAD`, fixed `GAP`, see `references/meta-omics-sig-map.js`), then `await MM.check()` before every export |
| Relative `arcSize` on boxes | Each box gets a different corner radius, by its size | `absoluteArcSize=1;arcSize=20` on every box (`mm_core` does this now) |
| Logos placed from their raw PNG bounds | The repos' PNGs carry uneven transparent padding: label-to-pill gaps varied 8-21 px and one station looked detached (#4561) | Trim each logo to its alpha bounding box before scaling, then place it a fixed gap from the pill |
| Branches off one trunk leaving it in different directions | Reviewer: "should go the same way" (#4561) | Leave the trunk the same way every time; reorder lanes at shared stations so no branch crosses another lane inside a corner |
| A box whose station column is a few px off its centre | The widest label made it visible ("last node not centred", #4561) | Size the box around the column; the SIG script's `check` (`references/meta-omics-sig-map.js`) flags an off-centre column of >= 3 stations with logos above |
| Every logo stored at one fixed width (360 px) | A wide logo drawn at 320 px has almost no headroom and looks blurry next to the others | Store each logo at 2x its drawn width (`check` flags < 1.9x) |
| A logo composed at full size (thousands of px) and left for draw.io to scale down | Dark-mode text came out grey (221 vs 255 on the other logos) | Shrink on a canvas to 2x the drawn width first, then whiten the neutral text pixels after the shrink |
| Parallel lanes that turn together with one `arcSize` | Gaps of about 4 px at the corner (the lanes are not concentric) | Route lanes so they only turn apart, or vary the radius per lane |

## Workflow

### 1. Work out what the map must show (from the code, not the old map)

- **Stations are nf-core modules only.** List the `include`s of `modules/nf-core/` and
  `subworkflows/nf-core/` reached from `workflows/<pipeline>.nf`, and follow every local
  subworkflow. Leave out local modules, but keep the data flow they carry.
- For each module, note whether it runs **per sample** or **per item**: per family, chunk or
  cluster, which is the `meta` key added inside the workflow. That decides solid vs dotted.
- Take inputs from the samplesheet schema (`assets/schema_input.json`) and final outputs from
  `docs/output.md`. Draw final outputs only, not per-step intermediates.
- Look for module sequences that repeat across paths. Draw them once, with the other path's lanes
  joining in, rather than as duplicate stations.
- Agree the design with the user before drawing anything that changes the visual language (new
  colours, line styles, merged boxes).

Map conventions this user approved:
- **Colour = run mode**: green = create, orange = optional update, pink = optional merge (extend
  `MM.COLORS` for other modes).
- **Line style = granularity**: solid = runs per sample, dotted = runs per family/item. The style
  switches inside a station circle, where the join is hidden. Downstream pipelines are solid.
- Lanes are 10px apart and stations 30px. One circle covers up to three parallel lanes; for more,
  use a taller pill (station `w`/`h`).
- Labels are bold 20px, alternating above and below on dense rows, and placed on the side away
  from the lines.
- Numbered grey boxes are stages. The legend lists the colours, solid/dotted and the stage list,
  next to the logo.
- A loop back upstream (e.g. a merge going back to model building) has to cross lanes. Make it
  cross at a box entrance, never through a station.

### 2. Open the diagram

1. Ask for the draw.io link (Drive) and the pipeline repo path. Prefer working on a copy of the
   file. Open the link in a new tab.
2. `resize_window` to about 1600×1300, since the default viewport is too small to review.
3. Paste `scripts/mm_core.js` into `javascript_tool`. Do this again after every page reload.
4. Get the old map's structure cheaply: run `python3 scripts/dump_drawio_svg.py
   <repo>/docs/images/<pipeline>_workflow_light.svg` (or `.png`) locally.

### 3. Draw the new map on a new page

1. Select the old map's page and run `await MM.harvestImages()`. It lists the embedded images with
   their sizes: the stacked file icon is about 100×110, the single one 80×89, and the logo wide.
2. Write a spec. Start from `references/proteinfamilies-v3-spec.js`, which has the format and a
   full worked example. Set `spec.page` to a new name (e.g. the release) so the old page survives.
3. `await MM.build(SPEC)`, then `await MM.view(0.62)` and take a screenshot. Iterate: fix
   collisions, labels on lines, and captions overlapping icons. Small edits to `SPEC` plus a rebuild
   are cheap at this stage.
4. Check dense areas with `computer` `zoom` on a region.
5. Hand the page over for manual tweaks. The user typically nudges the white arrows onto visible
   dashes and adds more. From then on, **no more `MM.build` on that page**.

### 3b. Maps of chained pipelines (stations are pipelines, labels are their logos)

Worked example: `references/meta-omics-sig-map.js` (the nf-core meta-omics SIG map: 19 pipelines, six data-type lines, four sections). It does not use `MM.build`; it draws one polyline per route, which is simpler when lines fork and rejoin.

- **One polyline per route, branches start inside the trunk.** A fork is then an overlap of two identical strokes, never a butt-joint, so there are no seams. A branch that ends on a lane ends 50 px before the corner of the lane it merges into, or its square end pokes out of the arc.
- **Rows are y values, channels are x values.** Plan them on paper first: where each line leaves a station, which vertical channel it uses, which row it ends on. Order the channels so a line that turns up never crosses the horizontals of lines that go further.
- **Crossings only on straight segments** (see the table). When two lines must both reach the same two stations, separate their lanes or let one come from below so the crossing is clean.
- **Logos as labels, light and dark pair.** Each station gets a light logo and a hidden dark copy at the same geometry, tagged `metromapTheme=light|dark`; `MM.exportAll` swaps them in memory. Look in each pipeline's `docs/images` for a custom-art variant (`*_custom_*`, `*_mascot_*`, `*_flat_*`, `*_tax`): names are not uniform, and the file for LIGHT backgrounds can be the one called "black" or "dark". A repo with only a light mascot logo (bacmodel) gets a dark copy by recolouring its text white on a canvas. Size labels by the "nf-core/" text, not by image width: aspect ratios differ.
- **File icons: use the nf-core asset.** The `nf-core_components` library has FASTA/FASTQ file icons. Ask the user to drag one onto the page, then clone the group (`g.cloneCells`), move it, set the label (pinned white), delete the stand-in shapes.
- **A route that must cross other lanes can hop over them**: add `jumpStyle=arc;jumpSize=20` to that edge's style and draw it last. The hop survives the SVG and PNG export.
- **After the user has touched the page, never rebuild.**

### 4. One-time dark logo setup (per diagram)

The dark map differs from the light one only by the logo. Keep both logos on the page, tagged:

1. `await MM.logoCandidates()` to find the light logo cell id.
2. `MM.logoInput()`, then `find` "file input", then `file_upload` with
   `<repo>/docs/images/nf-core-<pipeline>_logo_dark.png`. The file must be one the user shared,
   e.g. attached in chat.
3. `await MM.addDarkLogo('<light id>')`. This tags `metromapTheme=light` and adds a hidden
   `metromapTheme=dark` copy.
4. `await MM.pinDarkColors()` if the page predates `mm_core`. Then run `await MM.waitSaved()`.

No second page or tab is needed. The export swaps the logos in memory only.

### 5. Export and install

0. **Lint and review before every export**: `await MM.check()` must return `ok` (box gaps, bottom
   padding, absolute corner radius, station spacing, dark logo text white, logo resolution; it
   also works on hand-edited pages). Then look for what the check cannot see, which reviewers
   also flagged: stations meant to share a row at exactly the same y, stations centred in their
   box rather than pushed wide, all logos equally sharp at 100% zoom.
1. `await MM.exportAll('<pipeline>_workflow')`. It returns file sizes and gives light and dark
   PNG + SVG: transparent, scale 1, border 0, the editable diagram embedded, fonts embedded.
2. Check the dark render: `MM.preview('<pipeline>_workflow_dark.png')` and take a screenshot. Run
   `MM.preview('<pipeline>_workflow_light.png', '#ffffff')` too, then `MM.preview(null)`.
3. `await MM.downloadButton('<pipeline>_metromaps.zip')`, then `find` the "Download metro maps"
   link and `left_click` it. Tell the user they may need to **press Save** in Chrome's dialog, and
   wait for them to confirm.
4. Run `scripts/install_metromaps.sh <pipeline>_metromaps <repo>/docs/images`. It takes the newest
   zip, removes it, and warns about any older duplicates. Duplicates come from repeated Save
   dialogs; delete them only after checking with `unzip -p` that their contents match.
5. Verify:
   - `file` shows the expected sizes.
   - `grep -o 'color-scheme: [a-z]*'` matches each SVG's theme.
   - `grep -c @font-face` > 0.
   - `grep -a -c mxfile` on the PNGs is 1.
   - `pre-commit run --files <the four images>` passes.
   - Compare sizes with `git cat-file -s HEAD:<file>`. Smaller or similar needs no compression.
     Never strip the embedded diagram or fonts.
6. Show both PNGs to the user (Read). Leave committing to them.

## Scripts

| File | Purpose |
|---|---|
| `scripts/mm_core.js` | Browser library (`window.MM`): `getUi`, `harvestImages`, `build`, `view`, `check` (layout lint), `pinDarkColors`, `logoInput`, `logoCandidates`, `addDarkLogo`, `exportAll`, `preview`, `downloadButton`, `waitSaved`, and the pure helpers `offset` (parallel lanes) and `arrowPoints` (arrows snapped onto dashes) |
| `scripts/test_mm_core.js` | `node scripts/test_mm_core.js`: self-check for the geometry helpers |
| `scripts/install_metromaps.sh` | Unzip the newest export into `docs/images` and fix the SVGs' final newline |
| `scripts/dump_drawio_svg.py` | One line per cell of the diagram embedded in an exported SVG/PNG (`--xml` writes the XML) |
| `references/proteinfamilies-v3-spec.js` | Full spec of the nf-core/proteinfamilies v3.0.0 map, with layout notes |
| `references/meta-omics-sig-map.js` | Self-contained script for the meta-omics SIG pipeline-chain map: route polylines, station logos with dark pairs (stored at 2x), content-sized boxes, `check`, `useAssetIcon`, export. The canonical copy lives in meta-omics-sig's `update-metro-map` skill |
