// Worked example: the nf-core/proteinfamilies v3.0.0 metro map, as passed to MM.build().
// Load mm_core.js first, run MM.harvestImages() on the old map's page and set the icon/logo
// keys below from its output (stacked file icon 100x110, single 80x89, logo ~362x115).
// Coordinates are page px; lanes are 10px apart (MM.offset), stations 30px.
//
// Layout decisions worth reusing:
//  - colour = run mode (green create, orange update, pink merge); solid = runs per sample,
//    dotted = runs per family. The style switches inside a station, where the join is hidden.
//  - Shared module sequences are drawn once: the update lanes rejoin boxes 3-4 instead of
//    repeating mmseqs/align stations in box 2.
//  - A loop back upstream (pink merge) must cross lanes somewhere; cross where it reads as a
//    loop (box 4 entrance), not through stations.
//  - Branch alternatives (cluster|linclust, famsa|mafft) are a 4-point detour with br().
//  - Labels go on the side away from lines; 'ar'/'al'/'br'/'bl' when both sides are busy.
const off = MM.offset;
const lanes = (pts, specs) => specs.map(([c, d, k]) => [c, d, off(pts, k * 10)]);
const br = (cx, y0, dx, h) => [[cx, y0], [cx + dx * 0.4, y0 + h * 0.3], [cx + dx * 0.4, y0 + h * 0.7], [cx, y0 + h]];
const LX = 680, LY = 600;
const legend = [['g', 0, 'Create new protein families'], ['o', 0, '(Optional) Update existing families'], ['p', 0, '(Optional) Merge similar families'], ['k', 0, 'Runs per sample'], ['k', 1, 'Runs per family']];

window.SPEC = {
  page: 'v3.0.0',
  icons: { stacked: 'IMG4', single: 'IMG2' },
  boxes: [['1', 10, 10, 470, 300], ['2', 10, 320, 640, 550], ['3', 490, 10, 420, 300], ['4', 920, 10, 840, 410], ['5', 1235, 430, 525, 900], ['6', 1010, 870, 215, 220], ['7', 660, 1150, 330, 180]],
  lines: [
    // box 1 -> box 3 -> box 4 top (iterative) lane
    ['g', 0, [[148, 225], [930, 225], [930, 85], [1220, 85]]],
    ['g', 1, [[1220, 85], [1600, 85], [1600, 330]]],
    // box 4 bottom (standard) lane, per family after chunking
    ['g', 1, [[930, 225], [930, 324], [1600, 324], [1600, 455]]],
    ...lanes([[960, 334], [985, 284], [1015, 284], [1040, 334]], [['g', 1, -1], ['o', 1, 0], ['p', 1, 1]]),
    // box 2: preprocessed sequences + existing family inputs
    ['o', 0, [[148, 235], [440, 235], [440, 635]]],
    ['o', 0, [[148, 495], [440, 495], [440, 635]]],
    ['o', 0, [[148, 635], [440, 635]]],
    ['o', 0, [[148, 775], [440, 775]]],
    // unassigned sequences (per sample) rejoin clustering; hits (per family) run through 3 and 4
    ['o', 0, [[440, 630], [600, 630], [600, 225], [660, 225]]],
    ['o', 1, [[440, 640], [610, 640], [610, 235], [920, 235], [920, 334], [1590, 334], [1590, 455]]],
    ...lanes([[700, 230], [725, 180], [795, 180], [820, 230]], [['g', 0, -0.5], ['o', 1, 0.5]]),
    // existing families passed through untouched, straight to the final collection
    ['o', 1, [[440, 640], [440, 1350], [1390, 1350], [1390, 1130]]],
    // box 5 per sample
    ['g', 0, [[1600, 455], [1600, 575]]],
    ['o', 0, [[1590, 455], [1590, 575]]],
    // merge loop: out of hmmsearch, back into box 4 (both lanes), back down into box 5
    ['p', 0, [[1590, 555], [1222, 555], [1222, 425], [910, 425], [910, 75], [1220, 75]]],
    ['p', 1, [[1220, 75], [1610, 75], [1610, 590], [1580, 620]]],
    ['p', 1, [[910, 344], [1500, 344], [1500, 580], [1580, 612]]],
    // box 5 per family trunk, turning into the final per-sample row
    ...lanes([[1590, 575], [1590, 1120], [1500, 1120]], [['g', 1, -1], ['o', 1, 0]]),
    ...lanes([[1590, 610], [1590, 1120], [1500, 1120]], [['p', 1, 1]]),
    ...lanes([[1500, 1120], [1390, 1120]], [['g', 0, -1], ['o', 0, 0], ['p', 0, 1]]),
    ...lanes(br(1590, 730, -150, 80), [['g', 1, -1], ['o', 1, 0], ['p', 1, 1]]),
    ...lanes(br(1590, 890, -150, 80), [['g', 1, -1], ['o', 1, 0], ['p', 1, 1]]),
    ...lanes([[1590, 630], [1330, 690], [1330, 960], [1590, 1020]], [['g', 1, -1], ['o', 1, 0], ['p', 1, 1]]),
    // phylogeny spur: every family that went through box 5, so all three modes
    ...lanes([[1580, 1040], [1110, 1040]], [['g', 1, 0], ['o', 1, -1], ['p', 1, -2]]),
    ['g', 0, [[1110, 1040], [1110, 993]], 0, false],
    // outputs and downstream
    ['g', 0, [[1390, 1120], [760, 1120], [760, 1198]]],
    ['g', 0, [[1500, 1120], [1500, 1150]], 0, false], ['g', 0, [[1460, 1150], [1680, 1150]], 0, false],
    ['g', 0, [[1460, 1150], [1460, 1167]], 0, false], ['g', 0, [[1570, 1150], [1570, 1167]], 0, false], ['g', 0, [[1680, 1150], [1680, 1167]], 0, false],
    ['g', 0, [[1390, 1120], [1310, 1150], [1310, 1167]], 0, false],
    ['g', 0, [[960, 1120], [960, 1178]], 0, false],
    ...legend.map(([c, d], i) => [c, d, [[LX, LY + i * 42], [LX + 60, LY + i * 42]], 0, false]),
  ],
  stations: [
    [168, 230, 'seqfu<br>stats', 'a'], [226, 230, 'seqkit<br>seq', 'b'], [284, 230, 'seqkit<br>replace', 'a'], [342, 230, 'seqkit<br>rmdup', 'b'], [400, 230, 'seqfu<br>stats', 'a'],
    [440, 390, 'gunzip', 'l'], [220, 495, 'untar', 'a'], [260, 635, 'find<br>concatenate', 'a'], [220, 775, 'untar', 'a'], [440, 635, 'hmmer<br>hmmsearch', 'ar'],
    [660, 230, 'mmseqs<br>createdb', 'b'], [760, 180, 'mmseqs<br>cluster', 'a'], [760, 230, 'mmseqs<br>linclust', 'b'], [850, 230, 'mmseqs<br>createtsv', 'b'],
    [1010, 80, 'gunzip', 'a'], [1110, 80, 'hmmer<br>eslsfetchindex', 'b'], [1220, 80, 'mgnifam<br>generatefamilies', 'a'], [1380, 80, 'hhsuite<br>reformat', 'b'], [1480, 80, 'seqkit<br>seq', 'a'],
    [1000, 334, 'famsa<br>align', 'b'], [1000, 284, 'mafft<br>align', 'a'], [1110, 334, 'clipkit', 'b'], [1220, 334, 'hmmer<br>hmmbuild', 'b'], [1330, 334, 'hmmer<br>hmmsearch', 'b'], [1440, 334, 'hmmer<br>hmmalign', 'b'],
    [1595, 480, 'find<br>concatenate', 'r'], [1595, 550, 'hmmer<br>hmmsearch', 'r'],
    [1590, 680, 'mmseqs<br>createdb', 'r'], [1590, 770, 'mmseqs<br>linclust', 'r'], [1530, 770, 'mmseqs<br>cluster', 'l'], [1590, 850, 'mmseqs<br>createtsv', 'r'], [1590, 930, 'famsa<br>align', 'r'], [1530, 930, 'mafft<br>align', 'l'], [1330, 820, 'hhsuite<br>reformat', 'r'],
    [1500, 1120, 'tar', 'a'], [1390, 1120, 'find<br>concatenate', 'a'], [1110, 1050, 'cmaple', 'l', 30, 50], [960, 1120, 'multiqc', 'a'],
  ],
  files: [
    ['FAA', 20, 175, 1, 'sequences'], ['MSA', 20, 440, 1, 'full MSAs'], ['HMM', 20, 580, 1, 'HMMs'], ['MSA', 20, 720, 1, 'seed MSAs'],
    ['HMM', 1260, 1175, 1, 'HMM library'], ['MSA', 1410, 1175, 1, 'seed MSAs'], ['MSA', 1520, 1175, 1, 'full MSAs'], ['FAA', 1630, 1175, 1, 'sequences'],
    ['TREEFILE', 1060, 880, 1, '', 13], ['HTML', 920, 1185, 0, 'MultiQC'], ['CSV', 720, 1205, 0, 'proteinfold /<br>proteinannotator'],
  ],
  inputs: [[122, 230], [122, 495], [122, 635], [122, 775]],
  bars: [[1460, 1170], [1570, 1170], [1680, 1170], [1310, 1170], [960, 1181], [760, 1201], [1110, 994]],
  images: [['IMG5', 680, 450, 362, 115, 'metromapTheme=light;']],
  texts: [
    ...legend.map(([, , t], i) => [t, LX + 75, LY + i * 42 - 15, 360, 30, 'align=left;verticalAlign=middle;fontSize=20;']),
    ['<b>STAGE</b><br>1. Check quality and pre-process<br>2. (Optional) Search existing families<br>3. Cluster sequences<br>4. Generate family models &amp; MSAs<br>5. (Optional) Remove redundancies<br>6. (Optional) Build phylogenetic trees<br>7. Create downstream samplesheet', LX, 815, 325, 270, 'align=left;verticalAlign=top;fontSize=18;'],
  ],
};
