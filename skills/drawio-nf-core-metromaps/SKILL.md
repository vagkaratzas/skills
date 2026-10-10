---
name: drawio-nf-core-metromaps
description: >
  Use when creating, updating, or exporting an nf-core / Nextflow pipeline metro map (subway-style
  workflow diagram) with draw.io (app.diagrams.net) through Claude in Chrome: redrawing the map for a
  new release, adding or removing module stations and lanes, editing an existing draw.io metro map,
  or exporting light and dark PNG/SVG versions into docs/images. Not for maps drawn with Inkscape,
  the nf-metro plugin, or other tools.
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
| Pasting large files (images) into `javascript_tool` | Very expensive | Put a temporary `<input type=file>` on the page (`MM.logoInput()`), then `find` + `file_upload` |
| `window.ui` / `App._instances` | Not exposed | `MM.getUi()` hooks `EditorUi.prototype.windowResized` and `getCurrentFile`, then fires synthetic `resize` and `focus` events; no click needed. Hooking `refresh` does not work, because a resize never reaches it |
| `a.click()` download from `javascript_tool` | Silently dropped | `MM.downloadButton()`, then click the button with the computer tool. With "Ask where to save" on, Chrome opens a native Save dialog you cannot see: **ask the user to press Save** |
| Clicking the draw.io status bar "Unsaved changes. Click here to save" right after a large build | Froze the renderer and disconnected the extension | `MM.waitSaved()` and let autosave finish; if it stays unsaved, ask the user to save |
| Re-running `MM.build()` after the user edited the page | Wipes their edits | After hand-off, make only targeted edits (find cells by id, geometry or style) |
| Plain `#FFFFFF` / `#000000` on stations, icon labels, bars and triangles | draw.io inverts them in the dark export (black stations, unreadable icon labels) | `light-dark(X,X)`; `mm_core` writes them that way, and `MM.pinDarkColors()` fixes older pages |
| `exportSvg` with fonts off | Maven Pro not embedded | `MM.exportAll()` passes embedFonts = true |
| Committing draw.io SVGs as exported | nf-core `end-of-file-fixer` hook fails | `install_metromaps.sh` appends the final newline |

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
| `scripts/mm_core.js` | Browser library (`window.MM`): `getUi`, `harvestImages`, `build`, `view`, `pinDarkColors`, `logoInput`, `logoCandidates`, `addDarkLogo`, `exportAll`, `preview`, `downloadButton`, `waitSaved`, and the pure helpers `offset` (parallel lanes) and `arrowPoints` (arrows snapped onto dashes) |
| `scripts/test_mm_core.js` | `node scripts/test_mm_core.js`: self-check for the geometry helpers |
| `scripts/install_metromaps.sh` | Unzip the newest export into `docs/images` and fix the SVGs' final newline |
| `scripts/dump_drawio_svg.py` | One line per cell of the diagram embedded in an exported SVG/PNG (`--xml` writes the XML) |
| `references/proteinfamilies-v3-spec.js` | Full spec of the nf-core/proteinfamilies v3.0.0 map, with layout notes |
