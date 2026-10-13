/* =========================================================
   車況透視鏡 — 車主端：LINE 官方帳號 ＋ LIFF 頁面
   ========================================================= */
const fastMode = () => !!S.fast;
const spd = () => (S.fast ? 0 : 1 / (S.speed || 1));
const wait = ms => sleep(ms * spd());

function toast(text, ms = 2800) {
  const el = $('#toast'); if (!el) return;
  el.textContent = text; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), ms);
}
function ptoast(text, ms = 1900) {
  const el = $('#ptoast'); if (!el) return;
  el.textContent = text; el.classList.add('show');
  clearTimeout(ptoast._t); ptoast._t = setTimeout(() => el.classList.remove('show'), ms);
}

const STAGES = ['booked', 'reminded', 'arrived', 'inspected', 'confirmed', 'repairing', 'done'];
function stageIdx() { return Math.max(0, STAGES.indexOf(S.stage) - 1); }
function setStage(s) { S.stage = s; }

function oaAvatar() { return '<span class="oa-av"><b>TOYOTA</b></span>'; }

/* ---------------- 時鐘 ---------------- */
function renderClock() {
  $$('.js-clock').forEach(el => { el.textContent = hm(S.now); });
}

/* ---------------- 聊天室 ---------------- */
function pushMsg(m) {
  m.id = ++S.msgSeq; if (m.t == null) m.t = S.now; m.isNew = true;
  S.chat.push(m);
  if (m.from !== 'me' && m.kind === 'flex' && S.footer === 'menu') S.footer = 'closed';
  renderChat(); renderFoot();
  if (m.from !== 'me' && m.kind !== 'sep' && S.liff.length) showBanner(m);
  return m;
}
async function oaPush(m, typing = 700) {
  if (!fastMode() && typing) { S.typing = true; renderChat(); await wait(typing); S.typing = false; }
  return pushMsg({ from: 'oa', ...m });
}

function msgHTML(m) {
  if (m.kind === 'sep') return `<div class="csep"><span>${esc(m.text)}</span></div>`;
  const cls = `msg ${m.from}${m.isNew ? ' enter' : ''}`;
  if (m.from === 'me') return `<div class="${cls}"><div class="mmeta">已讀<br>${hm(m.t)}</div><div class="bub me">${nl2br(m.text)}</div></div>`;
  const av = m.from === 'adv' ? `<div class="av adv">王</div>` : `<div class="av">${oaAvatar()}</div>`;
  const name = m.from === 'adv' ? `<div class="mname">${D.advisor.name}｜服務專員</div>` : '';
  const body = m.kind === 'flex' ? `<div class="fx fx-${m.flex}">${FLEX[m.flex](m.data || {}, m)}</div>` : `<div class="bub">${nl2br(m.text)}</div>`;
  const qr = m.quick ? `<div class="qr">${m.quick.map(q => `<button class="qrb" data-act="say" data-arg="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : '';
  return `<div class="${cls}" data-mid="${m.id}">${av}<div class="mcol">${name}${body}${qr}</div><div class="mmeta">${hm(m.t)}</div></div>`;
}

function renderChat() {
  const el = $('#chatList'); if (!el) return;
  el.innerHTML = S.chat.map(msgHTML).join('') +
    (S.typing ? `<div class="msg oa enter"><div class="av">${oaAvatar()}</div><div class="mcol"><div class="bub typing"><i></i><i></i><i></i></div></div></div>` : '');
  S.chat.forEach(m => { m.isNew = false; });
  el.scrollTop = el.scrollHeight;
  requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
}

const RICH = [
  { k: '預約回廠', art: 'cal', act: 'menuBooking' },
  { k: '本次服務', art: 'lens', act: 'menuHub', badge: '新' },
  { k: '維修進度', art: 'clock', act: 'menuProgress', badge: '新' },
  { k: '智能客服', art: 'head', act: 'menuBot' },
  { k: '愛車秘書', art: 'book', act: 'menuApp' },
  { k: '車主優惠', art: 'gift', act: 'menuApp' },
];

function renderFoot() {
  const el = $('#chatFoot'); if (!el) return;
  const tabs = ['車主服務', '探索車款', '車主活動'];
  const menu = S.footer === 'menu' ? `<div class="rich">
      <div class="rtabs">${tabs.map((t, i) => `<button class="rtab ${S.menuTab === i ? 'on' : ''}" data-act="menuTab" data-arg="${i}">${t}</button>`).join('')}</div>
      ${S.menuTab === 0 ? `<div class="rgrid">${RICH.map(r => `<button class="rtile" data-act="${r.act}" data-arg="${r.k}">${menuArt(r.art)}<span>${r.k}</span>${r.badge ? `<em>${r.badge}</em>` : ''}</button>`).join('')}</div>`
      : `<div class="rempty">示意：導向 TOYOTA 官網「${tabs[S.menuTab]}」</div>`}
    </div>` : '';
  const bar = S.footer === 'kbd'
    ? `<div class="cbar"><button class="cbtn" data-act="toggleMenu" aria-label="開啟選單">${ic('menu', 20)}</button>
        <form class="cinput" data-form="chat"><input id="chatInput" autocomplete="off" placeholder="輸入訊息（例如：進度）" value="${esc(S.chatDraft || '')}"><button type="submit" aria-label="送出">${ic('send', 18)}</button></form></div>`
    : `<div class="cbar"><button class="cbtn" data-act="kbd" aria-label="切換鍵盤">${ic('kbd', 20)}</button>
        <button class="cmenu" data-act="toggleMenu">點開選單 ${ic(S.footer === 'menu' ? 'chevDown' : 'chevUp', 14)}</button></div>`;
  el.innerHTML = menu + bar;
}

async function sendChat(text) {
  if (!text) return;
  S.chatDraft = '';
  pushMsg({ from: 'me', kind: 'text', text });
  const r = await AI.ask('general', text);
  if (r.kind === 'progress') { await pushProgressCard(); markStep(11); return; }
  if (r.kind === 'advisor') { requestAdvisor('chat'); return; }
  if (r.kind === 'booking') { await startBookingFlow(true); return; }
  await oaPush({ kind: 'text', text: r.text, quick: r.followups, preview: r.text.slice(0, 30) }, 500);
}

async function pushProgressCard() {
  if (stageIdx() < 4) {
    const msg = stageIdx() >= 2 ? '目前正在等候您確認施作項目，確認後會立即開始維修。' : (stageIdx() >= 1 ? '您的車輛已完成報到，技師正在進行檢查，完成後會立即通知您。' : '目前沒有進行中的維修，可點選「預約回廠」預約保養。');
    await oaPush({ kind: 'text', text: msg, preview: msg.slice(0, 30) }, 500);
    return;
  }
  if (S.stage === 'done') { await oaPush({ kind: 'text', text: `您的愛車已於 ${hm(S.work.doneAt)} 完成，可至 1F 交車區取車。`, preview: '您的愛車已完成' }, 500); return; }
  const pl = plan(), nd = currentNode();
  await oaPush({ kind: 'flex', flex: 'progress', data: { eta: pl.eta, left: Math.max(0, pl.eta - S.now), pct: Math.round(workPct() * 100), node: nd ? nd.label : '' }, preview: '您的車輛目前正在維修中' }, 600);
  act('於 LINE 聊天室查詢維修進度', 'owner');
}

/* ---------------- Flex 訊息樣板 ---------------- */
function heroBooked() {
  return `<svg viewBox="0 0 300 120" class="fx-art" aria-hidden="true">
    <rect width="300" height="120" fill="#DDEBFA"/><path d="M0 92 Q80 76 160 88 T300 84 V120 H0Z" fill="#A6D47C"/>
    <circle cx="250" cy="28" r="14" fill="#fff" opacity=".8"/><circle cx="268" cy="34" r="10" fill="#fff" opacity=".8"/>
    <g transform="translate(40 22) rotate(-6)"><rect width="92" height="70" rx="6" fill="#fff" stroke="#E2E8F0"/><rect width="92" height="16" rx="6" fill="#EB0A1E"/><rect y="10" width="92" height="6" fill="#EB0A1E"/>
      ${[0, 1, 2, 3].map(c => [0, 1, 2].map(r => `<rect x="${10 + c * 19}" y="${24 + r * 14}" width="12" height="8" rx="1.5" fill="${c === 2 && r === 1 ? '#EB0A1E' : '#9CC3E6'}"/>`).join('')).join('')}</g>
    <g transform="translate(170 40)"><rect x="0" y="18" width="78" height="26" rx="10" fill="#EB0A1E"/><path d="M12 18 L22 4 H56 L66 18Z" fill="#EB0A1E"/><path d="M24 7 H54 L61 17 H17Z" fill="#CFE3FF"/><circle cx="18" cy="44" r="8" fill="#2B3038"/><circle cx="60" cy="44" r="8" fill="#2B3038"/></g>
    <circle cx="262" cy="74" r="16" fill="#EB0A1E"/><path d="M254 74 l6 6 10-11" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function maskPlate(p) { return p[0] + '**-**' + p.slice(-2); }

const FLEX = {
  booked(d) {
    return `<div class="fx-hero">${heroBooked()}</div>
      <div class="fx-b"><div class="fx-t">預約保養成功通知</div>
        <p class="fx-sub">TOYOTA車主您好，您已成功預約愛車保養，預約資料如下：</p>
        <div class="fx-date"><span>${esc(d.dateLong)}</span><b class="num">${esc(d.time)}</b></div>
        <dl class="fx-dl"><dt>服務據點</dt><dd>${esc(d.branch)}</dd><dt>據點電話</dt><dd class="lnk">${esc(D.booking.tel)}</dd><dt>車牌號碼</dt><dd>${maskPlate(D.car.plate)}</dd><dt>在廠等候</dt><dd>${esc(d.wait)}</dd><dt>其他意見</dt><dd>${esc(d.other || '無')}</dd></dl>
        <div class="fx-ai">${ic('spark', 14)}AI 預估本次在廠時間約 1 小時 30 分，可安排等候行程</div>
      </div>
      <div class="fx-btns"><button class="fxb red" data-act="calAdd">加入行事曆</button>
        <div class="fx-2"><button class="fxb ghost" data-act="toastDemo" data-arg="示意：進入取消預約確認">取消預約</button><button class="fxb ghost" data-act="toastDemo" data-arg="示意：開啟預約變更表單">更改預約</button></div></div>`;
  },
  cars() {
    return `<div class="fx-b"><div class="fx-t center">請選擇您要查詢的車輛</div>
      <button class="carpick" data-act="pickCar" data-arg="${D.car.plate}">${ic('car', 26)}<div><b>${D.car.plate}</b><small>${D.car.model}</small></div>${ic('chev', 16)}</button></div>`;
  },
  reminder(d) {
    const busy = d.busy;
    return `<div class="fx-b">
        <p>您好，${D.customer.call} 👋<br>您預約的保養時間為<br><b>今天 ${D.booking.time}</b></p>
        ${busy ? `<p class="fx-warn">目前服務廠作業較預期繁忙，為減少您到廠後的等候，建議您延後至 <b class="num">14:15 – 14:25</b> 抵達。</p><p class="fx-mut">您的預約權益不受影響，抵達後將優先為您進廠。</p>`
        : `<p>目前服務廠進度正常，<br>建議您於 <b class="num">13:50 – 14:00</b> 抵達。</p><p class="fx-mut">若有變動，我們會即時通知。</p>`}
      </div>
      <div class="fx-btns"><button class="fxb pri" data-act="openBookingInfo">查看預約資訊</button>${busy ? `<button class="fxb ghost" data-act="say" data-arg="收到，我會晚點到">收到，我會晚點到</button>` : ''}</div>`;
  },
  welcome() {
    return `<div class="fx-b"><p><b>${D.customer.call}，歡迎回來！</b><br>您的車輛已完成報到。</p>
        <dl class="fx-tbl"><dt>車型</dt><dd>${D.car.model}</dd><dt>車牌</dt><dd>${D.car.plate}</dd><dt>本次服務</dt><dd>定期保養</dd><dt>預約時間</dt><dd>${D.booking.time}</dd><dt>服務專員</dt><dd>${D.advisor.name}</dd></dl>
        <p>我們將開始進行車輛檢查，完成後會立即通知您。</p></div>
      <div class="fx-btns"><button class="fxb pri" data-act="openHub">查看本次服務</button></div>`;
  },
  inspected(d) {
    const c = d.p1 != null ? d : sevCounts(), n = c.p1 + c.p2 + c.p3;
    return `<div class="fx-b"><p><b>車輛檢查已完成</b><br>共發現 ${n} 個建議項目，其中 ${c.p1} 項需優先處理。</p>
        <p>您可以點擊下方按鈕，查看車況與建議說明，並選擇本次要施作的項目。</p></div>
      <div class="fx-scan">${miniCarDots()}<div class="fx-pills">${['p1', 'p2', 'p3'].map(k => `<span><i style="background:${SEV[k].color}"></i>${SEV[k].label} ${c[k]}</span>`).join('')}</div></div>
      <div class="fx-btns"><button class="fxb pri" data-act="openReport">查看車況建議</button><button class="fxb ghost" data-act="askAdvisor">請專員說明（1F 專員協助區）</button></div>
      <p class="fx-foot">兩種方式都可以：在手機上自行確認，或由${D.advisor.name}專員當面說明</p>`;
  },
  confirmed(d) {
    return `<div class="fx-b"><div class="fx-t">${ic('check', 16)} 已收到您的施作確認</div>
        <dl class="fx-tbl"><dt>施作項目</dt><dd>${d.count} 項</dd><dt>預估金額</dt><dd>${money(d.total)}</dd><dt>預計完成</dt><dd class="num">${hm(d.eta)}</dd><dt>確認時間</dt><dd class="num">${hm(d.t)}:31</dd></dl>
        <p>您可以在客休室休息，或自由安排時間，完工前 15 分鐘我們會通知您。</p></div>
      <div class="fx-btns"><button class="fxb pri" data-act="openProgress">查看維修進度</button></div>`;
  },
  started(d) {
    return `<div class="fx-b"><div class="fx-t">${ic('wrench', 16)} 您的愛車已開始維修</div>
        <p>技師 ${D.tech.name} 正在為您的愛車施工，預計 <b class="num">${hm(d.eta)}</b> 完成（約 ${d.eta - d.t} 分鐘）。</p>
        <p class="fx-mut">不必守在客休室，完工前我們會主動通知您。</p></div>
      <div class="fx-btns"><button class="fxb pri" data-act="openProgress">查看維修進度</button><button class="fxb ghost" data-act="openProgress" data-arg="free">安排等候時間</button></div>`;
  },
  progress(d) {
    const p = { eta: d.eta }, n = d.node ? { label: d.node } : null, pct = d.pct, left = d.left;
    return `<div class="fx-b"><p><b>您的車輛目前正在維修中</b><br>預計 <b class="num">${hm(p.eta)}</b> 完成，約剩 ${left} 分鐘。</p>
        <div class="fx-bar"><i style="width:${pct}%"></i></div><div class="fx-barl"><span>${n ? '目前進行：' + n.label : '準備中'}</span><b class="num">${pct}%</b></div></div>
      <div class="fx-btns"><button class="fxb pri" data-act="openProgress">查看維修進度</button>
        <button class="fxb list" data-act="openQuoteView">${ic('doc', 16)}查看施作項目</button>
        <button class="fxb list" data-act="askAdvisor" data-arg="chat">${ic('phone', 16)}聯絡服務專員</button></div>`;
  },
  addon() {
    const v = itemView('rotor');
    return `<div class="fx-b"><div class="fx-t">${ic('bell', 16)} 技師發現 1 個新的建議項目</div>
        <p>更換煞車來令片時，技師發現前煞車碟盤表面有溝痕。您可以先查看照片與說明，再決定是否本次處理。</p>
        <div class="fx-item"><div class="fx-th">${thumbArt('rotor')}</div><div><b>${v.name}</b><small>${v.line1}｜${v.line2}</small><small>費用 +${money(v.price)}｜工時 +${v.labor} 分鐘</small></div></div>
        <p class="fx-mut">不處理也不影響本次其他項目進行。</p></div>
      <div class="fx-btns"><button class="fxb pri" data-act="openAddon">查看照片與說明</button></div>`;
  },
  addonAck(d) {
    const p = { eta: d.eta };
    return `<div class="fx-b">${d.accept
      ? `<p><b>已加入本次施作</b><br>前煞車碟盤研磨（+$1,000）。<br>預計完成時間更新為 <b class="num">${hm(p.eta)}</b>。</p>`
      : `<p><b>已收到您的決定</b><br>前煞車碟盤：下次保養再複查。<br>預計完成時間維持 <b class="num">${hm(p.eta)}</b>。</p><p class="fx-mut">已加入下次保養的複查提醒。</p>`}</div>`;
  },
  soon(d) {
    const p = { eta: d.eta };
    return `<div class="fx-b"><div class="fx-t">${ic('clock', 16)} 您的愛車即將完工</div>
        <p>預計 <b class="num">${hm(p.eta)}</b> 完成，約 15 分鐘後可取車。</p>
        <dl class="fx-tbl"><dt>取車地點</dt><dd>1F 交車區</dd><dt>服務專員</dt><dd>${D.advisor.name}</dd></dl></div>
      <div class="fx-btns"><button class="fxb pri" data-act="openProgress">查看維修進度</button></div>`;
  },
  done(d) {
    const early = d.eta - d.doneAt;
    return `<div class="fx-b"><div class="fx-t">🎉 您的愛車已完成維修！</div>
        <p>${D.car.model}（${D.car.plate}）<br>本次共完成 ${d.count} 項施作項目。</p>
        <dl class="fx-tbl"><dt>總金額</dt><dd>${money(d.total)}</dd><dt>完成時間</dt><dd><span class="num">${hm(d.doneAt)}</span>${early > 0 ? `<em class="early">提前 ${early} 分</em>` : ''}</dd><dt>取車地點</dt><dd>1F 交車區</dd></dl>
        <p>感謝您的信任，期待下次再為您服務！</p></div>
      <div class="fx-btns"><button class="fxb pri" data-act="openRecord">查看維修紀錄</button><button class="fxb ghost green" data-act="openPay">線上支付（選填）</button></div>`;
  },
  care(d) {
    return `<div class="fx-b"><div class="fx-t">${ic('heart', 16)} 用車關懷</div>
        <p>${D.customer.call}您好，愛車回廠已經 3 天了，行駛還順利嗎？</p>
        ${d.brake ? `<div class="fx-tip"><b>新煞車來令片磨合期（約前 200 公里）</b><span>• 避免連續重踩煞車<br>• 前幾天煞車感覺略不同屬正常<br>• 若出現持續尖銳異音，請與我們聯繫</span></div>` : ''}
        ${d.later.length ? `<p class="fx-mut">下次保養（${D.nextService.date}）會再為您檢查：${d.later.join('、')}</p>` : ''}</div>
      <div class="fx-btns"><button class="fxb pri" data-act="careOk">一切正常</button><button class="fxb ghost" data-act="careIssue">有異狀，請專員聯繫我</button></div>`;
  },
  survey() {
    return `<div class="fx-b"><div class="fx-t center">這次的回廠體驗如何？</div>
      <div class="fx-stars">${[1, 2, 3, 4, 5].map(n => `<button data-act="openSurvey" data-arg="${n}" aria-label="${n} 顆星">${ic('star', 26)}</button>`).join('')}</div>
      <p class="fx-mut center">您的回饋會用來改善車況說明與等候體驗</p></div>`;
  },
};

function miniCarDots() {
  const A = carAnchors(S.body);
  const zs = ['ENG', 'FL', 'FR', 'CAB', 'RL', 'RR'].filter(z => zoneItems(z).length);
  return `<div class="mcar">${carSVG(S.body)}${zs.map(z => `<i style="left:${A[z][0] / 240 * 100}%;top:${A[z][1] / 480 * 100}%;background:${SEV[zoneSev(z)].color}"></i>`).join('')}</div>`;
}

/* ---------------- 推播橫幅（LIFF 開啟時） ---------------- */
function showBanner(m) {
  S.banner = { text: m.preview || (m.text || '').slice(0, 42) || '您有一則新訊息' };
  renderBanner();
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(() => { S.banner = null; renderBanner(); }, 3800 * Math.max(.6, spd() || 1));
}
function renderBanner() {
  const el = $('#banner'); if (!el) return;
  if (!S.banner) { el.classList.remove('show'); return; }
  el.innerHTML = `<button class="ban" data-act="bannerTap"><span class="ban-ic">${ic('chat', 15)}</span><span class="ban-tx"><b>TOYOTA 台灣</b><span>${esc(S.banner.text)}</span></span><span class="ban-t">現在</span></button>`;
  el.classList.add('show');
}

/* ---------------- 手機內對話框 ---------------- */
function phoneDialog(opt) {
  return new Promise(res => {
    S.dialog = { ...opt, res };
    renderDialog();
  });
}
function renderDialog() {
  const el = $('#pdialog'); if (!el) return;
  if (!S.dialog) { el.classList.remove('show'); el.innerHTML = ''; return; }
  const d = S.dialog;
  el.innerHTML = `<div class="dlg"><div class="dlg-t">${esc(d.title)}</div><div class="dlg-b">${d.body || ''}</div>
    <div class="dlg-f">${d.cancel !== false ? `<button class="dbtn" data-act="dlgCancel">${esc(d.cancel || '取消')}</button>` : ''}<button class="dbtn pri" data-act="dlgOk">${esc(d.ok || '確定')}</button></div></div>`;
  el.classList.add('show');
}

/* ---------------- LIFF ---------------- */
let _liffKey = '';
function openLiff(page, params = {}) {
  S.sheet = null;
  const wasOpen = S.liff.length > 0;
  S.liff.push({ page, params });
  renderLiff(wasOpen ? 'push' : 'open');
}
function liffBack() {
  S.sheet = null;
  S.liff.pop();
  if (!S.liff.length) closeLiff(); else renderLiff('pop');
}
function closeLiff() { S.liff = []; S.sheet = null; S.overlay = null; renderLiff('close'); }
function liffTop() { return S.liff[S.liff.length - 1]; }
function liffIs(page) { const t = liffTop(); return t && t.page === page; }

function renderLiff(mode = 'refresh') {
  const el = $('#liff'); if (!el) return;
  const scr = $('#screen'); if (scr) scr.classList.toggle('liff-on', S.liff.length > 0);
  if (!S.liff.length) { el.classList.remove('open'); _liffKey = ''; setTimeout(() => { if (!S.liff.length) el.innerHTML = ''; }, 320); return; }
  const top = liffTop(), P = PAGES[top.page], params = top.params || {};
  const key = top.page + JSON.stringify(params);
  const oldBody = $('#lbody', el);
  const keep = key === _liffKey && oldBody ? oldBody.scrollTop : 0;
  const multi = S.liff.length > 1;
  el.innerHTML = `<div class="lh">
      <button class="lh-btn" data-act="${multi ? 'liffBack' : 'liffClose'}" aria-label="${multi ? '返回' : '關閉'}">${ic(multi ? 'back' : 'close', 22)}</button>
      <div class="lh-t"><b>${esc(P.title(params))}</b><small>TOYOTA 車況透視鏡</small></div>
      <button class="lh-btn" data-act="liffClose" aria-label="關閉">${multi ? ic('close', 20) : ic('dots', 20)}</button>
    </div>
    <div class="lbody ${mode === 'push' ? 'in' : ''} ${P.bodyClass || ''}" id="lbody">${P.render(params)}</div>
    ${P.foot ? `<div class="lfoot" id="lfoot">${P.foot(params)}</div>` : ''}
    ${sheetHTML()}
    ${S.overlay ? `<div class="lover"><div class="lover-c"><div class="lover-ic">${ic('check', 34)}</div><b>${esc(S.overlay.title)}</b><span>${esc(S.overlay.sub || '')}</span></div></div>` : ''}`;
  el.classList.add('open');
  const nb = $('#lbody', el);
  if (nb && keep) nb.scrollTop = keep;
  _liffKey = key;
  if (P.mount) P.mount(params, mode);
}
function renderLiffFoot() {
  const top = liffTop(); if (!top) return;
  const P = PAGES[top.page], f = $('#lfoot');
  if (P.foot && f) f.innerHTML = P.foot(top.params || {});
}

function sheetHTML() {
  if (!S.sheet) return '';
  const z = S.sheet.zone, its = zoneItems(z), normals = NORMALS.filter(n => n.zone === z);
  return `<div class="sdim" data-act="closeSheet"></div>
    <div class="sheet" role="dialog" aria-label="${ZONES[z].label}">
      <div class="grab"></div>
      <div class="sh-head"><span class="zic">${ic(ZONES[z].icon, 20)}</span><div><b>${ZONES[z].label}</b><small>${its.length ? `本區域共 ${its.length} 個建議項目` : '本區域狀況正常'}</small></div><button class="lh-btn" data-act="closeSheet" aria-label="關閉">${ic('close', 18)}</button></div>
      ${its.map(v => `<button class="zrow" data-act="openItem" data-arg="${v.id}">
          <span class="zth">${thumbArt(v.cmp.kind === 'tread' ? 'tread' : v.cmp.kind)}</span>
          <span class="zinfo"><b>${esc(v.name)}</b>${sevChip(v.sev)}<small>${esc(v.line1)}</small><small>${esc(v.line2)}</small></span>${ic('chev', 18)}</button>`).join('')}
      ${normals.length ? `<div class="znorm">${ic('check', 14)}<span>狀況正常：${normals.map(n => `${n.name}（${n.val}）`).join('、')}</span></div>` : ''}
    </div>`;
}

function sevChip(sev) { const s = SEV[sev]; return `<span class="chip" style="--c:${s.color};--s:${s.soft};--i:${s.ink}">${s.label}</span>`; }

/* ---------- 量測刻度 ---------- */
function gaugeHTML(g) {
  if (!g) return '';
  if (g.discrete) {
    const i = g.discrete.indexOf(g.cur);
    return `<div class="gauge disc">${g.discrete.map((d, k) => `<div class="gd ${k === i ? 'on' : ''} g${k}"><i></i><span>${d}</span></div>`).join('')}</div>`;
  }
  const pos = v => clamp((v - g.from) / (g.to - g.from), 0, 1) * 100;
  const lp = pos(g.limit);
  const grad = `linear-gradient(90deg, #1E9E5B 0%, #8CC66B ${(lp * .55).toFixed(1)}%, #F2B705 ${(lp * .88).toFixed(1)}%, #E5322D ${lp.toFixed(1)}%, #B42318 100%)`;
  return `<div class="gauge">
      <div class="g-track" style="background:${grad}">
        <div class="g-limit" style="left:${pos(g.limit)}%"></div>
        ${g.extra != null ? `<div class="g-dot alt" style="left:${pos(g.extra)}%"><span>${esc(g.extraLabel)}</span></div>` : ''}
        <div class="g-dot" style="left:${pos(g.cur)}%"><span>${esc(g.curLabel)}</span></div>
      </div>
      <div class="g-lab"><span>${esc(g.fromLabel)}</span><span class="lim" style="left:${pos(g.limit)}%">${esc(g.limitLabel)}</span><span>${esc(g.toLabel)}</span></div>
    </div>`;
}

function photoHTML(v) {
  const real = S.photos[v.id];
  return `<figure class="pho">${real ? `<img src="${real}" alt="${esc(v.name)} 現場照片">` : photoArt(v.photo.kind)}
    <figcaption><span>${ic('camera', 13)} 技師 ${D.tech.name}｜${v.photo.at}｜${esc(v.photo.where)}</span><em>${real ? '現場照片' : '現場照片（示意）'}</em></figcaption></figure>`;
}

function aiBadge(prefix = 'AI 依技師量測與照片整理白話說明') {
  const appr = S.inspect.approved;
  return `<div class="aib">${ic('spark', 14)}<span>${prefix}${appr ? `，已由${D.advisor.title} ${D.advisor.name} 審核` : ''}</span></div>`;
}

/* ---------- 頁面 ---------- */
const PAGES = {
  hub: {
    title: () => '本次服務',
    render() {
      const si = stageIdx();
      const st = ['報到', '檢查', '確認', '維修', '完工'];
      const doneIdx = [1, 2, 3, 5, 5];
      const cur = st.findIndex((s, i) => si < doneIdx[i]);
      const c = sevCounts(), n = c.p1 + c.p2 + c.p3, p = plan();
      const card = (act, icon, t, sub, tag, dis) => `<button class="hcard ${dis ? 'dis' : ''}" data-act="${act}"><span class="hic">${ic(icon, 20)}</span><span class="htx"><b>${t}</b><small>${sub}</small></span>${tag ? `<em>${tag}</em>` : ''}${ic('chev', 16)}</button>`;
      return `<div class="hub-top">
          <div class="hub-car">${carSVG(S.body)}</div>
          <div class="hub-id"><small>${esc(D.booking.branch)}｜工單 ${D.ro}</small><b>${D.car.model}</b><span class="plate">${D.car.plate}</span><small>${fmtN(D.car.mileage)} km｜${D.booking.service}</small></div>
        </div>
        <ol class="stages">${st.map((s, i) => `<li class="${i < cur || cur === -1 ? 'done' : i === cur ? 'cur' : ''}"><i>${i < cur || cur === -1 ? ic('check', 12) : i + 1}</i><span>${s}</span></li>`).join('')}</ol>
        <div class="hub-list">
          ${card('openReport', 'eye', '車況報告', si >= 2 ? `${n} 個建議項目｜${c.p1} 項需優先處理` : '技師檢查中，完成後通知您', si >= 2 ? '透視' : '', si < 2)}
          ${card('openSelect', 'doc', '報價與施作確認', S.confirm ? `已確認 ${S.confirm.count} 項｜${money(S.confirm.total)}` : si >= 2 ? '勾選項目，金額與完工時間即時計算' : '檢查完成後開放', '', si < 2)}
          ${card('openProgress', 'clock', '維修進度', si >= 4 ? (S.stage === 'done' ? `已於 ${hm(S.work.doneAt)} 完成` : `預計 ${hm(p.eta)} 完成`) : '確認施作後開始', '', si < 4)}
          ${card('openLounge', 'coffee', '客休服務', `${D.lounge.floor}｜線上點飲料`, '', false)}
        </div>
        <div class="adv-card"><span class="av adv">王</span><div><b>${D.advisor.name}</b><small>本次服務專員</small></div>
          <button class="btn sm ghost" data-act="askAdvisor" data-arg="hub">${ic('chat', 15)}找專員</button></div>
        <p class="hub-note">本服務入口會持續同步本次回廠的車況、報價、進度與完工資訊。</p>`;
    },
  },

  report: {
    title: () => '車況檢查結果',
    bodyClass: 'pad0',
    render() {
      const c = sevCounts();
      const A = carAnchors(S.body);
      const zlist = ['ENG', 'FR', 'FL', 'RL', 'RR', 'CAB', 'REAR'];
      const hs = zlist.map((z, i) => {
        const its = zoneItems(z), sev = zoneSev(z), [x, y] = A[z];
        const side = x < 100 ? 'l' : x > 140 ? 'r' : 'c';
        if (!its.length) return `<button class="hs ok" style="left:${x / 240 * 100}%;top:${y / 480 * 100}%;--d:${(y / 480 * 2.0 + .35).toFixed(2)}s" data-act="openZone" data-arg="${z}" aria-label="${ZONES[z].label} 狀況正常">${ic('check', 11)}</button>`;
        return `<button class="hs ${sev} ${side}" style="left:${x / 240 * 100}%;top:${y / 480 * 100}%;--c:${SEV[sev].color};--d:${(y / 480 * 2.0 + .35).toFixed(2)}s" data-act="openZone" data-arg="${z}" aria-label="${ZONES[z].label} ${its.length} 個項目">
          <b>${its.length}</b><span class="hs-l">${ZONES[z].label}</span></button>`;
      }).join('');
      const items = findings();
      return `<div class="rp-head"><small>檢查時間 2026/10/12 ${hm(S.inspectedAt || S.now)}｜技師 ${D.tech.name}</small>
          <div class="legend">${['p1', 'p2', 'p3', 'ok'].map(k => `<span><i style="background:${SEV[k].color}"></i>${SEV[k].label}（${c[k]}）</span>`).join('')}</div></div>
        <div class="xstage ${S.scanned ? 'scanned' : 'scanning'} ${S.xray ? 'xray-on' : ''}" id="xstage">
          <div class="xgrid"></div>
          <div class="xcar">
            <div class="lay solid">${carSVG(S.body)}</div>
            <div class="lay xr">${carSVG(S.body, { xray: true })}</div>
            <div class="scanbar"></div>
            ${hs}
          </div>
          <button class="xtog" data-act="toggleXray">${ic('eye', 15)}${S.xray ? '一般檢視' : '透視模式'}</button>
          <div class="xmeta">${BODY[S.body].label}｜${BODY[S.body].model}</div>
          <div class="xhint" id="xhint">AI 透視掃描中…</div>
        </div>
        <div class="rp-body">
          <p class="hint">${ic('info', 14)}點擊車體亮燈處，查看該區域的項目</p>
          <div class="zlist">${zlist.filter(z => zoneItems(z).length).map(z => `<button class="zl" data-act="openZone" data-arg="${z}"><span class="zic">${ic(ZONES[z].icon, 18)}</span><b>${ZONES[z].label}</b><i style="background:${SEV[zoneSev(z)].color}"></i><span class="num">${zoneItems(z).length}</span>${ic('chev', 16)}</button>`).join('')}</div>
          <h4 class="sec-t">全部建議項目</h4>
          ${items.map(v => `<button class="irow" data-act="openItem" data-arg="${v.id}"><span class="zth">${thumbArt(v.cmp.kind)}</span><span class="zinfo"><b>${esc(v.name)}${v.base ? '<em class="tag">本次預約</em>' : ''}</b>${sevChip(v.sev)}<small>${esc(v.line1)}｜${esc(v.line2)}</small></span>${ic('chev', 18)}</button>`).join('')}
          <div class="normal-sum">${ic('shield', 16)}<span>另有 ${c.ok} 項檢查狀況正常（電瓶、煞車油、後輪來令片、燈光等）</span></div>
          ${aiBadge()}
        </div>`;
    },
    foot: () => `<button class="btn pri full" data-act="openSelect">選擇本次施作項目</button>`,
    mount() {
      if (S.scanned) return;
      const dur = fastMode() ? 0 : 2600 * spd();
      clearTimeout(PAGES.report._t);
      PAGES.report._t = setTimeout(() => {
        S.scanned = true;
        const st = $('#xstage'); if (st) { st.classList.remove('scanning'); st.classList.add('scanned'); }
      }, dur);
    },
  },

  item: {
    title: p => itemView(p.id).short,
    render(p) {
      const v = itemView(p.id);
      return `<div class="it-top">${sevChip(v.sev)}<h2>${esc(v.name)}</h2><p>${esc(v.measure)}</p></div>
        <div class="cmp">
          <div class="cmp-c"><small>${esc(v.cmp.newLabel)}</small>${artFor(v, 'new')}<b class="num good">${esc(v.cmp.newText)}</b></div>
          <div class="cmp-c cur" style="--c:${SEV[v.sev].color}"><small>${esc(v.cmp.curLabel)}</small>${artFor(v, 'cur')}<b class="num" style="color:${SEV[v.sev].ink}">${esc(v.cmp.curText)}</b></div>
        </div>
        ${gaugeHTML(v.gauge)}
        ${v.forecast ? `<div class="forecast">${ic('alert', 15)}<span>${esc(v.forecast)}</span></div>` : ''}
        <div class="box why" style="--c:${SEV[v.sev].color};--s:${SEV[v.sev].soft}"><h5>${ic('info', 15)}${esc(v.whyTitle)}</h5><p>${esc(v.why)}</p></div>
        <div class="plain"><span class="aimk">${ic('spark', 13)}白話說明</span><p>${esc(v.plain)}</p></div>
        <div class="box risk"><h5>不處理可能的影響</h5><ul>${v.risks.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
        ${v.insight ? `<div class="box data"><h5>${ic('chart', 15)}${esc(v.insight.title)}</h5>
            <div class="drows">${v.insight.rows.map(r => `<div><span>${esc(r[0])}</span><b class="num">${esc(r[1])}</b><small>${esc(r[2])}</small></div>`).join('')}</div>
            ${v.insight.note ? `<p>${esc(v.insight.note)}</p>` : ''}</div>` : ''}
        ${photoHTML(v)}
        <div class="cost"><div><small>費用（含零件、工資、稅）</small><b class="num">${money(v.price)}</b><span>${esc(v.priceNote)}</span></div>
          <div><small>預估工時</small><b class="num">${v.base ? '已含' : '+' + v.labor + ' 分'}</b><span>${v.base ? '定期保養標準工時內' : esc(v.laborNote || '原廠標準工時')}</span></div></div>
        <p class="src">資料來源：${v.sources.join('、')}</p>
        ${aiBadge()}`;
    },
    foot(p) {
      const v = itemView(p.id), on = S.sel[p.id];
      const right = v.base ? `<button class="btn pri" disabled>${ic('check', 16)}本次預約項目</button>`
        : S.confirm ? `<button class="btn pri" disabled>${on ? '已確認施作' : '本次不施作'}</button>`
          : on ? `<button class="btn ok" data-act="removeItem" data-arg="${p.id}">${ic('check', 16)}已加入本次維修</button>`
            : `<button class="btn pri" data-act="addItem" data-arg="${p.id}">加入本次維修</button>`;
      return `<button class="btn ai" data-act="openAI" data-arg="${p.id}">${ic('spark', 16)}詢問 AI</button>${right}`;
    },
  },

  ai: {
    title: () => 'AI 車況助手',
    bodyClass: 'aibody',
    render(p) {
      const key = p.id || 'general', v = key !== 'general' ? itemView(key) : null;
      const th = S.threads[key] || [];
      const sug = v ? ['這次不更換可以嗎？', '為什麼會磨損這麼快？', '費用包含哪些？', '更換需要多久？', '原廠零件差在哪？'] : ['維修進度如何？', '費用多少？'];
      const last = th.filter(m => m.role === 'ai').slice(-1)[0];
      const chips = (last && last.followups && last.followups.length ? last.followups : sug).filter(s => !th.some(m => m.role === 'me' && m.text === s)).slice(0, 4);
      return `<div class="ai-ctx">${v ? `<span class="zth sm">${thumbArt(v.cmp.kind)}</span><div><small>針對本次車況提問</small><b>${esc(v.name)}｜${esc(v.line1)}</b></div>` : `<div><b>本次服務</b></div>`}<em>${esc(AI.label())}</em></div>
        <div class="ai-list" id="aiList">
          ${th.length ? '' : `<div class="ai-msg ai"><span class="av ai">${ic('spark', 16)}</span><div class="ai-bub">您好，我是 AI 車況助手。我會依本次工單、原廠標準與您的用車數據回答；涉及行車安全或保固判斷時，會轉由專員協助。</div></div>`}
          ${th.map((m, i) => m.role === 'me' ? `<div class="ai-msg me"><div class="ai-bub">${esc(m.text)}</div></div>`
          : `<div class="ai-msg ai ${m.typing ? 'typing' : ''}"><span class="av ai">${ic('spark', 16)}</span><div class="ai-col"><div class="ai-bub"><div class="ai-text" data-full="${esc(m.text)}">${nl2br(m.text)}</div>
                ${m.handoff ? `<div class="handoff">${ic('users', 15)}<span>${S.handoffs.some(h => h.key === key && h.idx === i) ? `已通知 ${D.advisor.name} 專員，約 3 分鐘內回覆` : '此問題建議由服務專員確認'}</span>${S.handoffs.some(h => h.key === key && h.idx === i) ? '' : `<button class="btn sm" data-act="handoffAI" data-arg="${key}|${i}">轉接專員</button>`}</div>` : ''}</div>
              <div class="ai-meta"><span>依據：${(m.sources || []).join('、')}</span>
                <span class="fb"><button class="${m.fb === 'up' ? 'on' : ''}" data-act="aiFb" data-arg="${key}|${i}|up" aria-label="有幫助">${ic('up', 15)}</button><button class="${m.fb === 'down' ? 'on' : ''}" data-act="aiFb" data-arg="${key}|${i}|down" aria-label="沒有幫助">${ic('down', 15)}</button></span></div></div></div>`).join('')}
          ${S.aiBusy ? `<div class="ai-msg ai"><span class="av ai">${ic('spark', 16)}</span><div class="ai-bub typing"><i></i><i></i><i></i></div></div>` : ''}
        </div>
        <div class="ai-sug">${chips.map(s => `<button class="chipbtn" data-act="aiAsk" data-arg="${esc(s)}">${esc(s)}</button>`).join('')}</div>`;
    },
    foot: p => `<form class="ai-in" data-form="ai" data-key="${p.id || 'general'}"><input id="aiInput" autocomplete="off" placeholder="輸入問題，AI 即時為您解答…" value="${esc(S.aiDraft || '')}"><button type="submit" aria-label="送出">${ic('send', 18)}</button></form>`,
    mount() {
      const l = $('#lbody'); if (l) l.scrollTop = l.scrollHeight;
      const t = $('.ai-msg.typing .ai-text');
      if (t) typewrite(t);
    },
  },

  select: {
    title: () => '本次建議施作項目',
    render() {
      const its = findings();
      const groups = ['p1', 'p2', 'p3'].map(k => ({ k, its: its.filter(v => v.sev === k) })).filter(g => g.its.length);
      const locked = !!S.confirm;
      return `<p class="sel-intro">勾選本次要施作的項目，下方的金額與完工時間會即時更新。${locked ? '<b>（已確認施作，如需變更請聯絡專員）</b>' : ''}</p>
        ${groups.map(g => `<div class="sg"><div class="sg-h" style="--c:${SEV[g.k].color};--s:${SEV[g.k].soft};--i:${SEV[g.k].ink}"><i></i>${SEV[g.k].label}（${g.its.length}）</div>
          ${g.its.map(v => { const on = S.sel[v.id]; return `<div class="srow ${on ? 'on' : ''} ${locked ? 'lock' : ''}">
              <button class="sck" data-act="toggleSel" data-arg="${v.id}" aria-pressed="${on}" ${locked ? 'disabled' : ''}><span class="cbox">${on ? ic('check', 14) : ''}</span>
                <span class="sinfo"><b>${esc(v.name)}${v.base ? '<em class="tag">本次預約</em>' : ''}</b><small>${esc(v.base ? '依原廠建議更換（含機油濾芯）' : v.line1)}</small></span>
                <span class="sprice"><b class="num">${money(v.price)}</b><small>${v.base ? '工時已含' : '+' + v.labor + ' 分'}</small></span></button>
              <button class="sinfo-btn" data-act="openItem" data-arg="${v.id}" aria-label="查看說明">${ic('info', 17)}</button></div>`; }).join('')}</div>`).join('')}
        ${S.sel.brake && S.sel.rotate ? `<div class="merge">${ic('bolt', 15)}<span>煞車與調位同時拆輪施作，系統已自動扣減重複工時（調位 15 → 5 分鐘）</span></div>` : ''}`;
    },
    foot() {
      const qt = quote(), p = plan();
      return `<div class="sumbar"><div class="sum-l"><span>已選 <b class="num">${qt.count}</b> 項</span><span>預估金額 <b class="num">${money(qt.total)}</b></span><span>預估增加工時 <b class="num">+${p.delta} 分鐘</b>｜完成 <b class="num">${hm(p.eta)}</b></span></div>
        <button class="btn pri" data-act="openQuote">查看報價單</button></div>`;
    },
  },

  quote: {
    title: () => '報價單確認',
    render(p) {
      const qt = quote(), pl = plan();
      const skip = findings().filter(v => !S.sel[v.id]);
      const view = p.view || S.confirm;
      return `<div class="q-head"><b>${D.car.model}｜${D.car.plate}</b><small>工單 ${D.ro}｜${D.booking.branch}</small></div>
        <section class="qsec"><h5><i class="dot b"></i>定期保養</h5>
          ${qt.base.length ? PRICE.oil.parts.map(([n, pr]) => `<div class="ql"><span>${n}</span><b class="num">${money(pr)}</b></div>`).join('') : '<div class="ql mut"><span>未選擇</span></div>'}
          <div class="ql sub"><span>小計</span><b class="num">${money(qt.baseSum)}</b></div></section>
        <section class="qsec"><h5><i class="dot o"></i>追加維修</h5>
          ${qt.add.length ? qt.add.map(v => `<div class="ql"><span>${esc(v.name)}</span><b class="num">${money(v.price)}</b></div>`).join('') : '<div class="ql mut"><span>無</span></div>'}
          <div class="ql sub"><span>小計</span><b class="num">${money(qt.addSum)}</b></div></section>
        <div class="qtot"><div><b>預估總額</b><small>（含零件、工資、稅）</small></div><b class="num big">${money(qt.total)}</b></div>
        <div class="qeta"><div><span>原預估完成時間</span><b class="num">${hm(pl.baseEta)}</b></div><div><span>目前預估完成</span><b class="num">${hm(pl.eta)}</b>${pl.delta > 0 ? `<em>+${pl.delta} 分鐘</em>` : ''}</div></div>
        ${skip.length ? `<div class="qskip">${ic('bell', 15)}<span>本次不施作：${skip.map(v => v.name).join('、')}（已加入下次保養複查提醒）</span></div>` : ''}
        ${view ? `<div class="signed">${ic('shield', 16)}<div><b>已於 ${hm(S.confirm.t)}:31 數位簽名確認</b><small>確認紀錄與時間戳記已保存於工單</small></div>${S.confirm.sig ? `<img src="${S.confirm.sig}" alt="簽名">` : ''}</div>`
          : `<label class="agree"><input type="checkbox" id="agreeBox" data-act="agree" ${S.agree ? 'checked' : ''}><span>我已了解上述施作內容、費用與預估完成時間，同意進行施作</span></label>
          <div class="sigwrap"><canvas id="sigpad" aria-label="簽名區"></canvas><span class="sig-ph ${S.signed ? 'hide' : ''}">${ic('sig', 18)}請在此簽名</span><button class="sig-clr" data-act="sigClear">清除</button></div>`}`;
    },
    foot(p) {
      if (p.view || S.confirm) return `<button class="btn ghost full" data-act="liffBack">返回</button>`;
      const ok = S.agree && S.signed;
      return `<button class="btn ghost" data-act="liffBack">返回修改</button><button class="btn pri" data-act="confirmWork" ${ok ? '' : 'disabled'}>確認施作</button>`;
    },
    mount(p) { if (!(p.view || S.confirm)) mountSig(); },
  },

  progress: {
    title: () => '維修進度',
    render(p) {
      if (stageIdx() < 4) return `<div class="empty">${ic('clock', 30)}<b>確認施作後即會開始維修</b><span>開工後可在這裡看到即時進度與預計完成時間。</span></div>`;
      const pl = plan(), done = S.stage === 'done';
      const pct = workPct(), left = Math.max(0, pl.eta - S.now), n = currentNode();
      const fixed = [
        { t: S.arrivedAt, l: '車輛進廠', s: '完成報到' },
        { t: S.inspectedAt, l: '車輛檢查完成', s: `共發現 ${findings().length} 個建議項目` },
        { t: S.confirm ? S.confirm.t : null, l: '已確認施作項目', s: S.confirm ? `${S.confirm.count} 項，預估 ${hm(S.confirm.eta)} 完成` : '' },
      ];
      const nodes = pl.nodes.map(nd => ({ t: nd.s, l: nd.label, s: `標準工時 ${nd.min} 分鐘`, st: done || S.now >= nd.e ? 'done' : (S.now >= nd.s ? 'cur' : '') }));
      return `<div class="pg-hero ${done ? 'done' : ''}">
          <div class="pg-ring">${ringSVG(pct, 132, 11, done ? '#1E9E5B' : '#1E9E5B', '#E3EAE6')}<div class="pg-rc">${done ? `<small>完成</small><b class="num">${hm(S.work.doneAt)}</b><small>可取車</small>` : `<small>預計</small><b class="num">${hm(pl.eta)}</b><small>完成</small>`}</div></div>
          <div class="pg-t">${done ? `<b>已完成維修</b><span>請至 1F 交車區取車</span>` : `<b>約剩 <span class="num">${left}</span> 分鐘</b><span>${n ? '目前進行：' + esc(n.label) : '準備中'}</span>`}<small>技師 ${D.tech.name}｜工位 ${D.tech.bay}</small></div>
        </div>
        <ol class="tl">
          ${fixed.filter(f => f.t != null).map(f => `<li class="done"><i>${ic('check', 12)}</i><span class="num">${hm(f.t)}</span><div><b>${f.l}</b><small>${esc(f.s)}</small></div></li>`).join('')}
          ${nodes.map(nd => `<li class="${nd.st}"><i>${nd.st === 'done' ? ic('check', 12) : ''}</i><span class="num">${hm(nd.t)}</span><div><b>${esc(nd.l)}</b><small>${nd.st === 'cur' ? '進行中' : esc(nd.s)}</small></div></li>`).join('')}
          <li class="${done ? 'done' : ''} last"><i>${done ? ic('check', 12) : ''}</i><span class="num">${hm(done ? S.work.doneAt : pl.eta)}</span><div><b>${done ? '完工' : '預計完成'}</b><small>${done ? '已通知您取車' : '完成後將以 LINE 通知您'}</small></div></li>
        </ol>
        ${done ? '' : `<section class="free" id="free"><h4 class="sec-t">等候時間，由您安排</h4>
          <button class="swrow" data-act="toggleRemind" aria-pressed="${S.remind}"><span>${ic('bell', 17)}完工前 15 分鐘 LINE 提醒我</span><i class="sw ${S.remind ? 'on' : ''}"></i></button>
          <div class="opts">
            <button class="opt" data-act="openLounge"><span class="oic">${ic('coffee', 18)}</span><b>留在客休室</b><small>線上點飲料｜${D.lounge.seat}</small></button>
            <div class="opt"><span class="oic">${ic('walk', 18)}</span><b>附近走走</b><small>步行 5 分鐘內有咖啡廳與超市</small></div>
            <div class="opt"><span class="oic">${ic('laptop', 18)}</span><b>處理工作</b><small>客休室安靜區有插座與 Wi-Fi</small></div>
          </div>
          <button class="btn ${S.away ? 'ok' : 'ghost'} full" data-act="toggleAway">${S.away ? ic('check', 16) + '已登記暫離，完工前會通知您' : ic('leave', 16) + '我要暫時離開服務廠'}</button>
        </section>`}`;
    },
    mount(p) { if (p && p.anchor === 'free') { const f = $('#free'); if (f) f.scrollIntoView({ block: 'start' }); } },
  },

  addon: {
    title: () => '追加建議項目',
    render() {
      const v = itemView('rotor'), pl = plan();
      const decided = S.addonState === 'accepted' || S.addonState === 'declined';
      return `<div class="addon-flag">${ic('bell', 15)}維修中發現｜技師 ${D.tech.name} ${v.photo.at} 回報</div>
        <div class="it-top">${sevChip(v.sev)}<h2>${esc(v.name)}</h2><p>${esc(v.measure)}</p></div>
        ${photoHTML(v)}
        <div class="cmp">
          <div class="cmp-c"><small>${esc(v.cmp.newLabel)}</small>${artFor(v, 'new')}<b class="num good">${esc(v.cmp.newText)}</b></div>
          <div class="cmp-c cur" style="--c:${SEV[v.sev].color}"><small>${esc(v.cmp.curLabel)}</small>${artFor(v, 'cur')}<b class="num" style="color:${SEV[v.sev].ink}">${esc(v.cmp.curText)}</b></div>
        </div>
        ${gaugeHTML(v.gauge)}
        <div class="box why" style="--c:${SEV[v.sev].color};--s:${SEV[v.sev].soft}"><h5>${ic('info', 15)}${esc(v.whyTitle)}</h5><p>${esc(v.why)}</p></div>
        <div class="plain"><span class="aimk">${ic('spark', 13)}白話說明</span><p>${esc(v.plain)}</p></div>
        <div class="box risk"><h5>不處理可能的影響</h5><ul>${v.risks.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
        <div class="choice">
          <div class="${S.addonState === 'declined' ? 'on' : ''}"><b>下次保養再複查</b><span>費用 +$0｜完成時間維持 <b class="num">${hm(S.addonState === 'accepted' ? pl.eta - 20 : pl.eta)}</b></span></div>
          <div class="${S.addonState === 'accepted' ? 'on' : ''}"><b>本次一起處理</b><span>費用 +${money(v.price)}｜完成時間 <b class="num">${hm(S.addonState === 'accepted' ? pl.eta : pl.eta + 20)}</b></span></div>
        </div>
        ${decided ? `<div class="decided">${ic('check', 15)}您已選擇：${S.addonState === 'accepted' ? '本次一起處理' : '下次保養再複查'}</div>` : ''}
        ${aiBadge('AI 依技師回報與照片生成說明')}`;
    },
    foot() {
      const decided = S.addonState === 'accepted' || S.addonState === 'declined';
      if (decided) return `<button class="btn ai" data-act="openAI" data-arg="rotor">${ic('spark', 16)}詢問 AI</button><button class="btn ghost" data-act="liffClose">關閉</button>`;
      return `<button class="btn ai sq" data-act="openAI" data-arg="rotor" aria-label="詢問 AI">${ic('spark', 18)}</button><button class="btn ghost" data-act="addonDecide" data-arg="decline">下次再複查</button><button class="btn pri" data-act="addonDecide" data-arg="accept">本次處理 +$1,000</button>`;
    },
  },

  record: {
    title: () => '維修紀錄',
    render() {
      const qt = quote(), pl = plan(), done = S.stage === 'done';
      const before = healthScore(false), after = healthScore(true);
      const later = findings().filter(v => !S.sel[v.id]).map(v => v.name);
      if (S.addonState === 'declined') later.push('前煞車碟盤（複查溝痕）');
      return `<div class="rc-hero"><div class="rc-ic">${ic('check', 26)}</div><div><b>${done ? '您的愛車已完成維修' : '維修尚未完成'}</b><span>${done ? `${hm(S.work.doneAt)} 完成${pl.eta - S.work.doneAt > 0 ? `，比預計提前 ${pl.eta - S.work.doneAt} 分鐘` : ''}` : ''}</span></div></div>
        <div class="health">
          <div class="hl-r">${ringSVG(after / 100, 104, 10, '#1E9E5B', '#E3EAE6')}<div class="hl-c"><b class="num">${after}</b><small>保養後</small></div></div>
          <div class="hl-t"><b>車況健康度</b><span>保養前 <b class="num">${before}</b> → 保養後 <b class="num">${after}</b></span><small>依本次檢查項目的緊急程度計算</small></div>
        </div>
        <h4 class="sec-t">本次完成項目</h4>
        <div class="done-list">${qt.its.map(v => `<div class="dl"><span class="dk">${ic('check', 13)}</span><div><b>${esc(v.name)}</b><small>${esc(recordLine(v))}</small></div><b class="num">${money(v.price)}</b></div>`).join('')}
          <div class="dl tot"><span></span><div><b>總金額</b><small>含零件、工資、稅</small></div><b class="num">${money(qt.total)}</b></div></div>
        <h4 class="sec-t">交車說明</h4>
        <ul class="checks"><li>${ic('check', 14)}替換下來的舊來令片已放在交車區，可現場查看</li><li>${ic('check', 14)}座椅、腳踏墊、方向盤保護套已移除</li><li>${ic('check', 14)}車內設定（座椅位置、音響）已恢復原樣</li><li>${ic('check', 14)}電子明細已同步至 My TOYOTA App</li></ul>
        <h4 class="sec-t">下次保養</h4>
        <div class="next"><div><b class="num">${D.nextService.date}</b><small>或 ${D.nextService.km}（先到者為準）</small></div><button class="btn sm ghost" data-act="calAdd">${ic('cal', 15)}加入行事曆</button></div>
        ${later.length ? `<div class="qskip">${ic('bell', 15)}<span>下次保養複查：${later.join('、')}</span></div>` : ''}`;
    },
    foot: () => `<button class="btn ghost" data-act="openSurvey" data-arg="0">評價本次服務</button><button class="btn pri" data-act="openPay">線上支付（選填）</button>`,
  },

  pay: {
    title: () => '線上支付',
    render() {
      const qt = quote(), use = !!S.payPoints, pts = Math.min(D.customer.points, qt.total), due = qt.total - (use ? pts : 0);
      if (S.pay) return `<div class="paid"><div class="rc-ic">${ic('check', 28)}</div><b>付款完成（示意）</b><span>實付 ${money(S.pay.due)}｜${S.pay.use ? `和泰Points 折抵 ${fmtN(S.pay.pts)} 點` : '未使用點數'}</span><small>電子發票與明細已同步至 My TOYOTA App</small></div>`;
      return `<div class="pay-amt"><small>應付金額</small><b class="num">${money(qt.total)}</b><span>工單 ${D.ro}</span></div>
        <button class="swrow" data-act="payPoints" aria-pressed="${use}"><span>${ic('gift', 17)}使用和泰Points 折抵（可用 ${fmtN(D.customer.points)} 點，1 點 1 元）</span><i class="sw ${use ? 'on' : ''}"></i></button>
        <div class="pay-calc"><div><span>點數折抵</span><b class="num">-${money(use ? pts : 0)}</b></div><div class="tot"><span>實付金額</span><b class="num">${money(due)}</b></div></div>
        <div class="pay-m"><div class="on">${ic('card', 18)}<b>和泰Pay</b><small>已綁定｜示意</small></div><div>${ic('users', 18)}<b>現場結帳</b><small>櫃台或桌邊結帳</small></div></div>
        <p class="note">PoC 示意畫面，不會進行實際扣款；正式導入時串接和泰Pay，並保留現場與桌邊結帳。</p>`;
    },
    foot: () => S.pay ? `<button class="btn ghost full" data-act="liffBack">返回</button>` : `<button class="btn pri full" data-act="payConfirm">確認付款（示意）</button>`,
  },

  survey: {
    title: () => '服務評價',
    render(p) {
      if (S.survey) return `<div class="paid"><div class="rc-ic">${ic('heart', 26)}</div><b>謝謝您的回饋！</b><span>我們會持續改善車況說明與等候體驗</span></div>`;
      const d = S.surveyDraft || (S.surveyDraft = { all: p.stars || 0, clear: 0, free: 0, tags: [] });
      const row = (k, label) => `<div class="srv"><b>${label}</b><div class="stars">${[1, 2, 3, 4, 5].map(n => `<button class="${d[k] >= n ? 'on' : ''}" data-act="surveyStar" data-arg="${k}|${n}" aria-label="${n} 顆星">${ic('star', 26)}</button>`).join('')}</div></div>`;
      const tags = ['車況說明很清楚', '價格透明', '可以自由安排時間', 'AI 回答有幫助', '希望專員多說明'];
      return `${row('all', '整體滿意度')}${row('clear', '這次的車況說明清楚易懂嗎？')}${row('free', '等候時間能自由安排嗎？')}
        <div class="tags">${tags.map(t => `<button class="chipbtn ${d.tags.includes(t) ? 'on' : ''}" data-act="surveyTag" data-arg="${t}">${t}</button>`).join('')}</div>`;
    },
    foot: () => S.survey ? `<button class="btn ghost full" data-act="liffClose">關閉</button>` : `<button class="btn pri full" data-act="surveySubmit">送出評價</button>`,
  },

  lounge: {
    title: () => '客休服務',
    render() {
      const L = S.loungeDraft || (S.loungeDraft = { pick: 0, mode: S.away ? 'take' : 'seat' });
      const menu = [['美式咖啡', '熱｜冰'], ['拿鐵', '熱｜冰'], ['冷泡茶', '無糖'], ['水果醋飲', '冰'], ['米果', '點心'], ['公益手工餅乾', '點心']];
      if (S.lounge) return `<div class="paid"><div class="rc-ic">${ic('coffee', 26)}</div><b>已送出：${esc(S.lounge.item)}</b><span>${S.lounge.mode === 'seat' ? `客休專員將送到 ${D.lounge.seat}` : '可於 2F 吧台外帶取餐'}</span></div>`;
      return `<p class="sel-intro">${D.lounge.floor}｜免費飲品與點心（依據點供應為準）</p>
        <div class="menu-grid">${menu.map((m, i) => `<button class="mi ${L.pick === i ? 'on' : ''}" data-act="loungePick" data-arg="${i}"><b>${m[0]}</b><small>${m[1]}</small></button>`).join('')}</div>
        <div class="seg"><button class="${L.mode === 'seat' ? 'on' : ''}" data-act="loungeMode" data-arg="seat">送到座位（${D.lounge.seat}）</button><button class="${L.mode === 'take' ? 'on' : ''}" data-act="loungeMode" data-arg="take">外帶</button></div>
        <h4 class="sec-t">其他客休服務</h4>
        <div class="lx">
          <button class="lxr" data-act="loungeX" data-arg="按摩枕"><span class="oic">${ic('heart', 17)}</span><span><b>腰背按摩枕借用</b><small>客休專員送到座位</small></span><em>${S.loungeX && S.loungeX.includes('按摩枕') ? '已申請' : '借用'}</em></button>
          <div class="lxr"><span class="oic">${ic('book', 17)}</span><span><b>書報雜誌</b><small>2F 閱讀區，每半年更新書單</small></span></div>
          <div class="lxr"><span class="oic">${ic('bag', 17)}</span><span><b>原廠精品</b><small>雨傘、水壺等生活商品，可用和泰Points</small></span></div>
        </div>`;
    },
    foot: () => S.lounge ? `<button class="btn ghost full" data-act="liffBack">返回</button>` : `<button class="btn pri full" data-act="loungeOrder">送出點單</button>`,
  },

  bookingInfo: {
    title: () => '預約資訊',
    render() {
      const busy = S.load === 'busy';
      return `<div class="bi-top"><small>${D.booking.date}</small><b class="num">${D.booking.time}</b><span>${D.booking.service}</span></div>
        <div class="arrive ${busy ? 'busy' : ''}">${ic('route', 18)}<div><b>建議抵達時間 <span class="num">${busy ? '14:15 – 14:25' : '13:50 – 14:00'}</span></b><small>${busy ? '依現場工位進度動態調整，抵達後優先進廠' : '目前服務廠進度正常'}</small></div></div>
        <dl class="kv"><dt>服務據點</dt><dd>${D.booking.branch}</dd><dt>地址</dt><dd>${D.booking.addr}</dd><dt>車牌</dt><dd>${D.car.plate}</dd><dt>在廠等候</dt><dd>${D.booking.wait}</dd><dt>預估在廠</dt><dd>約 1 小時 30 分（AI 依標準工時與保養紀錄預估）</dd></dl>`;
    },
    foot: () => `<button class="btn ghost" data-act="toastDemo" data-arg="示意：開啟地圖導航">${ic('pin', 16)}導航</button><button class="btn ghost" data-act="toastDemo" data-arg="示意：開啟預約變更表單">更改預約</button>`,
  },

  booking: {
    title: () => '愛車預約保養',
    render() {
      const b = S.bk || (S.bk = { branch: 0, date: '2026-10-19', slot: '10:30', wait: '否', call: '任何時段（08:30–19:30）', notify: 'LINE', other: '' });
      const slots = ['09:00', '10:00', '10:30', '14:00', '15:30', '16:00'];
      const full = ['10:00', '15:30'];
      return `<div class="bk-hero"><div><small class="plate-s">${D.car.plate}</small><b>愛車預約保養</b><span>提供定期保養預約，若為召回、導航升級、檢修等其他需求，請撥服務據點電話預約</span></div><div class="bk-art">${heroBooked()}</div></div>
        <div class="form">
          <label class="f"><span>車牌</span><input value="${D.car.plate}" disabled></label>
          <label class="f"><span>姓名</span><input value="${D.customer.name}"></label>
          <label class="f"><span>手機號碼</span><input value="0912345678"></label>
          <div class="f"><span>服務據點</span>
            ${[['上次回廠服務據點', D.booking.branch], ['上次回廠定保據點', D.booking.branch], ['自行選擇服務據點', '']].map((o, i) => `<button class="radio ${b.branch === i ? 'on' : ''}" data-act="bkBranch" data-arg="${i}"><i></i><span><b>${o[0]}</b>${o[1] ? `<small>${o[1]}</small>` : ''}</span></button>`).join('')}</div>
          <label class="f"><span>保養日期</span><input type="date" id="bkDate" value="${b.date}" min="2026-10-13"></label>
          <div class="f"><span>保養時段</span><div class="slots">${slots.map(s => `<button class="${b.slot === s ? 'on' : ''}" data-act="bkSlot" data-arg="${s}" ${full.includes(s) ? 'disabled' : ''}>${s}</button>`).join('')}</div></div>
          <div class="f"><span>是否在廠等候？</span><div class="seg sm">${['是', '否'].map(w => `<button class="${b.wait === w ? 'on' : ''}" data-act="bkWait" data-arg="${w}">${w}</button>`).join('')}</div></div>
          <label class="f"><span>電話聯絡時段</span><select id="bkCall">${['任何時段（08:30–19:30）', '08:30–12:00', '13:00–17:30', '18:00–19:30', '無需電話聯絡'].map(o => `<option ${b.call === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
          <label class="f"><span>入廠提醒通知方式</span><select id="bkNotify">${['LINE', 'My Toyota App', '簡訊', '電話', '無需提醒'].map(o => `<option ${b.notify === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
          <label class="f"><span>其他意見</span><textarea id="bkOther" placeholder="限 60 字" maxlength="60">${esc(b.other)}</textarea></label>
        </div>`;
    },
    foot: () => `<button class="btn red full" data-act="bkSubmit">確定送出</button>`,
  },
};

function recordLine(v) {
  if (v.id === 'brake') return `來令片 ${v.vars.min} mm → 10.0 mm（新品）`;
  if (v.id === 'rotate') return `前後胎紋差 ${v.vars.diff} mm，已換位並調整胎壓`;
  if (v.id === 'oil') return '原廠機油 0W-20、機油濾芯已更換';
  if (v.id === 'ac') return '已更換原廠空調濾網';
  if (v.id === 'rotor') return '前碟盤已研磨，表面平整';
  return '';
}

/* ---------- 打字機效果（AI 回答） ---------- */
function typewrite(el) {
  const full = el.getAttribute('data-full') || '';
  const msgEl = el.closest('.ai-msg');
  const done = () => { el.innerHTML = nl2br(full); if (msgEl) msgEl.classList.remove('typing'); Object.values(S.threads).forEach(th => th.forEach(m => { m.typing = false; })); };
  if (fastMode()) return done();
  let i = 0; el.textContent = '';
  const step = Math.max(1, Math.round(full.length / 70));
  const tick = () => {
    if (!el.isConnected) { Object.values(S.threads).forEach(th => th.forEach(m => { m.typing = false; })); return; }
    i += step; el.innerHTML = nl2br(full.slice(0, i));
    const l = $('#lbody'); if (l) l.scrollTop = l.scrollHeight;
    if (i < full.length) setTimeout(tick, 16 * spd()); else done();
  };
  tick();
}

/* ---------- 簽名板 ---------- */
function mountSig() {
  const c = $('#sigpad'); if (!c) return;
  const w = c.offsetWidth, h = c.offsetHeight;
  c.width = w * 2; c.height = h * 2;
  const ctx = c.getContext('2d');
  ctx.scale(2, 2); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#15181D';
  if (S.sigData) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, w, h); im.src = S.sigData; }
  let drawing = false, last = null;
  const pt = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * (w / r.width), (e.clientY - r.top) * (h / r.height)]; };
  c.onpointerdown = e => { drawing = true; last = pt(e); c.setPointerCapture(e.pointerId); $('.sig-ph') && $('.sig-ph').classList.add('hide'); };
  c.onpointermove = e => { if (!drawing) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); last = p; };
  c.onpointerup = c.onpointercancel = () => { if (!drawing) return; drawing = false; sigDone(c); };
}
function sigDone(c) {
  S.signed = true; S.sigData = c.toDataURL('image/png');
  renderLiffFoot();
}
async function autoSign() {
  const c = $('#sigpad'); if (!c) return;
  const w = c.offsetWidth, h = c.offsetHeight, ctx = c.getContext('2d');
  $('.sig-ph') && $('.sig-ph').classList.add('hide');
  const strokes = [
    [[.16, .62], [.2, .32], [.24, .66]], [[.12, .45], [.29, .42]], [[.3, .3], [.33, .7]], [[.27, .52], [.38, .5]],
    [[.44, .36], [.47, .7], [.52, .56], [.57, .68], [.6, .34]], [[.66, .5], [.7, .4], [.74, .62], [.79, .44], [.84, .58], [.9, .5]],
  ];
  for (const s of strokes) {
    for (let i = 1; i < s.length; i++) {
      const [x0, y0] = s[i - 1], [x1, y1] = s[i], n = 8;
      for (let k = 1; k <= n; k++) {
        ctx.beginPath();
        ctx.moveTo((x0 + (x1 - x0) * (k - 1) / n) * w, (y0 + (y1 - y0) * (k - 1) / n) * h);
        ctx.lineTo((x0 + (x1 - x0) * k / n) * w, (y0 + (y1 - y0) * k / n) * h);
        ctx.stroke();
        if (!fastMode()) await sleep(9 * spd());
      }
    }
  }
  sigDone(c);
}

/* ---------- 車主動作 ---------- */
function openReport() {
  if (stageIdx() < 2) { ptoast('車輛檢查完成後即可查看'); return; }
  atLeast('14:13');
  if (!S.reportOpenedAt) { S.reportOpenedAt = S.now; act(S.mode === 'advisor' ? '開啟車況報告（專員協助中）' : '開啟車況報告（數位自主）', 'owner'); }
  if (liffIs('report')) return;
  openLiff('report');
  markStep(4);
}

function requestAdvisor(from, extra = {}) {
  const h = { t: S.now, from, status: 'open', q: extra.q || (from === 'report' ? '希望專員當面說明車況' : from === 'chat' ? '希望聯絡服務專員' : '請求專員協助'), key: extra.key, idx: extra.idx };
  S.handoffs.unshift(h);
  S.metrics.handoff++;
  act(`車主請求真人協助：${h.q}`, 'warn');
  if (from === 'report') S.mode = 'advisor';
  const msg = from === 'report'
    ? `已通知 ${D.advisor.name} 專員。請至 1F「專員協助區」，專員約 3 分鐘後為您當面說明；您也可以繼續在手機上查看車況。`
    : `已通知 ${D.advisor.name} 專員，約 3 分鐘內回覆您。您也可以繼續查看車況說明。`;
  oaPush({ kind: 'text', text: msg, preview: '已通知服務專員' }, 400);
}

async function askAI(key, q) {
  if (!q || S.aiBusy) return;
  S.aiDraft = '';
  atLeast('14:15');
  const th = S.threads[key] = S.threads[key] || [];
  th.push({ role: 'me', text: q, t: S.now });
  S.metrics.aiQ++;
  act(`詢問 AI（${key === 'general' ? '整體' : itemView(key).short}）：${q}`, 'ai');
  S.aiBusy = true; renderLiff();
  const r = await AI.ask(key, q, th.slice(0, -1));
  S.aiBusy = false;
  const idx = th.length;
  th.push({ role: 'ai', text: r.text || '', sources: r.sources || ['本次工單'], handoff: r.handoff, followups: r.followups || [], provider: r.provider, typing: true, t: S.now });
  if (r.handoff && (r.intent === 'safety' || r.intent === 'warranty')) {
    S.handoffs.unshift({ t: S.now, from: 'ai', status: 'open', q, key, idx });
    S.metrics.handoff++;
    act(`AI 判定需轉真人：「${q}」`, 'warn');
  }
  if (liffIs('ai')) renderLiff(); else if (S.liff.length) renderLiff();
  markStep(7);
}

async function confirmWork() {
  if (!S.agree || !S.signed || S.confirm) return;
  atLeast('14:20');
  const qt = quote(), p = plan();
  S.confirm = { t: S.now, total: qt.total, count: qt.count, eta: p.eta, items: qt.its.map(v => v.name), sig: S.sigData };
  setStage('confirmed');
  S.overlay = { title: '已確認施作', sub: `確認時間 ${hm(S.now)}:31｜共 ${qt.count} 項 ${money(qt.total)}` };
  renderLiff();
  act(`數位簽名確認施作（${qt.count} 項，${money(qt.total)}，預計 ${hm(p.eta)} 完成）`, 'ok');
  markStep(9);
  renderConsole();
  await wait(1500);
  S.overlay = null; closeLiff();
  await oaPush({ kind: 'flex', flex: 'confirmed', data: { count: qt.count, total: qt.total, eta: p.eta, t: S.now }, preview: '已收到您的施作確認' }, 500);
}

async function decideAddon(d) {
  if (S.addonState !== 'pending') return;
  atLeast('14:48');
  S.addonState = d === 'accept' ? 'accepted' : 'declined';
  act(d === 'accept' ? '追加項目：同意本次碟盤研磨（+$1,000）' : '追加項目：選擇下次保養再複查', d === 'accept' ? 'ok' : 'info');
  S.overlay = { title: d === 'accept' ? '已加入本次施作' : '已記錄您的決定', sub: d === 'accept' ? `預計完成時間更新為 ${hm(plan().eta)}` : `預計完成時間維持 ${hm(plan().eta)}` };
  renderLiff(); renderConsole();
  markStep(12);
  await wait(1300);
  S.overlay = null; closeLiff();
  await oaPush({ kind: 'flex', flex: 'addonAck', data: { accept: d === 'accept', eta: plan().eta }, preview: d === 'accept' ? '已加入本次施作' : '已收到您的決定' }, 500);
}

async function startBookingFlow(fromChat) {
  if (!fromChat) pushMsg({ from: 'me', kind: 'text', text: '預約回廠' });
  await oaPush({ kind: 'flex', flex: 'cars', data: {}, preview: '請選擇您要查詢的車輛' }, 500);
}
