/* =========================================================
   車況透視鏡 — 核心：工具、狀態、時鐘、規則引擎、ETA
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + Math.round(n).toLocaleString('en-US');
const fmtN = n => Math.round(n).toLocaleString('en-US');
const f1 = n => Number(n).toFixed(1);
const hm = m => { m = Math.round(m); const h = Math.floor(m / 60), mm = ((m % 60) + 60) % 60; return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
const T = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const nl2br = s => esc(s).replace(/\n/g, '<br>');

function freshState() {
  return {
    view: 'present',
    now: T('13:15'),
    load: 'normal',
    body: 'suv',
    stage: 'booked',          // booked → reminded → arrived → inspected → confirmed → repairing → done
    chat: [], msgSeq: 0,
    footer: 'menu',
    menuTab: 0,
    typing: false,
    liff: [],
    liffAnim: '',
    sheet: null,
    dialog: null,
    sel: { oil: true, brake: false, rotate: false, ac: false },
    addonState: 'none',       // none | pending | accepted | declined
    inspect: { status: 'idle', step: -1, approved: false, provider: '' },
    addonDraft: { status: 'idle', step: -1, approved: false },
    meas: JSON.parse(JSON.stringify(MEAS0)),
    note: TECH_NOTE0,
    photos: {},
    threads: {},
    activity: [],
    handoffs: [],
    mode: 'digital',          // digital | advisor
    agree: false, signed: false, sigData: null,
    confirm: null,
    work: { start: null, doneAt: null, nodesDone: 0 },
    remind: true,
    away: false,
    arrivedAt: null, inspectedAt: null, reportOpenedAt: null,
    pay: null, survey: null, lounge: null,
    booking2: null,
    scanned: false, xray: false,
    metrics: { aiQ: 0, up: 0, down: 0, handoff: 0 },
    step: 0, playing: false, speed: 1,
    consoleTab: 'board',
    gate: 'idle',
    railCollapsed: false,
    banner: null,
  };
}

let S = freshState();
S.ai = { mode: 'local', key: '', model: 'gemini-3.8-flash' };
try {
  const saved = JSON.parse(localStorage.getItem('carlens.ai') || 'null');
  if (saved && typeof saved === 'object') Object.assign(S.ai, saved);
} catch (e) { /* 本機檔案或隱私模式可能無法存取 */ }

/* ---------- 規則引擎：嚴重度依原廠標準判定（AI 不決定嚴重度） ---------- */
function rules(m = S.meas) {
  const minPad = Math.min(m.padFR, m.padFL);
  const kmLeft = Math.max(0, (minPad - STD.padLimit) / STD.padWearPerK * 1000);
  const brakeSev = minPad <= STD.padLimit ? 'p1' : kmLeft < 10000 ? 'p1' : kmLeft < 20000 ? 'p2' : 'ok';
  const front = (m.trFL + m.trFR) / 2, rear = (m.trRL + m.trRR) / 2, diff = rear - front;
  const rotSev = diff >= STD.rotateDiff ? 'p2' : diff >= 1.0 ? 'p3' : 'ok';
  const oilSev = m.oilKm >= STD.oilInterval ? 'p2' : m.oilKm >= 9000 ? 'p3' : 'ok';
  const acSev = m.ac === '髒污' ? 'p2' : m.ac === '輕微髒污' ? 'p3' : 'ok';
  return { minPad, kmLeft, brakeSev, front, rear, diff, rotSev, oilSev, acSev };
}

const AIO = {}; // Gemini 改寫後的白話說明（審核後生效）

function itemView(id) {
  const m = S.meas, R = rules(m), dr = D.driving, o = AIO[id] || {};
  if (id === 'brake') {
    const side = m.padFR <= m.padFL ? '右前' : '左前';
    const km = Math.round(R.kmLeft / 100) * 100;
    const weeks = Math.max(1, Math.round(R.kmLeft / (dr.monthKm / 4.33)));
    const atNext = Math.max(0.5, R.minPad - STD.padWearPerK * 9.9);
    const under = R.minPad <= STD.padLimit;
    return {
      id, name: '前煞車來令片', short: '煞車來令片', zones: ['FR', 'FL'], zone: side === '右前' ? 'FR' : 'FL', sev: R.brakeSev,
      measure: `右前 ${f1(m.padFR)} mm｜左前 ${f1(m.padFL)} mm`,
      line1: `目前厚度 ${f1(R.minPad)} mm`, line2: `建議更換 ≤ ${f1(STD.padLimit)} mm`,
      cmp: { kind: 'pad', cur: R.minPad, newLabel: '正常狀況（新品）', curLabel: `目前狀況（${side}）`, newText: '約 10 mm', curText: `${f1(R.minPad)} mm` },
      gauge: { from: 10, to: 0, cur: R.minPad, limit: STD.padLimit, fromLabel: '10mm 新品', limitLabel: '3.0mm 建議更換', toLabel: '0mm', curLabel: `${f1(R.minPad)}mm 目前` },
      plain: o.plain || ('煞車來令片就像鞋底，每踩一次煞車都會磨掉一點。' + (under ? `${side}輪的來令片已經磨到更換線以下。` : `${side}輪的來令片只剩新品約三分之一，快到更換線了。`)),
      whyTitle: '為什麼建議本次更換？',
      why: o.why || (under ? `${side}來令片 ${f1(R.minPad)} mm，已低於原廠建議更換標準（${f1(STD.padLimit)} mm），建議本次更換。`
        : `目前厚度已接近建議更換範圍。依您近 6 個月的磨耗速度（每千公里約 ${STD.padWearPerK} mm），約再行駛 ${fmtN(km)} 公里（約 ${weeks} 週）就會低於標準，早於下次保養。`),
      forecast: atNext < 2.5 ? `若等到下次保養（約 6 個月後）才更換，預估只剩約 ${atNext.toFixed(1)} mm` : '',
      risks: ['煞車距離變長、腳感變軟', '磨盡後金屬直接摩擦碟盤，產生尖銳異音', '碟盤一併受損，費用可能增加 $4,000 以上'],
      insight: {
        title: '為什麼磨得比較快？依您的行車數據',
        rows: [['市區行駛占比', `${dr.city}%`, '近 6 個月'], ['每百公里急煞', `${dr.hardBrake} 次`, `同車型平均 ${dr.hardBrakeAvg} 次`], ['平均時速', `${dr.speed} km/h`, '走走停停路況']],
        note: '頻繁煞停會讓來令片磨耗加快，屬正常使用現象，並非零件品質問題。',
      },
      price: PRICE.brake.total, labor: PRICE.brake.labor, priceNote: PRICE.brake.note,
      photo: { at: '14:09', where: `${side}輪`, kind: 'pad' },
      sources: ['本次工單量測', '原廠保養手冊', '車輛行車數據'],
      vars: { side, min: f1(R.minPad), km: fmtN(km), weeks, atNext: atNext.toFixed(1), under },
    };
  }
  if (id === 'rotate') {
    const diff = R.diff;
    return {
      id, name: '輪胎調位', short: '輪胎調位', zones: ['FR', 'FL'], zone: 'FR', sev: R.rotSev,
      measure: `胎紋 前 ${f1(m.trFR)} / ${f1(m.trFL)} mm｜後 ${f1(m.trRR)} / ${f1(m.trRL)} mm`,
      line1: `胎紋深度 ${f1(Math.min(m.trFR, m.trFL))} mm`, line2: `前後差 ${f1(diff)} mm（建議 ≤ ${f1(STD.rotateDiff)}）`,
      cmp: { kind: 'tread', newLabel: '正常狀況（新胎）', curLabel: '目前四輪胎紋', newText: '約 8.0 mm', curText: `前 ${f1(R.front)}｜後 ${f1(R.rear)} mm` },
      gauge: { from: 8, to: 0, cur: Math.min(m.trFR, m.trFL), limit: STD.treadLimit, extra: R.rear, extraLabel: `後輪 ${f1(R.rear)}`, fromLabel: '8mm 新胎', limitLabel: '3.0mm 建議換胎', toLabel: '0mm', curLabel: `前輪 ${f1(Math.min(m.trFR, m.trFL))}` },
      plain: o.plain || '前輪負責轉向、承重也較多，磨得比後輪快。把前後輪交換位置，四條輪胎就能平均磨耗，整組用得更久。',
      whyTitle: '為什麼建議本次調位？',
      why: o.why || `前後輪胎紋已相差 ${f1(diff)} mm，超過建議調位的差距。本次更換煞車來令片本來就要拆輪，合併施作只多約 5 分鐘。`,
      risks: ['前輪提早到達更換標準，可能需提早換胎（一組約 $12,000 起）', '前後抓地力差異變大，雨天操控較不穩定'],
      insight: { title: '與您的保養紀錄', rows: [['上次調位', '2025/04', '約 3 萬公里前'], ['市區行駛占比', `${dr.city}%`, '轉彎與煞停較多']], note: '原廠建議約每 1 萬公里檢查並視需要調位。' },
      price: PRICE.rotate.total, labor: S.sel.brake ? PRICE.rotate.labor : PRICE.rotate.laborAlone, priceNote: PRICE.rotate.note,
      laborNote: S.sel.brake ? '與煞車作業同時拆輪' : '單獨施作',
      photo: { at: '14:08', where: '前後輪胎紋', kind: 'tread' },
      sources: ['本次工單量測', '原廠保養手冊', '保養紀錄'],
      vars: { diff: f1(diff), front: f1(R.front), rear: f1(R.rear), min: f1(Math.min(m.trFR, m.trFL, m.trRL, m.trRR)) },
    };
  }
  if (id === 'oil') {
    return {
      id, name: '機油（定期保養）', short: '機油', zones: ['ENG'], zone: 'ENG', sev: R.oilSev, base: true,
      measure: `距上次更換 ${fmtN(m.oilKm)} km｜6 個月`,
      line1: `距上次更換 ${fmtN(m.oilKm)} km`, line2: '原廠建議每 10,000 km 或 12 個月',
      cmp: { kind: 'oil', newLabel: '新機油', curLabel: '目前機油', newText: '金黃透明', curText: '深褐色' },
      gauge: { from: 0, to: 12000, cur: m.oilKm, limit: 10000, fromLabel: '上次更換', limitLabel: '10,000 km 建議更換', toLabel: '12,000', curLabel: `${fmtN(m.oilKm)} km`, unitK: true },
      plain: o.plain || '機油是引擎的血液，負責潤滑、散熱與清潔。用久了會變黑、保護力下降，所以要定期更換。',
      whyTitle: '為什麼本次要更換？',
      why: o.why || '已達原廠建議的 10,000 公里更換週期，屬於本次預約的定期保養項目。',
      risks: ['潤滑與散熱效果下降，長期增加引擎磨耗', '油耗可能上升'],
      insight: { title: '與您的保養紀錄', rows: [['上次更換', '2026/04/18', '30,085 km'], ['本次里程', `${fmtN(D.car.mileage)} km`, '已到更換週期']], note: '' },
      price: PRICE.oil.total, labor: 0, priceNote: '原廠機油 0W-20（4.2 L）$1,200＋機油濾芯 $350，含工資',
      photo: { at: '14:06', where: '引擎室', kind: 'oil' },
      sources: ['本次工單', '原廠保養手冊', '保養紀錄'],
      vars: {},
    };
  }
  if (id === 'ac') {
    return {
      id, name: '空調濾網', short: '空調濾網', zones: ['CAB'], zone: 'CAB', sev: R.acSev,
      measure: `${m.ac}｜距上次更換 6 個月`,
      line1: `目前狀況：${m.ac}`, line2: '建議下次保養更換',
      cmp: { kind: 'filter', newLabel: '正常狀況（新品）', curLabel: '目前狀況', newText: '潔白', curText: m.ac },
      gauge: { discrete: ['良好', '輕微髒污', '髒污'], cur: m.ac },
      plain: o.plain || '空調濾網就像車子的口罩，過濾從外面吸進車內的灰塵與花粉。',
      whyTitle: '為什麼可以再觀察？',
      why: o.why || '目前過濾效果尚可，可等下次保養再更換；若冷氣有異味、或家人容易過敏，也可以這次提前換。',
      risks: ['出風量變小、冷氣效率下降', '車內可能出現霉味'],
      insight: null,
      price: PRICE.ac.total, labor: PRICE.ac.labor, priceNote: PRICE.ac.note,
      photo: { at: '14:10', where: '手套箱後方', kind: 'filter' },
      sources: ['本次工單', '原廠保養手冊'],
      vars: {},
    };
  }
  if (id === 'rotor') {
    return {
      id, name: '前煞車碟盤研磨', short: '碟盤研磨', zones: ['FR', 'FL'], zone: 'FR', sev: 'p2', addon: true,
      measure: '碟盤厚度 25.4 mm｜表面溝痕約 0.3 mm',
      line1: '碟盤厚度 25.4 mm', line2: '最低使用厚度 24.0 mm',
      cmp: { kind: 'rotor', newLabel: '正常表面', curLabel: '目前表面（右前）', newText: '平整', curText: '溝痕約 0.3 mm' },
      gauge: { from: 26, to: 23, cur: 25.4, limit: STD.rotorMin, fromLabel: '26.0mm 新品', limitLabel: '24.0mm 最低厚度', toLabel: '23mm', curLabel: '25.4mm 目前' },
      plain: o.plain || '碟盤是煞車時來令片夾住的金屬圓盤。表面有細溝時，新來令片就像貼在洗衣板上，接觸不完全。研磨就是把表面磨平。',
      whyTitle: '技師為什麼提出？',
      why: o.why || '拆下舊來令片後，技師發現碟盤表面有溝痕。厚度仍高於最低使用標準，研磨可讓新來令片貼合得更好；也可以下次保養再複查。',
      risks: ['新來令片磨合期較長，前幾百公里可能有輕微異音', '煞車腳感可能不一致（不影響煞車安全）'],
      insight: null,
      price: PRICE.rotor.total, labor: PRICE.rotor.labor, priceNote: PRICE.rotor.note,
      photo: { at: '14:46', where: '右前碟盤', kind: 'rotor' },
      sources: ['技師量測', '原廠維修手冊'],
      vars: {},
    };
  }
  return null;
}

const ITEM_IDS = ['brake', 'rotate', 'oil', 'ac'];
function findings() {
  return ITEM_IDS.map(itemView).filter(v => v && v.sev !== 'ok')
    .sort((a, b) => SEV_ORDER.indexOf(a.sev) - SEV_ORDER.indexOf(b.sev));
}
function sevCounts() {
  const c = { p1: 0, p2: 0, p3: 0, ok: NORMALS.length };
  findings().forEach(v => c[v.sev]++);
  ITEM_IDS.map(itemView).forEach(v => { if (v.sev === 'ok') c.ok++; });
  return c;
}
function zoneItems(z) { return findings().filter(v => v.zones.includes(z)); }
function zoneSev(z) {
  const its = zoneItems(z);
  if (!its.length) return 'ok';
  return its.map(v => v.sev).sort((a, b) => SEV_ORDER.indexOf(a) - SEV_ORDER.indexOf(b))[0];
}

/* ---------- 報價與完工時間（標準工時 + 施工節點） ---------- */
function selectedItems() {
  const out = [];
  ITEM_IDS.forEach(id => { if (S.sel[id]) out.push(itemView(id)); });
  if (S.addonState === 'accepted') out.push(itemView('rotor'));
  return out;
}
function quote() {
  const its = selectedItems();
  const base = its.filter(v => v.base);
  const add = its.filter(v => !v.base);
  const baseSum = base.reduce((a, v) => a + v.price, 0);
  const addSum = add.reduce((a, v) => a + v.price, 0);
  return { its, base, add, baseSum, addSum, total: baseSum + addSum, count: its.length };
}
function plan() {
  const start = S.work.start ?? Math.max(T('14:28'), S.now + 8);
  const seq = [];
  if (S.sel.brake) seq.push({ id: 'brake', label: '前煞車來令片更換', min: PRICE.brake.labor });
  if (S.sel.brake && S.addonState === 'accepted') seq.push({ id: 'rotor', label: '前煞車碟盤研磨', min: PRICE.rotor.labor });
  if (S.sel.rotate) seq.push({ id: 'rotate', label: '輪胎調位・胎壓調整', min: S.sel.brake ? PRICE.rotate.labor : PRICE.rotate.laborAlone });
  seq.push({ id: 'base', label: S.sel.oil ? '定期保養（機油・濾芯・定保檢查）' : '定保檢查項目', min: S.sel.oil ? 27 : 15 });
  if (S.sel.ac) seq.push({ id: 'ac', label: '空調濾網更換', min: PRICE.ac.labor });
  seq.push({ id: 'final', label: '最終檢測・試車・洗車', min: 15 });
  let t = start;
  seq.forEach(n => { n.s = t; t += n.min; n.e = t; });
  const baseEta = start + (S.sel.oil ? 27 : 15) + 15;
  return { start, nodes: seq, eta: t, baseEta, delta: t - baseEta };
}
function workPct() {
  if (S.work.doneAt != null) return 1;
  if (S.work.start == null) return 0;
  const p = plan();
  return clamp((S.now - p.start) / (p.eta - p.start), 0, 0.99);
}
function currentNode() {
  const p = plan();
  if (S.work.doneAt != null) return null;
  return p.nodes.find(n => S.now >= n.s && S.now < n.e) || (S.now < p.start ? null : p.nodes[p.nodes.length - 1]);
}
function healthScore(after) {
  let s = 100;
  const its = findings();
  its.forEach(v => {
    const done = after && (S.sel[v.id]);
    if (!done) s -= SEV[v.sev].pen;
  });
  if (after && S.addonState === 'declined') s -= SEV.p3.pen;
  if (!after) s -= 0;
  return Math.max(40, s);
}

/* ---------- 紀錄（服務廠端即時看板） ---------- */
function act(text, type = 'info') {
  S.activity.unshift({ t: S.now, text, type });
  if (S.activity.length > 60) S.activity.pop();
  if (typeof renderConsole === 'function') renderConsole();
}

function setNow(min) {
  S.now = min;
  if (typeof renderClock === 'function') renderClock();
}
/* 模擬時間只往前走：手動操作與展示步驟共用同一條時間軸 */
function atLeast(t) { const m = typeof t === 'string' ? T(t) : t; if (S.now < m) setNow(m); }
