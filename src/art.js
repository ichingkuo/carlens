/* =========================================================
   車況透視鏡 — 圖示與插畫（全部為原創 SVG）
   ========================================================= */
let _uid = 0;
const uid = (p = 'u') => p + (++_uid);

const ICON = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  chevDown: '<path d="M6 9l6 6 6-6"/>',
  chevUp: '<path d="M6 15l6-6 6 6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  note: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  send: '<path d="M4.5 12L20 4.5 15.5 20l-3-6.5-8-1.5z"/><path d="M12.5 13.5L20 4.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  spark: '<path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z"/><path d="M18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  wrench: '<path d="M14.5 5.2a4.2 4.2 0 0 0-5.3 5.3L4 15.7 8.3 20l5.2-5.2a4.2 4.2 0 0 0 5.3-5.3l-2.6 2.6-2.6-.6-.6-2.6z"/>',
  car: '<path d="M5 15.5v-3.2L7 8h10l2 4.3v3.2"/><path d="M3.5 15.5h17v3h-17z"/><path d="M7.5 18.5v1.5M16.5 18.5v1.5M7.5 12.5h.01M16.5 12.5h.01"/>',
  camera: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.4"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v3.5"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  coffee: '<path d="M5 9h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5v2.5M11.5 3.5v2.5"/>',
  walk: '<circle cx="13" cy="4.6" r="1.8"/><path d="M10.5 21l2-6-2.4-3 1-4.2 3 3h3M10.4 7.9L7 10v3.2"/>',
  bag: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 18.5h18"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  phone: '<path d="M6.5 4h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 6a2 2 0 0 1 2-2z"/>',
  user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M15.5 5.2a3 3 0 0 1 0 5.6M17.5 19a6 6 0 0 0-2.5-4.9"/>',
  shield: '<path d="M12 3l7 3v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V6z"/><path d="M9 12l2 2 4-4"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
  up: '<path d="M7.5 11v9h-3v-9z"/><path d="M7.5 11l3.8-7c1.5 0 2.6 1.1 2.3 2.6l-.6 3.4h5.4a2 2 0 0 1 2 2.3l-1.2 6a2 2 0 0 1-2 1.7H7.5"/>',
  down: '<path d="M7.5 13V4h-3v9z"/><path d="M7.5 13l3.8 7c1.5 0 2.6-1.1 2.3-2.6l-.6-3.4h5.4a2 2 0 0 0 2-2.3l-1.2-6a2 2 0 0 0-2-1.7H7.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.8v.2"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.2"/>',
  cal: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5.5v13M16 5.5v13"/>',
  prev: '<path d="M14.5 6l-6 6 6 6"/>',
  next: '<path d="M9.5 6l6 6-6 6"/>',
  reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9"/><path d="M4.5 4.5V9H9"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  engine: '<path d="M4 10.5h2.5V8h7v2.5H16l2 2H20v4h-2l-2 2H8.5l-2-2H4z"/><path d="M9 8V6h4v2"/>',
  wheel: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.8"/><path d="M12 3.5v5.7M12 14.8v5.7M3.5 12h5.7M14.8 12h5.7"/>',
  seat: '<path d="M8 4.5h5.5l-1 8.5H18l1 6.5H8.5z"/><path d="M8 4.5l.5 15"/>',
  light: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>',
  chat: '<path d="M4 5h16v11H9.5L5 20v-4H4z"/>',
  kbd: '<rect x="3" y="6.5" width="18" height="11" rx="2"/><path d="M7 10.5h.01M10.5 10.5h.01M14 10.5h.01M17 10.5h.01M7.5 14h9"/>',
  board: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M9 9.5v10"/>',
  scan: '<path d="M4 8V5h3M17 5h3v3M20 16v3h-3M7 19H4v-3M6.5 12h11"/>',
  clip: '<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16.5 6.5l2 2M14.2 8.8l2 2"/>',
  chart: '<path d="M4 4v16h16"/><path d="M8.5 16v-5M12.5 16V8M16.5 16v-3"/>',
  layers: '<path d="M12 4l9 5-9 5-9-5z"/><path d="M3 14l9 5 9-5"/>',
  device: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  monitor: '<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16.5V20"/>',
  leave: '<path d="M14 4H6v16h8"/><path d="M11 12h9M17 9l3 3-3 3"/>',
  back2: '<path d="M10 4h8v16h-8"/><path d="M13 12H4M7 9l-3 3 3 3"/>',
  gift: '<rect x="4" y="10" width="16" height="10" rx="1"/><path d="M3 7.5h18V10H3zM12 7.5V20M12 7.5c-1.5-4-6-3.5-5 0M12 7.5c1.5-4 6-3.5 5 0"/>',
  book: '<path d="M5 4.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H5zM19 4.5h-4a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2h4z"/>',
  headset: '<path d="M5 14v-2a7 7 0 0 1 14 0v2"/><rect x="3.5" y="13" width="4" height="6" rx="1.5"/><rect x="16.5" y="13" width="4" height="6" rx="1.5"/>',
  card: '<rect x="3" y="6" width="18" height="12.5" rx="2"/><path d="M3 10.5h18M7 15h4"/>',
  sig: '<path d="M3 17c3-1 4-9 6-9s-1 9 1 9 3-5 4.5-5 0 4 1.5 4 2-1.5 4.5-1.5"/><path d="M3 20.5h18"/>',
  photo: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 15.5l-5-5-8 8.5"/>',
  upload: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4.5 15v4.5h15V15"/>',
  doc: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12h6M9 15.5h6"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 18h7.5a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H16"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10a4.2 4.2 0 0 1 7.5-2.6A4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  flag: '<path d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11"/>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10"/>',
  dots: '<circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/>',
};

function ic(name, size = 18, cls = '') {
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ''}</svg>`;
}

/* 產品標誌：透視鏡（鏡片＋俯視車＋掃描線） */
function brandMark(size = 34) {
  const id = uid('bm');
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF3B48"/><stop offset="1" stop-color="#C40818"/></linearGradient></defs>
    <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#${id})"/>
    <circle cx="20" cy="20" r="12.5" fill="none" stroke="#fff" stroke-width="2.4"/>
    <path d="M20 10.5c3.2 0 4.6 1.4 4.6 4.4v10.2c0 3-1.4 4.4-4.6 4.4s-4.6-1.4-4.6-4.4V14.9c0-3 1.4-4.4 4.6-4.4z" fill="#fff"/>
    <path d="M16.6 15.2h6.8M16.6 23.4h6.8" stroke="#C40818" stroke-width="1.4"/>
    <path d="M7.5 19.6h25" stroke="#FFD1D5" stroke-width="1.6" stroke-dasharray="2.5 2"/>
  </svg>`;
}

/* ---------------------------------------------------------
   2D 俯視車體（車頭朝上；車主坐左側）
   --------------------------------------------------------- */
function carGeo(type) {
  const b = BODY[type] || BODY.suv;
  const VW = 240, VH = 480, cx = 120;
  const L = b.L, W = b.W, hw = W / 2, y0 = (VH - L) / 2, y1 = y0 + L;
  const fa = y0 + L * b.fa, ra = y0 + L * b.ra;
  const wsT = y0 + b.hood, wsB = wsT + b.ws, rfE = wsB + b.roof, rwE = rfE + b.rw;
  return { b, VW, VH, cx, L, W, hw, y0, y1, fa, ra, wsT, wsB, rfE, rwE };
}

function carAnchors(type) {
  const g = carGeo(type);
  return {
    ENG: [g.cx, g.y0 + g.b.hood * 0.5],
    FL: [g.cx - g.hw - 4, g.fa],
    FR: [g.cx + g.hw + 4, g.fa],
    RL: [g.cx - g.hw - 4, g.ra],
    RR: [g.cx + g.hw + 4, g.ra],
    CAB: [g.cx, g.wsB + g.b.roof * 0.48],
    REAR: [g.cx, g.y1 - 16],
  };
}

function carBodyPath(g) {
  const { cx, hw, y0, y1, fa, ra, b } = g;
  const f = b.rF, r = b.rR;
  return `M${cx} ${y0}
    C${cx + hw * .55} ${y0} ${cx + hw * .9} ${y0 + 4} ${cx + hw * .95} ${y0 + f * .7}
    C${cx + hw} ${y0 + f} ${cx + hw} ${fa - 30} ${cx + hw} ${fa}
    L${cx + hw} ${ra}
    C${cx + hw} ${y1 - r * .9} ${cx + hw * .96} ${y1 - 6} ${cx + hw * .7} ${y1 - 2}
    C${cx + hw * .4} ${y1 + 1} ${cx - hw * .4} ${y1 + 1} ${cx - hw * .7} ${y1 - 2}
    C${cx - hw * .96} ${y1 - 6} ${cx - hw} ${y1 - r * .9} ${cx - hw} ${ra}
    L${cx - hw} ${fa}
    C${cx - hw} ${fa - 30} ${cx - hw} ${y0 + f} ${cx - hw * .95} ${y0 + f * .7}
    C${cx - hw * .9} ${y0 + 4} ${cx - hw * .55} ${y0} ${cx} ${y0} Z`;
}

function carSVG(type, opt = {}) {
  const g = carGeo(type);
  const { b, cx, hw, y0, y1, fa, ra, wsT, wsB, rfE, rwE } = g;
  const id = uid('car');
  const xr = !!opt.xray;
  const gw1 = hw * 0.70, gw2 = hw * 0.84;
  const wheel = (x, y) => `<rect x="${x}" y="${y - 29}" width="20" height="58" rx="7" class="cw"/>`;
  const wheels = [wheel(cx + hw - 13, fa), wheel(cx - hw - 7, fa), wheel(cx + hw - 13, ra), wheel(cx - hw - 7, ra)].join('');
  const body = carBodyPath(g);
  const ws = `M${cx - gw1} ${wsT + 8} Q${cx} ${wsT - 7} ${cx + gw1} ${wsT + 8} L${cx + gw2} ${wsB} L${cx - gw2} ${wsB} Z`;
  const rw = `M${cx - gw2} ${rfE} L${cx + gw2} ${rfE} L${cx + gw1 * .94} ${rwE - 4} Q${cx} ${rwE + 5} ${cx - gw1 * .94} ${rwE - 4} Z`;
  const sideL = `M${cx - gw2 - 1.5} ${wsB - 2} L${cx - hw + 6} ${wsB + 12} L${cx - hw + 6} ${rfE - 8} L${cx - gw2 - 1.5} ${rfE + 2} Z`;
  const sideR = `M${cx + gw2 + 1.5} ${wsB - 2} L${cx + hw - 6} ${wsB + 12} L${cx + hw - 6} ${rfE - 8} L${cx + gw2 + 1.5} ${rfE + 2} Z`;
  const hoodL = `M${cx - hw * .42} ${y0 + 16} Q${cx - hw * .5} ${wsT - 24} ${cx - hw * .52} ${wsT + 4}`;
  const hoodR = `M${cx + hw * .42} ${y0 + 16} Q${cx + hw * .5} ${wsT - 24} ${cx + hw * .52} ${wsT + 4}`;
  const f = b.rF, r = b.rR;
  const hlR = `M${cx + hw * .46} ${y0 + 6} Q${cx + hw * .84} ${y0 + 8} ${cx + hw * .94} ${y0 + f * .58} L${cx + hw * .82} ${y0 + f * .52} Q${cx + hw * .66} ${y0 + 15} ${cx + hw * .44} ${y0 + 12} Z`;
  const hlL = `M${cx - hw * .46} ${y0 + 6} Q${cx - hw * .84} ${y0 + 8} ${cx - hw * .94} ${y0 + f * .58} L${cx - hw * .82} ${y0 + f * .52} Q${cx - hw * .66} ${y0 + 15} ${cx - hw * .44} ${y0 + 12} Z`;
  const tlR = `M${cx + hw * .6} ${y1 - 3} Q${cx + hw * .92} ${y1 - 7} ${cx + hw * .98} ${y1 - r * .72} L${cx + hw * .88} ${y1 - r * .64} Q${cx + hw * .82} ${y1 - 10} ${cx + hw * .58} ${y1 - 9} Z`;
  const tlL = `M${cx - hw * .6} ${y1 - 3} Q${cx - hw * .92} ${y1 - 7} ${cx - hw * .98} ${y1 - r * .72} L${cx - hw * .88} ${y1 - r * .64} Q${cx - hw * .82} ${y1 - 10} ${cx - hw * .58} ${y1 - 9} Z`;
  const myY = wsT + b.ws * 0.32;
  let extra = '';
  if (type === 'suv') {
    extra += `<path d="M${cx - gw2 * .8} ${wsB + 12} L${cx - gw2 * .8} ${rfE - 12} M${cx + gw2 * .8} ${wsB + 12} L${cx + gw2 * .8} ${rfE - 12}" class="crail"/>`;
    extra += `<path d="M${cx} ${rfE - 26} q4 6 0 14 q-4 -8 0 -14z" class="cfin"/>`;
  } else if (type === 'sedan') {
    extra += `<path d="M${cx - hw * .72} ${rwE + 10} Q${cx} ${rwE + 3} ${cx + hw * .72} ${rwE + 10}" class="cline"/>`;
  } else if (type === 'mpv') {
    extra += `<path d="M${cx - hw + 2.5} ${g.wsB + 40} L${cx - hw + 2.5} ${g.rfE - 6} M${cx + hw - 2.5} ${g.wsB + 40} L${cx + hw - 2.5} ${g.rfE - 6}" class="cline"/>`;
    extra += `<path d="M${cx - gw2} ${rwE + 8} Q${cx} ${rwE + 2} ${cx + gw2} ${rwE + 8}" class="cline"/>`;
  }

  let xray = '';
  if (xr) {
    const eng = `<rect x="${cx - 32}" y="${y0 + 20}" width="64" height="${Math.max(30, b.hood - 44)}" rx="8" class="xc"/>
      ${[0, 1, 2, 3].map(i => `<circle cx="${cx - 21 + i * 14}" cy="${y0 + 20 + Math.max(30, b.hood - 44) / 2}" r="4.5" class="xc"/>`).join('')}
      <rect x="${cx + hw * .5}" y="${y0 + 26}" width="18" height="13" rx="2" class="xc"/>
      <circle cx="${cx - 40}" cy="${y0 + 30}" r="4" class="xc"/>`;
    const axle = `<path d="M${cx - hw + 8} ${fa} H${cx + hw - 8} M${cx - hw + 8} ${ra} H${cx + hw - 8}" class="xc xd"/>`;
    const disc = (x, y, s) => `<path d="M${x} ${y - 16} V${y + 16}" class="xc xdisc"/><rect x="${x + (s > 0 ? -7 : 2)}" y="${y - 7}" width="5" height="14" rx="1.5" class="xc"/>`;
    const discs = disc(cx + hw - 17, fa, 1) + disc(cx - hw + 17, fa, -1) + disc(cx + hw - 17, ra, 1) + disc(cx - hw + 17, ra, -1);
    const seatW = hw * 0.62, seatH = 34;
    const rows = type === 'mpv' ? 3 : 2;
    let seats = `<rect x="${cx - hw * .74}" y="${wsB + 14}" width="${seatW}" height="${seatH}" rx="8" class="xc"/>
      <rect x="${cx + hw * .12}" y="${wsB + 14}" width="${seatW}" height="${seatH}" rx="8" class="xc"/>
      <ellipse cx="${cx - hw * .43}" cy="${wsB + 4}" rx="11" ry="3.5" class="xc"/>`;
    for (let i = 1; i < rows; i++) {
      seats += `<rect x="${cx - hw * .74}" y="${wsB + 14 + i * (seatH + 16)}" width="${hw * 1.48}" height="${seatH - 4}" rx="9" class="xc"/>`;
    }
    const acf = `<rect x="${cx + hw * .28}" y="${wsB - 10}" width="22" height="9" rx="1.5" class="xc xhot"/><path d="M${cx + hw * .28 + 5} ${wsB - 10}v9M${cx + hw * .28 + 11} ${wsB - 10}v9M${cx + hw * .28 + 17} ${wsB - 10}v9" class="xc"/>`;
    const exh = `<path d="M${cx - 10} ${wsB + 30} C${cx - 14} ${rfE} ${cx - hw * .45} ${ra + 10} ${cx - hw * .5} ${y1 - 4}" class="xc xd"/>`;
    xray = `<g class="xray-parts">${axle}${exh}${eng}${discs}${seats}${acf}</g>`;
  }

  return `<svg class="carsvg ${xr ? 'is-xray' : ''}" viewBox="0 0 240 480" preserveAspectRatio="xMidYMid meet" aria-label="${b.label}俯視圖">
    <defs>
      <radialGradient id="${id}b" cx="50%" cy="45%" r="62%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".72" stop-color="#EEF1F5"/><stop offset="1" stop-color="#C9D1DC"/></radialGradient>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#40536B"/><stop offset="1" stop-color="#1B2635"/></linearGradient>
      <linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E7EBF0"/><stop offset=".5" stop-color="#FBFCFD"/><stop offset="1" stop-color="#E7EBF0"/></linearGradient>
      <filter id="${id}s" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>
    </defs>
    ${xr ? '' : `<ellipse cx="${cx}" cy="${(y0 + y1) / 2 + 8}" rx="${hw + 14}" ry="${g.L / 2 + 6}" fill="rgba(0,0,0,.45)" filter="url(#${id}s)"/>`}
    <g class="cwheels">${wheels}</g>
    <ellipse cx="${cx - hw - 6}" cy="${myY}" rx="8" ry="4.6" class="cmirror" ${xr ? '' : `fill="url(#${id}b)"`}/>
    <ellipse cx="${cx + hw + 6}" cy="${myY}" rx="8" ry="4.6" class="cmirror" ${xr ? '' : `fill="url(#${id}b)"`}/>
    <path d="${body}" class="cbody" ${xr ? '' : `fill="url(#${id}b)"`}/>
    <path d="${hoodL}" class="cline"/><path d="${hoodR}" class="cline"/>
    <path d="${hlR}" class="chl"/><path d="${hlL}" class="chl"/>
    <path d="${tlR}" class="ctl"/><path d="${tlL}" class="ctl"/>
    <path d="${ws}" class="cglass" ${xr ? '' : `fill="url(#${id}g)"`}/>
    <path d="${sideL}" class="cglass" ${xr ? '' : `fill="url(#${id}g)"`}/>
    <path d="${sideR}" class="cglass" ${xr ? '' : `fill="url(#${id}g)"`}/>
    <rect x="${cx - gw2}" y="${wsB}" width="${gw2 * 2}" height="${b.roof}" rx="9" class="croof" ${xr ? '' : `fill="url(#${id}r)"`}/>
    <path d="${rw}" class="cglass" ${xr ? '' : `fill="url(#${id}g)"`}/>
    ${extra}
    ${xray}
  </svg>`;
}

/* ---------------------------------------------------------
   零件對比插畫（新品 vs 目前）
   --------------------------------------------------------- */
function svgWrap(inner, vb = '0 0 120 84', cls = 'art') {
  return `<svg class="${cls}" viewBox="${vb}" aria-hidden="true">${inner}</svg>`;
}

function padInner(mm) {
  const id = uid('pd');
  const h = Math.max(3, mm / 10 * 44), top = 60 - h;
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A3836A"/><stop offset="1" stop-color="#6B513F"/></linearGradient>
    <pattern id="${id}p" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1.3" cy="1.4" r=".6" fill="rgba(255,255,255,.22)"/><circle cx="3.8" cy="3.7" r=".55" fill="rgba(0,0,0,.22)"/></pattern></defs>
    <rect x="12" y="60" width="96" height="10" rx="2.5" fill="#8B95A3"/><rect x="12" y="60" width="96" height="2.6" fill="rgba(255,255,255,.35)"/>
    <path d="M18 60 V${top + 5} Q18 ${top} 23 ${top} H97 Q102 ${top} 102 ${top + 5} V60 Z" fill="url(#${id})"/>
    <path d="M18 60 V${top + 5} Q18 ${top} 23 ${top} H97 Q102 ${top} 102 ${top + 5} V60 Z" fill="url(#${id}p)"/>
    ${h > 12 ? `<path d="M60 ${top + 3} V58" stroke="rgba(0,0,0,.28)" stroke-width="1.6"/>` : ''}
    <path d="M110 ${top} V60 M107 ${top} H113 M107 60 H113" stroke="#3B4350" stroke-width="1.2"/>`;
}

function treadInner(mm, uneven) {
  const base = 50;
  const blocks = [0, 1, 2, 3, 4].map(i => {
    let d = mm;
    if (uneven) d = mm + (i - 2) * 0.35;
    const h = Math.max(2, d / 8 * 26), x = 14 + i * 19.5;
    return `<rect x="${x}" y="${base - h}" width="15" height="${h + 2}" rx="2" fill="#3B414B"/><rect x="${x}" y="${base - h}" width="15" height="2" rx="1" fill="#5A616D"/>`;
  }).join('');
  return `<path d="M8 76 Q8 52 18 50 H102 Q112 52 112 76 Z" fill="#262A31"/>
    <path d="M12 59 H108" stroke="#454B55" stroke-width="1" stroke-dasharray="3 3"/>
    ${blocks}
    <path d="M114 ${base - mm / 8 * 26} V${base}" stroke="#3B4350" stroke-width="1.2"/><path d="M111 ${base - mm / 8 * 26} H117 M111 ${base} H117" stroke="#3B4350" stroke-width="1.2"/>`;
}

function tires4Inner(m) {
  const t = (x, y, d, front) => {
    const c = d < 5 ? '#E8A33C' : '#4BB37A';
    return `<rect x="${x}" y="${y}" width="22" height="36" rx="6" fill="#2B3038"/><rect x="${x + 4}" y="${y + 4}" width="14" height="28" rx="3" fill="${c}" opacity=".85"/>
      <text x="${x + 11}" y="${y + 52}" text-anchor="middle" class="tx">${d.toFixed(1)}</text>`;
  };
  return `<rect x="46" y="10" width="68" height="104" rx="22" fill="#E9EDF2" stroke="#C3CBD6"/>
    ${t(20, 14, m.trFL)}${t(118, 14, m.trFR)}${t(20, 66, m.trRL)}${t(118, 66, m.trRR)}
    <path d="M31 53 V63 M129 53 V63" stroke="#2E7CF6" stroke-width="1.6" marker-end="none"/>
    <path d="M27 57 l4 -4 4 4 M27 59 l4 4 4 -4 M125 57 l4 -4 4 4 M125 59 l4 4 4 -4" stroke="#2E7CF6" stroke-width="1.6" fill="none"/>`;
}

function oilInner(fresh) {
  const id = uid('oil');
  const c1 = fresh ? '#F7D774' : '#6A4A2C', c2 = fresh ? '#D9971F' : '#1E140B';
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <path d="M60 6 C72 24 86 38 86 54 A26 26 0 0 1 34 54 C34 38 48 24 60 6Z" fill="url(#${id})"/>
    <ellipse cx="50" cy="52" rx="5" ry="10" fill="rgba(255,255,255,${fresh ? .45 : .18})" transform="rotate(18 50 52)"/>`;
}

function filterInner(state) {
  const dirty = state !== '良好';
  const heavy = state === '髒污';
  const lines = Array.from({ length: 15 }, (_, i) => `<path d="M${19 + i * 6} 18 V66" stroke="${dirty ? (heavy ? '#8C8273' : '#ADA595') : '#D3D9E1'}" stroke-width="1.4"/>`).join('');
  const specks = dirty ? [[28, 26], [41, 49], [57, 31], [73, 58], [88, 37], [35, 61], [66, 44], [93, 22], [50, 60], [81, 27]].slice(0, heavy ? 10 : 7)
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${1 + (i % 3) * .5}" fill="#6E6457" opacity=".75"/>`).join('') : '';
  const leaf = dirty ? `<path d="M70 46 q8 -10 16 -4 q-6 10 -16 4z" fill="#9A8A49" opacity=".9"/><path d="M71 46 l13 -3" stroke="#6E6232" stroke-width=".8"/>` : '';
  return `<rect x="13" y="13" width="94" height="58" rx="4" fill="${dirty ? (heavy ? '#BDB4A5' : '#D9D2C5') : '#F8F9FB'}" stroke="#9AA3AF" stroke-width="1.4"/>${lines}${specks}${leaf}`;
}

function rotorInner(grooved) {
  const id = uid('rt');
  const rings = grooved ? Array.from({ length: 6 }, (_, i) => `<circle cx="60" cy="42" r="${21 + i * 2.4}" fill="none" stroke="rgba(55,55,55,.38)" stroke-width="${i % 2 ? .7 : 1.1}"/>`).join('') : '';
  return `<defs><radialGradient id="${id}" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#E4E8EC"/><stop offset="1" stop-color="#9AA2AC"/></radialGradient></defs>
    <circle cx="60" cy="42" r="36" fill="url(#${id})"/>
    ${grooved ? '<circle cx="60" cy="42" r="35.3" fill="none" stroke="#9B6B4A" stroke-width="1.6" opacity=".55"/>' : ''}
    ${rings}
    <circle cx="60" cy="42" r="16" fill="#8A929C"/>
    ${[0, 1, 2, 3, 4].map(i => { const a = i / 5 * Math.PI * 2; return `<circle cx="${60 + Math.cos(a) * 10}" cy="${42 + Math.sin(a) * 10}" r="2" fill="#5E6670"/>`; }).join('')}
    <circle cx="60" cy="42" r="4.5" fill="#6B737D"/>`;
}

function artFor(item, which) {
  const c = item.cmp || {};
  switch (c.kind) {
    case 'pad': return svgWrap(padInner(which === 'new' ? STD.padNew : c.cur));
    case 'tread': return which === 'new' ? svgWrap(treadInner(STD.treadNew, false)) : svgWrap(tires4Inner(S.meas), '0 0 160 124');
    case 'oil': return svgWrap(oilInner(which === 'new'));
    case 'filter': return svgWrap(filterInner(which === 'new' ? '良好' : S.meas.ac));
    case 'rotor': return svgWrap(rotorInner(which !== 'new'));
    default: return '';
  }
}

function thumbArt(kind) {
  switch (kind) {
    case 'pad': return svgWrap(padInner(3.2));
    case 'tread': return svgWrap(treadInner(4.1, true));
    case 'oil': return svgWrap(oilInner(false));
    case 'filter': return svgWrap(filterInner('輕微髒污'));
    case 'rotor': return svgWrap(rotorInner(true));
    default: return '';
  }
}

/* 現場照片（示意）：工作燈、景深暗角、顆粒 */
function photoArt(kind) {
  const id = uid('ph');
  let inner = '', tf = 'translate(70 14) scale(1.5)';
  if (kind === 'pad') inner = padInner(3.2);
  else if (kind === 'tread') { inner = treadInner(4.1, true); tf = 'translate(60 20) scale(1.65)'; }
  else if (kind === 'oil') inner = oilInner(false);
  else if (kind === 'filter') inner = filterInner(S.meas.ac);
  else if (kind === 'rotor') { inner = rotorInner(true); tf = 'translate(64 6) scale(1.6)'; }
  return `<svg class="photo-svg" viewBox="0 0 320 168" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <radialGradient id="${id}bg" cx="45%" cy="40%" r="75%"><stop offset="0" stop-color="#5B6472"/><stop offset=".6" stop-color="#2E333B"/><stop offset="1" stop-color="#15181D"/></radialGradient>
      <radialGradient id="${id}v" cx="50%" cy="50%" r="70%"><stop offset=".55" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.55)"/></radialGradient>
      <filter id="${id}n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    </defs>
    <rect width="320" height="168" fill="url(#${id}bg)"/>
    <path d="M0 132 L320 118 L320 168 L0 168Z" fill="rgba(0,0,0,.25)"/>
    <g transform="${tf}">${inner}</g>
    <rect width="320" height="168" fill="url(#${id}v)"/>
    <rect width="320" height="168" filter="url(#${id}n)" opacity=".10"/>
  </svg>`;
}

/* 入口車牌辨識攝影機畫面 */
function gateScene(state) {
  const arrived = state !== 'idle';
  const id = uid('gc');
  const car = arrived ? `
    <g class="gate-car">
      <ellipse cx="240" cy="236" rx="120" ry="12" fill="rgba(0,0,0,.5)"/>
      <path d="M150 230 V176 Q150 160 165 152 L190 112 Q196 102 210 101 H270 Q284 102 290 112 L315 152 Q330 160 330 176 V230 Z" fill="#E9EDF2"/>
      <path d="M196 118 Q200 108 212 108 H268 Q280 108 284 118 L298 146 H182 Z" fill="#2A3646"/>
      <path d="M160 168 Q182 160 204 166 L200 176 Q178 176 160 176 Z" fill="#CFE3FF"/><path d="M320 168 Q298 160 276 166 L280 176 Q302 176 320 176 Z" fill="#CFE3FF"/>
      <path d="M190 182 H290 L282 206 H198 Z" fill="#2B3038"/>
      <path d="M198 189 H282 M201 196 H279" stroke="#4A515C" stroke-width="2"/>
      <rect x="206" y="210" width="68" height="17" rx="2" fill="#F9FAFB" stroke="#1F2329" stroke-width="1.4"/>
      <text x="240" y="223" text-anchor="middle" font-size="12" font-weight="700" fill="#15181D" font-family="Saira Semi Condensed, Bahnschrift, Arial">ABC-1234</text>
      <rect x="146" y="214" width="20" height="22" rx="4" fill="#20242B"/><rect x="314" y="214" width="20" height="22" rx="4" fill="#20242B"/>
      <path d="M150 152 l-14 -4 q-4 0 -3 5 l14 4z M330 152 l14 -4 q4 0 3 5 l-14 4z" fill="#D9DEE5"/>
    </g>
    <g class="gate-lock"><path d="M196 204 v-8 h8 M284 204 v-8 h-8 M196 234 v8 h8 M284 234 v8 h-8" stroke="#3EE59B" stroke-width="2.4" fill="none"/></g>` : '';
  return `<svg viewBox="0 0 480 270" class="gate-svg" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A1F27"/><stop offset="1" stop-color="#2C323B"/></linearGradient></defs>
    <rect width="480" height="270" fill="url(#${id})"/>
    <path d="M0 150 H480" stroke="#3A414C"/>
    <path d="M80 270 L200 150 M400 270 L280 150" stroke="#E7C04B" stroke-width="3" stroke-dasharray="14 12" opacity=".55"/>
    <rect x="18" y="26" width="120" height="70" rx="4" fill="#232933" stroke="#3A414C"/>
    <text x="78" y="56" text-anchor="middle" font-size="11" fill="#8C96A3" font-family="Noto Sans TC, sans-serif">服務廠入口</text>
    <text x="78" y="76" text-anchor="middle" font-size="10" fill="#E7C04B" font-family="Noto Sans TC, sans-serif">預約車輛請直行</text>
    ${car}
  </svg>`;
}

/* 健康度環（完工頁） */
function ringSVG(pct, size = 120, stroke = 10, color = '#1E9E5B', track = '#E5E9EE') {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, pct)));
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="ring" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  </svg>`;
}

/* 圖文選單插圖 */
function menuArt(kind) {
  const m = {
    book: `<circle cx="28" cy="28" r="22" fill="#FFE7E9"/><rect x="17" y="15" width="22" height="27" rx="3" fill="#fff" stroke="#EB0A1E" stroke-width="2"/><path d="M22 23h12M22 28h12M22 33h8" stroke="#EB0A1E" stroke-width="2" stroke-linecap="round"/>`,
    cal: `<circle cx="28" cy="28" r="22" fill="#E7F0FF"/><rect x="15" y="17" width="26" height="23" rx="3" fill="#fff" stroke="#2E7CF6" stroke-width="2"/><path d="M15 24h26M21 13v7M35 13v7" stroke="#2E7CF6" stroke-width="2" stroke-linecap="round"/><circle cx="23" cy="31" r="2" fill="#EB0A1E"/>`,
    lens: `<circle cx="28" cy="28" r="22" fill="#FFE7E9"/><circle cx="27" cy="27" r="11" fill="#fff" stroke="#EB0A1E" stroke-width="2.4"/><path d="M35 35l7 7" stroke="#EB0A1E" stroke-width="3" stroke-linecap="round"/><rect x="23.5" y="20" width="7" height="14" rx="3" fill="#EB0A1E"/>`,
    clock: `<circle cx="28" cy="28" r="22" fill="#FFF3DF"/><circle cx="28" cy="28" r="12" fill="#fff" stroke="#F29100" stroke-width="2.4"/><path d="M28 21v7l5 3" stroke="#F29100" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,
    head: `<circle cx="28" cy="28" r="22" fill="#E6F6EE"/><path d="M17 31v-3a11 11 0 0 1 22 0v3" stroke="#1E9E5B" stroke-width="2.4" fill="none"/><rect x="14" y="29" width="6" height="9" rx="2" fill="#1E9E5B"/><rect x="36" y="29" width="6" height="9" rx="2" fill="#1E9E5B"/>`,
    gift: `<circle cx="28" cy="28" r="22" fill="#FFF3DF"/><rect x="17" y="25" width="22" height="15" rx="2" fill="#F29100"/><rect x="15" y="20" width="26" height="6" rx="1.5" fill="#F7B13D"/><path d="M28 20v20" stroke="#fff" stroke-width="2.4"/>`,
  };
  return `<svg viewBox="0 0 56 56" width="40" height="40" aria-hidden="true">${m[kind] || ''}</svg>`;
}
