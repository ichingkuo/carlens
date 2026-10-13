/* =========================================================
   車況透視鏡 — 成效儀表板 ＆ 系統架構與落地
   圖表規範：單一系列一個色相、細標記、髮絲格線、值標在端點、
   每張圖都有表格檢視，提示框只做補充
   ========================================================= */
const VZ = { s1: '#2a78d6', before: '#86b6ef', after: '#1c5cab', grid: '#E6E8EC', axis: '#C9CDD4' };

function tableToggle(id) {
  return `<button class="tview" data-act="tview" data-arg="${id}" aria-pressed="${!!(S.tviews && S.tviews[id])}">${ic('table', 14)}${S.tviews && S.tviews[id] ? '圖表' : '表格'}</button>`;
}
function tv(id) { return !!(S.tviews && S.tviews[id]); }

function hbars(data, opt = {}) {
  const max = opt.max || Math.max(...data.map(d => d.v));
  const unit = opt.unit || '';
  return `<div class="hbars">${data.map(d => {
    const w = d.v / max * 100;
    return `<div class="hb"><span class="hb-l">${esc(d.k)}</span><span class="hb-t"><i tabindex="0" style="width:calc(${w}% * .84)" data-tip="${esc(d.k)}｜${d.v}${unit}"></i><b class="num">${d.v}${unit}</b></span></div>`;
  }).join('')}</div>`;
}
function dataTable(cols, rows) {
  return `<table class="tbl dt"><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function dumbbell(r) {
  const dom = r.unit === '/5' ? 5 : Math.max(r.before, r.after) * 1.18;
  const x = v => 8 + v / dom * 284;
  const pct = Math.round(Math.abs(r.after - r.before) / r.before * 100);
  const good = (r.better === 'down' && r.after < r.before) || (r.better === 'up' && r.after > r.before);
  return `<div class="db">
    <div class="db-l"><b>${esc(r.k)}</b><small>${esc(r.note)}</small></div>
    <div class="db-c"><svg class="db-s" viewBox="0 0 300 34" preserveAspectRatio="none" aria-hidden="true">
      <line x1="8" y1="17" x2="292" y2="17" stroke="${VZ.grid}" stroke-width="1"/>
      <line x1="${x(r.before)}" y1="17" x2="${x(r.after)}" y2="17" stroke="#B9C8DA" stroke-width="2"/>
    </svg>
    <span class="db-dot b" style="left:calc(${(x(r.before) / 300 * 100).toFixed(2)}%)" tabindex="0" data-tip="導入前｜${r.before}${r.unit}"></span>
    <span class="db-dot a" style="left:calc(${(x(r.after) / 300 * 100).toFixed(2)}%)" tabindex="0" data-tip="導入後｜${r.after}${r.unit}"></span></div>
    <div class="db-v"><span class="mut num">${r.before}${r.unit}</span><span class="arr">→</span><b class="num">${r.after}${r.unit}</b></div>
    <div class="db-d ${good ? 'good' : ''}">${ic(good ? 'check' : 'alert', 13)}${r.better === 'down' ? '減少' : '提升'} ${pct}%</div>
  </div>`;
}

function lineChart(vals, labels) {
  const W = 520, H = 200, L = 36, R = 44, Tp = 14, B = 30;
  const x = i => L + i * (W - L - R) / (vals.length - 1);
  const y = v => Tp + (1 - v / 100) * (H - Tp - B);
  const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return `<div class="lc"><svg viewBox="0 0 ${W} ${H}" class="lc-s" role="img" aria-label="數位服務使用率每週趨勢">
    ${[0, 25, 50, 75, 100].map(t => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="${t === 0 ? VZ.axis : VZ.grid}" stroke-width="1"/><text x="${L - 8}" y="${y(t) + 4}" text-anchor="end" class="ax">${t}%</text>`).join('')}
    ${labels.map((l, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="ax">${l}</text>`).join('')}
    <polyline points="${pts}" fill="none" stroke="${VZ.s1}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(vals.length - 1)}" cy="${y(vals[vals.length - 1])}" r="5" fill="${VZ.s1}" stroke="#fff" stroke-width="2"/>
    <text x="${x(vals.length - 1) + 10}" y="${y(vals[vals.length - 1]) + 4}" class="lab">${vals[vals.length - 1]}%</text>
    <line class="lc-x" x1="0" x2="0" y1="${Tp}" y2="${H - B}" stroke="#7C8594" stroke-width="1" opacity="0"/>
    ${vals.map((v, i) => `<rect x="${x(i) - 30}" y="${Tp}" width="60" height="${H - Tp - B}" fill="transparent" tabindex="0" data-tip="${labels[i]}｜${v}%" data-cx="${x(i)}"/>`).join('')}
  </svg></div>`;
}

function liveCard() {
  const conf = S.confirm && S.inspectedAt != null ? S.confirm.t - S.inspectedAt : null;
  const items = [
    ['車況確認耗時', conf != null ? `${conf} 分鐘` : '—', '檢查完成通知 → 數位簽名'],
    ['AI 提問', `${S.metrics.aiQ} 次`, `有幫助 ${S.metrics.up}｜沒幫助 ${S.metrics.down}`],
    ['轉真人', `${S.metrics.handoff} 次`, '安全／保固／無法確認'],
    ['追加項目', S.addonState === 'none' ? '—' : { pending: '待決定', accepted: '同意', declined: '下次複查' }[S.addonState], '中間報告遠端決策'],
    ['滿意度', S.survey ? `${S.survey.all} / 5` : '—', '完工後評價'],
  ];
  return `<section class="card live"><div class="live-h"><h3>${ic('play', 14)}本次示範即時數據</h3><span class="mut">隨左側展示流程即時更新</span></div>
    <div class="live-g">${items.map(i => `<div><small>${i[0]}</small><b class="num">${i[1]}</b><span>${i[2]}</span></div>`).join('')}</div></section>`;
}

function renderDash() {
  const el = $('#page'); if (!el) return;
  const L = DASH;
  el.innerHTML = `<div class="pg dash">
    <header class="pg-h"><div><h2>成效儀表板</h2><p>對應提案「驗證指標」。數字為示意的預期目標值（模擬單一服務廠 PoC 30 天），正式導入後以實際量測取代。</p></div>
      <div class="flt"><span>期間</span><b>近 30 天</b><span>據點</span><b>${D.booking.branch}</b></div></header>
    ${liveCard()}
    <section class="tiles">${L.tiles.map(t => `<div class="tile"><small>${t.k}</small><b class="num">${t.v}</b><span>${t.sub}</span></div>`).join('')}</section>
    <section class="card">
      <div class="ch"><div><h3>導入前後對照</h3><p class="mut">每列各自刻度；單位不同的指標不放在同一軸上比較</p></div>
        <div class="legend2"><span><i style="background:${VZ.before}"></i>導入前</span><span><i style="background:${VZ.after}"></i>導入後</span>${tableToggle('ledger')}</div></div>
      ${tv('ledger') ? dataTable(['指標', '導入前', '導入後', '說明'], L.ledger.map(r => [r.k, r.before + r.unit, r.after + r.unit, r.note])) : `<div class="dbs">${L.ledger.map(dumbbell).join('')}</div>`}
    </section>
    <div class="dgrid">
      <section class="card"><div class="ch"><div><h3>建議項目接受率</h3><p class="mut">觀察指標，不預設一定提升；用來檢視說明品質與建議合理性</p></div>${tableToggle('accept')}</div>
        ${tv('accept') ? dataTable(['項目', '接受率'], L.accept.map(d => [d.k, d.v + '%'])) : hbars(L.accept, { max: 100, unit: '%' })}</section>
      <section class="card"><div class="ch"><div><h3>車主最常問 AI 的問題</h3><p class="mut">占全部提問比例；回饋用來優化頁面上的常見問題</p></div>${tableToggle('q')}</div>
        ${tv('q') ? dataTable(['問題', '占比'], L.questions.map(d => [d.k, d.v + '%'])) : hbars(L.questions, { max: 30, unit: '%' })}</section>
      <section class="card"><div class="ch"><div><h3>數位確認漏斗</h3><p class="mut">收到檢查通知的車主，逐步完成數位確認的比例</p></div>${tableToggle('funnel')}</div>
        ${tv('funnel') ? dataTable(['階段', '比例'], L.funnel.map(d => [d.k, d.v + '%'])) : hbars(L.funnel, { max: 100, unit: '%' })}</section>
      <section class="card"><div class="ch"><div><h3>數位服務使用率</h3><p class="mut">選擇數位自主確認的車主比例，按週</p></div>${tableToggle('adopt')}</div>
        ${tv('adopt') ? dataTable(['週次', '使用率'], L.adoption.map((v, i) => [`第 ${i + 1} 週`, v + '%'])) : lineChart(L.adoption, ['第 1 週', '第 2 週', '第 3 週', '第 4 週'])}</section>
    </div>
    <section class="card">
      <h3>效益總覽：三方都受益</h3>
      <div class="three">
        <div><b>對車主｜從被動等待，變成掌握狀況</b><ul class="checks">
          <li class="on">${ic('check', 14)}到廠前：依現場進度收到建議抵達時間</li>
          <li class="on">${ic('check', 14)}檢查後：在車體圖上看到問題位置，新舊對比與原因，有疑問直接問 AI</li>
          <li class="on">${ic('check', 14)}施工中：LINE 顯示預計完成時間與進度，不必守在客休室</li></ul></div>
        <div><b>對服務廠｜省下專員工時</b><ul class="checks">
          <li class="on">${ic('check', 14)}專員說明工時每台 18.5 → 9.0 分</li>
          <li class="on">${ic('check', 14)}車主主動詢問進度每台 2.4 → 0.6 次</li>
          <li class="on">${ic('check', 14)}中間報告改為遠端確認，人力留給需要真人協助的情境</li></ul></div>
        <div><b>對 TOYOTA／和泰｜累積決策數據</b><ul class="checks">
          <li class="on">${ic('check', 14)}一致的數位售後體驗（LINE＋My TOYOTA App）</li>
          <li class="on">${ic('check', 14)}車主常見疑問、項目接受／婉拒資料</li>
          <li class="on">${ic('check', 14)}回饋到說明內容、價格策略與專員訓練</li></ul></div>
      </div>
    </section>
    <section class="card">
      <h3>對應競賽成效指標</h3>
      <div class="kmap">${[
        ['縮短接待說明時間', '施作確認 11.8 → 4.2 分；專員說明工時每台減少約 9.5 分'],
        ['降低重複詢問率', '主動詢問進度每台 2.4 → 0.6 次'],
        ['提升顧客滿意度', '理解度 3.4 → 4.6、透明度 3.2 → 4.5、整體滿意度 4.1 → 4.7（/5）'],
        ['提高 APP／LINE 互動率', '數位服務使用率 68%，四週由 42% 成長'],
        ['提升回廠意願', '暫不施作項目自動列入下次保養複查提醒，追蹤複查預約率'],
      ].map(r => `<div><b>${r[0]}</b><span>${r[1]}</span></div>`).join('')}</div>
    </section>
  </div>`;
}

/* ---------------- 系統架構與落地 ---------------- */
function archSVG() {
  const box = (x, y, w, h, t, sub, cls = '') => `<g class="ab ${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/><text x="${x + 14}" y="${y + 24}" class="abt">${t}</text>${sub ? sub.map((s, i) => `<text x="${x + 14}" y="${y + 44 + i * 18}" class="abs">${s}</text>`).join('') : ''}</g>`;
  const col = (x, t) => `<text x="${x}" y="26" class="acol">${t}</text>`;
  const arrow = (x1, y1, x2, y2, label) => `<path d="M${x1} ${y1} L${x2} ${y2}" class="aar" marker-end="url(#ah)"/>${label ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 7}" text-anchor="middle" class="aal">${label}</text>` : ''}`;
  return `<svg viewBox="0 0 1120 520" class="arch-svg" role="img" aria-label="車況透視鏡系統架構">
    <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#7C8594"/></marker></defs>
    ${col(20, '車主接觸點')}${col(300, '車況透視鏡平台')}${col(580, 'AI 服務層')}${col(860, '既有系統與資料')}
    ${box(20, 44, 240, 72, 'LINE 官方帳號', ['推播、聊天室、圖文選單'], 'own')}
    ${box(20, 128, 240, 72, 'LIFF：車況透視鏡', ['車體透視、對比、勾選、簽名'], 'own')}
    ${box(20, 212, 240, 72, 'My TOYOTA App', ['電子明細、保養紀錄'], 'own')}
    ${box(300, 44, 240, 92, '服務旅程引擎', ['預約→報到→檢查→確認→維修→完工', '狀態機＋推播編排'], 'core')}
    ${box(300, 148, 240, 72, '報價與完工時間', ['零件價格＋原廠標準工時＋施工節點'], 'core')}
    ${box(300, 232, 240, 52, '決策與回饋數據', [], 'core')}
    ${box(580, 44, 240, 92, 'Gemini 多模態', ['照片＋量測＋口述 → 結構化車況', '白話說明草稿'], 'ai')}
    ${box(580, 148, 240, 72, '車況問答', ['只依工單、原廠標準、行車數據'], 'ai')}
    ${box(580, 232, 240, 72, '護欄', ['規則分級、專員審核、安全保固轉真人'], 'guard')}
    ${box(860, 44, 240, 52, '工單系統（DMS）', [], 'sys')}
    ${box(860, 104, 240, 52, '零件價格與庫存', [], 'sys')}
    ${box(860, 164, 240, 52, '會員／CRM、保養歷史', [], 'sys')}
    ${box(860, 224, 240, 52, '車輛行車數據', [], 'sys')}
    ${box(860, 284, 240, 52, 'App 互動數據', [], 'sys')}
    <text x="20" y="372" class="acol">服務廠端（沿用既有設備）</text>
    ${box(20, 388, 250, 72, '車牌辨識（既有）', ['到廠自動報到、比對預約'], 'shop')}
    ${box(290, 388, 250, 72, '技師平板', ['量測、拍照、語音備註、施工節點'], 'shop')}
    ${box(560, 388, 250, 72, '專員工作台', ['審核 AI 草稿、處理轉真人'], 'shop')}
    ${box(830, 388, 270, 72, '成效儀表板', ['驗證指標、接受率、常見提問'], 'shop')}
    ${arrow(262, 160, 298, 150, '')}${arrow(542, 90, 578, 90, '')}${arrow(822, 90, 858, 72, '')}${arrow(542, 184, 578, 184, '')}${arrow(822, 184, 858, 130, '')}
    ${arrow(410, 386, 410, 288, '量測/節點')}${arrow(130, 386, 130, 288, '')}${arrow(680, 386, 680, 306, '審核')}${arrow(965, 386, 965, 338, '')}
  </svg>`;
}

function renderArch() {
  const el = $('#page'); if (!el) return;
  el.innerHTML = `<div class="pg arch">
    <header class="pg-h"><div><h2>系統架構與落地</h2><p>以 LINE 為主要入口、沿用既有車牌辨識與平板，AI 以 API 模組導入，逐步串接既有系統。</p></div></header>
    <section class="card"><div class="arch-wrap">${archSVG()}</div></section>
    <div class="dgrid three">
      <section class="card"><h3>導入路徑</h3><ol class="roadmap">
        <li><b>PoC｜1 個服務廠、8 週</b><span>LIFF＋2D 俯視車體（轎車、休旅、MPV 三種車型圖）；完工時間用標準工時＋施工節點；Gemini API。</span></li>
        <li><b>試營運｜3–5 廠、1 季</b><span>串接工單、零件價格與庫存；專員審核流程與教育訓練；驗證指標上線。</span></li>
        <li><b>擴大導入｜全台據點</b><span>累積工單資料後導入完工時間預測模型（含工位排隊）；依問答回饋優化常見問題。</span></li></ol></section>
      <section class="card"><h3>主要成本</h3><ul class="checks">
        <li class="on">${ic('check', 14)}系統與 LIFF 介面開發</li><li class="on">${ic('check', 14)}工單、會員等既有系統串接</li><li class="on">${ic('check', 14)}AI API 使用費用（依提問量計價）</li><li class="on">${ic('check', 14)}服務流程調整與人員教育訓練</li><li class="on">${ic('check', 14)}硬體沿用：車牌辨識、平板、LINE 官方帳號</li></ul></section>
      <section class="card"><h3>AI 護欄</h3><ul class="checks">
        <li class="on">${ic('shield', 14)}嚴重度由原廠標準規則判定，AI 不決定</li><li class="on">${ic('shield', 14)}價格、工時由系統帶入，AI 不生成數字</li><li class="on">${ic('shield', 14)}AI 草稿須專員審核後才推播</li><li class="on">${ic('shield', 14)}安全、保固、無法確認 → 轉真人</li><li class="on">${ic('shield', 14)}每則回答附依據來源與讚／倒讚回饋</li></ul></section>
    </div>
    <section class="card"><h3>風險與因應</h3>
      ${dataTable(['可能風險', '因應方式'], [
        ['AI 回答錯誤或產生幻覺', '限制資料來源為原廠資料與本次工單；涉及安全、保固或不確定內容時轉真人'],
        ['預計完成時間不準', 'PoC 以標準工時與施工節點更新，逐步累積資料後再改善預估方式'],
        ['車主不熟悉數位操作', '保留專員協助模式，數位自主並非唯一服務方式'],
        ['技師工作負擔增加', '照片與量測沿用既有作業，口述以語音轉文字，避免重複輸入'],
        ['線上確認與付款爭議', '保留時間戳記、操作紀錄與確認內容，正式導入前完成法務與流程確認'],
      ])}</section>
    <section class="card"><h3>延伸服務機會</h3><div class="kmap">
      <div><b>預防性保養提醒</b><span>依行車數據推估耗材到期（如來令片磨耗速度），主動建議回廠時間</span></div>
      <div><b>暫不施作的再回廠</b><span>「下次複查」項目自動帶入下次預約，提升回廠率</span></div>
      <div><b>決策數據回饋</b><span>接受率與常見提問回饋到說明內容、價格策略與專員訓練</span></div>
      <div><b>等候時間的價值</b><span>客休點單、外帶與周邊合作，讓等候從「被動」變成「可安排」</span></div>
    </div></section>
  </div>`;
}

/* 提示框（圖表懸停／鍵盤焦點） */
function tipShow(el) {
  const t = $('#vtip'); if (!t || !el) return;
  t.textContent = el.getAttribute('data-tip');
  const r = el.getBoundingClientRect();
  t.style.left = (r.left + r.width / 2) + 'px'; t.style.top = (r.top - 8) + 'px';
  t.classList.add('show');
  const cx = el.getAttribute('data-cx');
  const ln = el.closest('svg') && el.closest('svg').querySelector('.lc-x');
  if (ln && cx) { ln.setAttribute('x1', cx); ln.setAttribute('x2', cx); ln.setAttribute('opacity', '.5'); }
}
function tipHide(el) {
  const t = $('#vtip'); if (t) t.classList.remove('show');
  const ln = el && el.closest && el.closest('svg') && el.closest('svg').querySelector('.lc-x');
  if (ln) ln.setAttribute('opacity', '0');
}

/* ---------------- 痛點分析（公開輿情） ---------------- */
function splitReviews(text) {
  return String(text || '').split(/\r?\n/).map(l => l.replace(/^\s*["']|["']\s*$/g, '').replace(/^\s*\d+[.)、]\s*/, '').trim()).filter(l => l.length >= 4).slice(0, 500);
}
function localClassify(line) {
  const cats = PAIN_CATS.filter(c => c.kw.some(k => line.toLowerCase().includes(k.toLowerCase()))).map(c => c.id);
  let t = line, pos = 0, neg = 0;
  SENT.pos.forEach(k => { if (t.includes(k)) { pos++; t = t.split(k).join(''); } });
  SENT.neg.forEach(k => { if (t.includes(k)) neg++; });
  const sent = neg > pos ? 'neg' : pos > neg ? 'pos' : 'neu';
  return { cats: cats.length ? cats : ['other'], sent };
}
async function runPain() {
  const lines = splitReviews(S.painText);
  if (!lines.length) { toast('請先貼上評論，每行一則'); return; }
  S.painBusy = true; renderPain();
  let rows = lines.map(text => ({ text, ...localClassify(text) }));
  let engine = 'local';
  if (Gemini.enabled()) {
    try {
      const ids = PAIN_CATS.map(c => `${c.id}=${c.label}`).join('；');
      for (let i = 0; i < lines.length; i += 40) {
        const chunk = lines.slice(i, i + 40);
        const system = `你是汽車售後服務的輿情分析助理。把每則車主評論分類到下列痛點類別（可複選，都不符合用 other）：${ids}。情緒 sent 用 neg、pos、neu。只輸出 JSON：{"items":[{"i":1,"cats":["wait"],"sent":"neg"}]}，i 對應評論編號。`;
        const user = chunk.map((l, k) => `${k + 1}. ${l}`).join('\n');
        const j = Gemini.parse(await Gemini.call({ system, user, timeout: 40000 }));
        if (!j || !Array.isArray(j.items)) throw new Error('格式不符');
        j.items.forEach(it => {
          const r = rows[i + (+it.i) - 1]; if (!r) return;
          const cats = (it.cats || []).filter(c => PAIN_CATS.some(p => p.id === c));
          r.cats = cats.length ? cats : ['other'];
          if (['neg', 'pos', 'neu'].includes(it.sent)) r.sent = it.sent;
        });
      }
      engine = 'gemini';
    } catch (e) { toast('Gemini 分析失敗，改用離線關鍵字分析'); }
  }
  S.pain = { rows, engine, src: S.painSrc || 'user', at: new Date().toLocaleString('zh-TW', { hour12: false }) };
  S.painBusy = false; renderPain();
}
function painStats() {
  const rows = S.pain.rows, n = rows.length;
  const cats = PAIN_CATS.map(c => {
    const hit = rows.filter(r => r.cats.includes(c.id));
    const neg = hit.filter(r => r.sent === 'neg');
    const score = r => c.kw.filter(k => r.text.toLowerCase().includes(k.toLowerCase())).length + (r.sent === 'neg' ? 0.5 : 0) - r.cats.length * 0.1;
    return { ...c, n: hit.length, pct: Math.round(hit.length / n * 100), negN: neg.length, quotes: hit.slice().sort((a, b) => score(b) - score(a)).slice(0, 2).map(r => r.text) };
  }).sort((a, b) => b.n - a.n);
  const phases = PAIN_PHASE.map((p, i) => ({ k: p, v: rows.filter(r => r.cats.some(id => (PAIN_CATS.find(c => c.id === id) || {}).phase === i)).length }));
  const negPct = Math.round(rows.filter(r => r.sent === 'neg').length / n * 100);
  const other = rows.filter(r => r.cats[0] === 'other').length;
  return { n, cats, phases, negPct, other };
}
function copyPainCsv() {
  if (!S.pain) return;
  const q = v => '"' + String(v).replace(/"/g, '""') + '"';
  const lab = id => (PAIN_CATS.find(c => c.id === id) || { label: '其他' }).label;
  const csv = ['評論,痛點分類,情緒'].concat(S.pain.rows.map(r => [q(r.text), q(r.cats.map(lab).join('、')), q({ neg: '負面', pos: '正面', neu: '中性' }[r.sent])].join(','))).join('\n');
  const fallback = () => {
    const box = $('#csvOut'); if (!box) return;
    box.hidden = false; box.value = csv; box.focus(); box.select();
    toast('已選取分析結果，請按 Ctrl＋C（Mac 為 ⌘＋C）複製，再貼到試算表');
  };
  try {
    navigator.clipboard.writeText(csv).then(() => toast('已複製分析結果（CSV），可直接貼到 Google 試算表或 Excel')).catch(fallback);
  } catch (e) { fallback(); }
}
function renderPain() {
  const el = $('#page'); if (!el || S.view !== 'pain') return;
  const P = S.pain, src = S.painSrc || '';
  const srcLabel = src === 'sample' ? '示意文字（非真實評論）' : src.startsWith('file:') ? `上傳檔案 ${src.slice(5)}` : src === 'edited' ? '示意文字（已修改）' : '使用者貼上';
  let res = '';
  if (S.painBusy) res = `<section class="card"><p class="mut">${ic('spark', 14)} 分析中…</p></section>`;
  else if (P) {
    const st = painStats(), top = st.cats[0];
    const phaseMax = Math.max(1, ...st.phases.map(p => p.v));
    res = `<section class="tiles">
        <div class="tile"><small>分析評論數</small><b class="num">${st.n}</b><span>${P.src === 'sample' ? '示意文字（非真實評論）' : '團隊蒐集資料'}</span></div>
        <div class="tile"><small>負面評論比例</small><b class="num">${st.negPct}%</b><span>依關鍵詞或 Gemini 判斷</span></div>
        <div class="tile"><small>最常見痛點</small><b>${top.n ? top.label : '—'}</b><span>${top.n} 則｜${top.pct}%</span></div>
        <div class="tile"><small>未歸類</small><b class="num">${st.other}</b><span>可再補充關鍵詞或改用 Gemini</span></div>
      </section>
      <div class="dgrid">
        <section class="card"><div class="ch"><div><h3>痛點類別</h3><p class="mut">提及該類痛點的評論占比（可複選）</p></div>${tableToggle('pcat')}</div>
          ${tv('pcat') ? dataTable(['類別', '則數', '占比', '負面'], st.cats.map(c => [c.label, c.n, c.pct + '%', c.negN])) : hbars(st.cats.map(c => ({ k: c.label, v: c.pct })), { max: 100, unit: '%' })}</section>
        <section class="card"><div class="ch"><div><h3>對應體驗階段</h3><p class="mut">痛點落在服務旅程的哪個階段（則數）</p></div>${tableToggle('pphase')}</div>
          ${tv('pphase') ? dataTable(['階段', '則數'], st.phases.map(p => [p.k, p.v])) : hbars(st.phases, { max: phaseMax, unit: ' 則' })}</section>
      </div>
      <section class="card"><div class="ch"><div><h3>痛點 → 車況透視鏡的對應功能</h3><p class="mut">代表評論取自上方資料${P.src === 'sample' ? '（示意文字）' : ''}</p></div>
        <button class="tview" data-act="painCsv">${ic('doc', 14)}複製結果（CSV）</button></div>
        <textarea id="csvOut" class="csvout" rows="5" readonly hidden aria-label="分析結果 CSV"></textarea>
        <div class="pmap">${st.cats.filter(c => c.n).map(c => `<div class="pm">
            <div class="pm-h"><b>${c.label}</b>${c.pain ? `<em>${c.pain}</em>` : ''}<span class="num">${c.n} 則</span></div>
            ${c.quotes.map(q => `<blockquote>${esc(q)}</blockquote>`).join('')}
            <div class="pm-f">${ic('check', 14)}<span>${c.fix}</span>${c.phase >= 0 ? `<i>${PAIN_PHASE[c.phase]}</i>` : '<i>跨階段</i>'}</div></div>`).join('')}</div>
      </section>`;
  } else {
    res = `<section class="card empty-c"><p>${ic('info', 16)} 貼上團隊蒐集的公開評論後按「開始分析」。每行一則，可直接貼上 Google 試算表的一欄，或上傳 .txt／.csv。</p></section>`;
  }
  el.innerHTML = `<div class="pg pain">
    <header class="pg-h"><div><h2>痛點分析｜公開輿情</h2><p>對應競賽「發掘痛點與需求分析」：把 Google Maps、論壇、社群上的車主評論，依提案的三大痛點與四個體驗階段分類，找出最需要被解決的環節。</p></div>
      <div class="flt"><span>分析引擎</span><b>${Gemini.enabled() ? 'Gemini' : '離線關鍵詞'}</b></div></header>
    <section class="card pin">
      <div class="pin-h"><b>評論資料</b><span class="mut">${S.painText ? `${splitReviews(S.painText).length} 則｜來源：${srcLabel}` : '尚未輸入'}</span></div>
      <textarea id="painText" rows="7" placeholder="每行一則評論，例如：\n保養等了快兩個小時，中間完全不知道修到哪裡">${esc(S.painText || '')}</textarea>
      <div class="btnrow left">
        <button class="btn pri" data-act="painRun" ${S.painBusy ? 'disabled' : ''}>${ic('spark', 15)}開始分析</button>
        <label class="btn ghost file">${ic('upload', 15)}上傳 .txt／.csv<input type="file" id="painFile" accept=".txt,.csv,text/plain,text/csv"></label>
        <button class="btn ghost" data-act="painSample">填入示意文字</button>
        <button class="btn ghost" data-act="painClear">清除</button>
      </div>
      <p class="mut sm">示意文字為測試用的虛構句子，不是真實評論；提案引用時請換成團隊實際蒐集、可附來源的公開評論。</p>
    </section>
    ${res}
  </div>`;
}
