// Metro map helpers for app.diagrams.net, driven through Claude in Chrome (javascript_tool).
// Paste this whole file into javascript_tool once per page load; it defines window.MM.
// Every function works on the page currently selected in draw.io unless it says otherwise.
(function (root) {
  // Colours that must look the same in light and dark exports are written light-dark(X,X):
  // draw.io inverts plain hex colours in a dark export.
  const PIN = c => `light-dark(${c},${c})`;
  const COLORS = { g: '#24b064', o: '#F18046', p: PIN('#EB7AEB'), b: '#3B82F6', k: 'light-dark(#000000,#FFFFFF)' };
  const FONT = 'fontFamily=Maven Pro;fontSource=https%3A%2F%2Ffonts.googleapis.com%2Fcss%3Ffamily%3DMaven%2BPro;';
  const LANE = 10;   // line width = lane spacing; a 30px station covers three adjacent lanes
  const DASH = 20;   // dashPattern "1 1" at strokeWidth 10: 10px dash, 10px gap

  // draw.io keeps its EditorUi private: catch it in the methods that synthetic resize and
  // focus events reach (windowResized, getCurrentFile), so no click is needed
  async function getUi() {
    if (root.__ui) return root.__ui;
    const proto = EditorUi.prototype, names = ['windowResized', 'getCurrentFile'], orig = {};
    for (const n of names) {
      orig[n] = proto[n];
      proto[n] = function () { root.__ui = this; return orig[n].apply(this, arguments); };
    }
    root.dispatchEvent(new Event('resize'));
    root.dispatchEvent(new Event('focus'));
    await new Promise(r => setTimeout(r, 500));
    for (const n of names) proto[n] = orig[n];
    if (!root.__ui) throw new Error('draw.io editor not found');
    return root.__ui;
  }

  // Offset a polyline by d px to the right-hand side of travel (east -> south, south -> west),
  // mitring corners, so parallel lanes are offset(centre, k * LANE)
  function offset(pts, d) {
    if (!d) return pts.map(p => [p[0], p[1]]);
    const N = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], L = Math.hypot(dx, dy);
      N.push([-dy / L, dx / L]);
    }
    return pts.map((p, i) => {
      const a = N[Math.max(0, i - 1)], b = N[Math.min(N.length - 1, i)], m = 1 + a[0] * b[0] + a[1] * b[1];
      return [p[0] + d * (a[0] + b[0]) / m, p[1] + d * (a[1] + b[1]) / m];
    });
  }

  // Direction arrows at the middle of every long straight segment; on dotted lines the arrow is
  // snapped onto the centre of a dash so it is not left floating in a gap
  function arrowPoints(pts, dotted, minLen = 90) {
    const out = [];
    let travelled = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], L = Math.hypot(x2 - x1, y2 - y1);
      if (L >= minLen && (x1 === x2 || y1 === y2)) {
        let at = L / 2;
        if (dotted) at = Math.min(L - 10, Math.max(10, Math.round((travelled + at - 5) / DASH) * DASH + 5 - travelled));
        const t = at / L;
        out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, x2 > x1 ? 'east' : x2 < x1 ? 'west' : y2 > y1 ? 'south' : 'north']);
      }
      travelled += L;
    }
    return out;
  }

  // Distinct embedded images on the current page (file icons, logos), so a spec can reuse them;
  // run it on the old map's page before building the new one. Returns [{key, length, w, h,
  // count}] and adds the style fragments to MM.images[key]; keys survive page switches.
  async function harvestImages() {
    const ui = await getUi(), seen = new Map(), known = new Map(Object.entries(MM.images).map(([k, v]) => [v, k]));
    for (const cell of Object.values(ui.editor.graph.model.cells)) {
      const m = /image=(data:image\/[^;]*[;,][^;]*)/.exec(cell.style || '');
      if (!m) continue;
      const frag = 'image=' + m[1];
      const key = known.get(frag) || 'IMG' + Object.keys(MM.images).length;
      MM.images[key] = frag;
      known.set(frag, key);
      const e = seen.get(key) || { key, length: frag.length, w: 0, h: 0, count: 0 };
      e.count++;
      if (cell.geometry) { e.w = Math.round(cell.geometry.width); e.h = Math.round(cell.geometry.height); }
      seen.set(key, e);
    }
    return [...seen.values()];
  }

  // (Re)draw a page from a spec. Wipes the page first: never run it on a page the user has
  // edited by hand. spec: {page, boxes, lines, stations, files, inputs, bars, texts, images, icons, colors}
  async function build(spec) {
    const ui = await getUi();
    const C = Object.assign({}, COLORS, spec.colors);
    let page = ui.pages.find(p => p.getName() === spec.page);
    if (!page) { page = ui.createPage(spec.page); ui.insertPage(page, ui.pages.length); }
    ui.selectPage(page);
    const g = ui.editor.graph, M = g.model, P = g.getDefaultParent();
    const V = (val, x, y, w, h, st, par) => g.insertVertex(par || P, null, val, x, y, w, h, st);
    M.beginUpdate();
    try {
      g.removeCells(g.getChildCells(P), true);
      // boxes: [label, x, y, w, h]
      for (const b of spec.boxes || []) V(b[0], b[1], b[2], b[3], b[4], 'rounded=1;arcSize=6;whiteSpace=wrap;html=1;strokeWidth=2;strokeColor=#E6E6E6;fillColor=#BDBDBD;align=left;verticalAlign=top;fontSize=50;spacing=0;fillStyle=solid;spacingTop=5;spacingLeft=12;fontStyle=1;fontColor=light-dark(#333333,#CCCCCC);');
      // lines: [colour, dotted, centrePoints, laneOffset, arrows=true]
      const arrows = [];
      for (const l of spec.lines || []) {
        const pts = offset(l[2], (l[3] || 0) * LANE);
        const e = g.insertEdge(P, null, '', null, null, 'endArrow=none;html=1;rounded=1;arcSize=40;strokeWidth=10;strokeColor=' + C[l[0]] + ';' + (l[1] ? 'dashed=1;dashPattern=1 1;' : ''));
        e.geometry.setTerminalPoint(new mxPoint(pts[0][0], pts[0][1]), true);
        e.geometry.setTerminalPoint(new mxPoint(pts[pts.length - 1][0], pts[pts.length - 1][1]), false);
        e.geometry.points = pts.slice(1, -1).map(p => new mxPoint(p[0], p[1]));
        if (l[4] !== false) arrows.push(...arrowPoints(pts, l[1]));
      }
      for (const a of arrows) V('', a[0] - 4, a[1] - 4, 8, 8, 'triangle;html=1;fillColor=default;strokeColor=none;direction=' + a[2] + ';');
      // stations: [x, y, labelHtml, labelPos a|b|l|r|ar|al|br|bl, w=30, h=30]
      for (const s of spec.stations || []) {
        const w = s[4] || 30, h = s[5] || 30;
        V('', s[0] - w / 2, s[1] - h / 2, w, h, `rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=${PIN('#FFFFFF')};strokeColor=${PIN('#000000')};strokeWidth=4;`);
        if (!s[2]) continue;
        const lw = 150, lh = 50, pos = s[3] || 'b', G = 8;
        const side = pos.includes('l') ? 'l' : pos.includes('r') ? 'r' : 'c';
        const vert = pos.includes('a') ? 'a' : pos.includes('b') ? 'b' : 'm';
        const lx = side === 'l' ? s[0] - w / 2 - G - lw : side === 'r' ? s[0] + w / 2 + G : s[0] - lw / 2;
        const ly = vert === 'a' ? s[1] - h / 2 - lh : vert === 'b' ? s[1] + h / 2 : s[1] - lh / 2;
        V(s[2], lx, ly, lw, lh, 'text;html=1;align=' + (side === 'l' ? 'right' : side === 'r' ? 'left' : 'center') + ';verticalAlign=middle;whiteSpace=wrap;strokeColor=none;fillColor=none;fontStyle=1;fontSize=20;spacing=0;');
      }
      // files: [iconLabel, x, y, stacked, captionHtml, fontSize=20]; icons from harvestImages()
      for (const f of spec.files || []) {
        const st = f[3], w = st ? 100 : 80, h = st ? 110 : 89;
        const grp = V('', f[1], f[2], w, h, 'group;');
        V('', 0, 0, w, h, 'shape=image;aspect=fixed;' + MM.images[spec.icons[st ? 'stacked' : 'single']] + ';', grp);
        V(f[0], 10, st ? 55 : 35, 60, 30, `text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;fontStyle=1;fontColor=${PIN('#FFFFFF')};fontSize=${f[5] || 20};${FONT}`, grp);
        if (f[4]) V(f[4], -40, h, w + 80, 24, 'text;html=1;align=center;verticalAlign=top;whiteSpace=wrap;strokeColor=none;fillColor=none;fontStyle=1;fontSize=16;', grp);
      }
      // bars (line stoppers next to output icons): [x, y, vertical]
      for (const b of spec.bars || []) V('', b[0] - (b[2] ? 5 : 15), b[1] - (b[2] ? 15 : 5), b[2] ? 10 : 30, b[2] ? 30 : 10, `rounded=0;fillColor=${PIN('#000000')};strokeColor=none;`);
      // input triangles: [x, y]
      for (const t of spec.inputs || []) V('', t[0], t[1] - 15, 26, 30, `triangle;html=1;fillColor=${PIN('#000000')};strokeColor=none;direction=east;`);
      // free text: [html, x, y, w, h, extraStyle]
      for (const t of spec.texts || []) V(t[0], t[1], t[2], t[3], t[4], 'text;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;fontColor=light-dark(#000000,#FFFFFF);' + (t[5] || ''));
      // images: [imageKey, x, y, w, h, extraStyle] (e.g. the logo, extraStyle 'metromapTheme=light;')
      for (const im of spec.images || []) V('', im[1], im[2], im[3], im[4], 'shape=image;aspect=fixed;imageAspect=0;' + MM.images[im[0]] + ';' + (im[5] || ''));
    } finally { M.endUpdate(); }
    return M.getChildCount(P);
  }

  // Show the diagram at a readable zoom from its top-left corner, for screenshots
  async function view(scale = 0.62, dx = 0, dy = 0) {
    const g = (await getUi()).editor.graph;
    g.view.setScale(scale);
    const b = g.getGraphBounds();
    g.container.scrollLeft = b.x - 5 + dx * scale;
    g.container.scrollTop = b.y - 5 + dy * scale;
  }

  // Pin plain black/white fills, strokes and font colours to light-dark(X,X) on the current
  // page, so the dark export does not invert them (lines are left to draw.io's dark palette)
  async function pinDarkColors() {
    const ui = await getUi(), M = ui.editor.graph.model;
    let n = 0;
    M.beginUpdate();
    try {
      for (const c of Object.values(M.cells)) {
        if (!c.vertex || !c.style) continue;
        const t = c.style.replace(/(fillColor|strokeColor|fontColor)=(#(?:FFFFFF|000000|ffffff))(?=;|$)/g, (_, k, v) => `${k}=${PIN(v.toUpperCase())}`);
        if (t !== c.style) { M.setStyle(c, t); n++; }
      }
    } finally { M.endUpdate(); }
    return n;
  }

  // One-time dark logo setup, step 1: a visible file input for the file_upload tool
  function logoInput() {
    let inp = document.getElementById('__mmLogoInput');
    if (!inp) {
      inp = Object.assign(document.createElement('input'), { type: 'file', id: '__mmLogoInput' });
      inp.style.cssText = 'position:fixed;top:0;left:0;z-index:999999';
      document.body.appendChild(inp);
    }
    return 'find "file input" and file_upload the dark logo into it';
  }

  // Large image cells on the current page (logo candidates): [{id, x, y, w, h, theme}]
  async function logoCandidates(minWidth = 200) {
    const M = (await getUi()).editor.graph.model;
    return Object.values(M.cells)
      .filter(c => c.vertex && /shape=image/.test(c.style || '') && c.geometry && c.geometry.width >= minWidth)
      .map(c => ({ id: c.id, x: c.geometry.x, y: c.geometry.y, w: c.geometry.width, h: c.geometry.height, theme: (/metromapTheme=(\w+)/.exec(c.style) || [])[1] || '' }));
  }

  // Step 2: tag the light logo, add the uploaded dark logo as a hidden copy right above it
  async function addDarkLogo(lightCellId) {
    const ui = await getUi(), g = ui.editor.graph, M = g.model;
    const inp = document.getElementById('__mmLogoInput'), file = inp && inp.files[0];
    if (!file) throw new Error('no file uploaded into the logo input');
    const uri = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); });
    const mime = uri.slice(5, uri.indexOf(';')), b64 = uri.slice(uri.indexOf(',') + 1);
    const light = M.cells[lightCellId];
    let dark;
    M.beginUpdate();
    try {
      if (!/metromapTheme=light/.test(light.style)) M.setStyle(light, light.style.replace(/;?$/, ';') + 'metromapTheme=light;');
      dark = g.cloneCell(light);
      // draw.io style form: image=data:<mime>,<base64> (no ";base64", ";" separates style keys)
      dark.style = light.style.replace(/image=data:[^;]*/, `image=data:${mime},${b64}`).replace('metromapTheme=light', 'metromapTheme=dark');
      dark.visible = false;
      M.add(light.parent, dark, light.parent.getIndex(light) + 1);
    } finally { M.endUpdate(); }
    inp.remove();
    return dark.id;
  }

  // Export light + dark PNG and SVG of the current page (transparent, scale 1, border 0,
  // editable: diagram embedded, fonts embedded). The visible logo follows the theme in memory
  // only (cell.visible + refresh: no model change, no undo step, no autosave).
  // Returns {name: bytes|string}; also kept in MM.files.
  async function exportAll(base) {
    const ui = await getUi(), graph = ui.editor.graph;
    const logos = { light: [], dark: [] };
    for (const cell of Object.values(graph.model.cells)) {
      const m = /metromapTheme=(light|dark)/.exec(cell.style || '');
      if (m) logos[m[1]].push(cell);
    }
    const before = new Map([...logos.light, ...logos.dark].map(c => [c, c.visible]));
    const show = theme => { for (const t of ['light', 'dark']) logos[t].forEach(c => { c.visible = t === theme; }); graph.refresh(); };
    const svgOf = theme => new Promise(resolve =>
      // scale, transparent, ignoreSelection, shadow, editable, embedImages, border, noCrop,
      // currentPage, linkTarget, theme, exportType, embedFonts, callback
      ui.exportSvg(1, true, true, false, true, true, 0, false, true, null, theme, 'diagram', true, resolve));
    const pngOf = theme => new Promise((resolve, reject) =>
      ui.editor.exportToCanvas(canvas => {
        const xml = ui.getFileData(true, null, null, null, true, true, null, null, null, null, null, 1, 0);
        const uri = ui.createImageDataUri(canvas, xml, 'png');
        resolve(Uint8Array.from(atob(uri.slice(uri.indexOf(',') + 1)), ch => ch.charCodeAt(0)));
      }, null, ui.thumbImageCache || (ui.thumbImageCache = {}), null, reject, null, true, 1, true, false,
      null, null, 0, false, false, theme, 'diagram'));
    const files = {};
    try {
      for (const theme of ['light', 'dark']) {
        if (logos.light.length && logos.dark.length) show(theme);
        files[`${base}_${theme}.svg`] = await svgOf(theme);
        files[`${base}_${theme}.png`] = await pngOf(theme);
      }
    } finally {
      before.forEach((visible, cell) => { cell.visible = visible; });
      graph.refresh();
    }
    MM.files = files;
    return Object.fromEntries(Object.entries(files).map(([n, d]) => [n, d.length]));
  }

  // Overlay one exported PNG at natural size on a dark or light background (null removes it)
  function preview(name, background = '#0d1117') {
    document.getElementById('__mmPreview')?.remove();
    if (!name) return 'removed';
    const ov = document.createElement('div');
    ov.id = '__mmPreview';
    ov.style.cssText = `position:fixed;inset:0;z-index:999999;background:${background};overflow:hidden`;
    const img = new Image();
    img.src = URL.createObjectURL(new Blob([MM.files[name]], { type: 'image/png' }));
    ov.appendChild(img);
    document.body.appendChild(ov);
    return 'shown';
  }

  // Zip MM.files behind a button: a script-only download is silently dropped, so the button
  // must be clicked with the computer tool; Chrome may then ask the user to press Save
  async function downloadButton(zipName) {
    const zip = new JSZip(); // bundled with draw.io
    for (const [n, d] of Object.entries(MM.files)) zip.file(n, d);
    document.getElementById('__mmDownload')?.remove();
    const a = Object.assign(document.createElement('a'), { id: '__mmDownload', download: zipName, textContent: 'Download metro maps' });
    a.href = URL.createObjectURL(await zip.generateAsync({ type: 'blob' }));
    a.style.cssText = 'position:fixed;top:200px;left:600px;z-index:999999;padding:20px 30px;background:#24b064;color:#fff;font:bold 20px sans-serif;border-radius:8px';
    a.addEventListener('click', () => setTimeout(() => a.remove(), 1000));
    document.body.appendChild(a);
    return 'click the "Download metro maps" link';
  }

  // Wait for draw.io's Drive autosave; returns the status bar text
  async function waitSaved(seconds = 40) {
    const f = (await getUi()).getCurrentFile();
    for (let i = 0; i < seconds / 2 && (f.savingFile || f.isModified()); i++) await new Promise(r => setTimeout(r, 2000));
    return document.querySelector('.geStatus')?.innerText || '';
  }

  const MM = { getUi, offset, arrowPoints, harvestImages, build, view, pinDarkColors, logoInput, logoCandidates, addDarkLogo, exportAll, preview, downloadButton, waitSaved, COLORS, LANE, images: {}, files: {} };
  root.MM = MM;
  if (typeof module !== 'undefined') module.exports = MM;
})(typeof window !== 'undefined' ? window : globalThis);
