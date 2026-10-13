/* =========================================================
   車況透視鏡 — 展示流程（13 步）、自動播放、外框與事件
   ========================================================= */
const PHASES = [
  { label: '到得準', sub: '到廠前', color: '#0E8C7F' },
  { label: '看得懂', sub: '車況確認', color: '#6A48D7' },
  { label: '選得清', sub: '施作選擇', color: '#C2367A' },
  { label: '等得自由', sub: '維修等待與交車', color: '#D46A0C' },
];

function lastVisible(sel) {
  const list = $$(sel).filter(el => el.offsetParent !== null || el.getClientRects().length);
  return list[list.length - 1] || null;
}
async function tapFx(target, opt = {}) {
  if (fastMode()) return;
  const el = typeof target === 'string' ? lastVisible(target) : target;
  if (!el) return;
  if (opt.scroll !== false) { try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* noop */ } await wait(260); }
  const r = el.getBoundingClientRect();
  if (!r.width) return;
  const d = $('#tapdot');
  d.style.left = (r.left + r.width / 2) + 'px'; d.style.top = (r.top + r.height / 2) + 'px';
  d.classList.remove('go'); void d.offsetWidth; d.classList.add('go');
  await wait(opt.hold || 420);
}
async function smoothScroll(el, to, ms = 900) {
  if (!el) return;
  if (fastMode()) { el.scrollTop = to; return; }
  const from = el.scrollTop, t0 = performance.now(), dur = ms * spd();
  await new Promise(res => {
    const f = now => {
      const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      el.scrollTop = from + (to - from) * e;
      if (k < 1) requestAnimationFrame(f); else res();
    };
    requestAnimationFrame(f);
  });
}
async function scrollLiffTo(sel, offset = 12) {
  const b = $('#lbody'), t = sel ? $(sel, b) : null; if (!b) return;
  const to = t ? t.offsetTop - offset : b.scrollHeight;
  await smoothScroll(b, Math.min(to, b.scrollHeight - b.clientHeight));
}
function csTab(t) { S.consoleTab = t; renderConsole(); }
function refreshLive() {
  renderClock();
  if (liffIs('progress')) renderLiff();
  renderConsole();
  if (S.view === 'dash') renderDash();
}
async function typeInto(input, text) {
  if (!input) return;
  for (let i = 1; i <= text.length; i++) { input.value = text.slice(0, i); S.chatDraft = input.value; await wait(150); }
}
async function waitTypewriter() {
  if (fastMode()) return;
  for (let i = 0; i < 80; i++) { if (!$('.ai-msg.typing')) return; await sleep(100); }
}

const STEPS = [
  {
    ph: 0, t: '13:20', title: '預約提醒・動態到廠', goals: ['服務效率', '個人化體驗'], ai: '依工位排程與前車剩餘標準工時，推算建議抵達時間', who: '系統推播',
    pain: '準時到廠卻還要等車輛進廠；前兩天的電話提醒無法反映當下現場狀況。',
    solve: '依工位進度推算建議抵達時間，用 LINE 主動通知；現場延誤時提前請車主晚點出發。可在工作台切換「前車追加項目」看延誤情境。',
    async run() {
      atLeast('13:20'); csTab('board');
      await tapFx('#console [data-act="csRemind"]');
      await csSendReminder();
    },
  },
  {
    ph: 0, t: '14:03', title: '車牌辨識迎賓', goals: ['服務效率'], ai: '既有車牌辨識比對預約與 LINE 會員，自動指派專員', who: '既有車牌辨識',
    pain: '到廠後排隊報到、重複說明資料，資訊分散在專員口頭與紙本。',
    solve: '沿用既有車牌辨識，比對預約與 LINE 會員後自動報到，並送出「本次服務」專屬入口，後續車況、報價、進度都在同一入口同步。',
    async run() {
      atLeast('14:03'); csTab('gate');
      await tapFx('#console [data-act="csArrive"]');
      await csArrive();
      await wait(700);
      await tapFx('#chatList [data-act="openHub"]');
      openLiff('hub');
      await wait(2200);
      closeLiff();
    },
  },
  {
    ph: 1, t: '14:12', title: 'AI 整理車況・專員審核', goals: ['服務效率', '溝通品質'], ai: 'Gemini 多模態整理量測、照片、語音備註；嚴重度由規則判定', who: '技師＋AI＋專員',
    pain: '技師看到的量測數據與照片，經口述後車主只聽到「建議更換」。',
    solve: '技師的量測、照片與語音備註，由 AI 整理成白話車況報告草稿；嚴重度依原廠標準規則判定，價格工時由系統帶入，專員審核後才推播。',
    async run() {
      atLeast('14:10'); csTab('inspect');
      await wait(500);
      await tapFx('#console [data-act="csOrganize"]');
      await csOrganize();
      await wait(1200);
      atLeast('14:12');
      await tapFx('#console [data-act="csApprove"]');
      await csApprove();
    },
  },
  {
    ph: 1, t: '14:13', title: '車體透視介面', goals: ['溝通品質', '高峰體驗'], ai: '依檢查結果在車體位置分級亮燈', who: '車主', peak: true,
    pain: '看不到自己的車、聽不懂零件名稱，只能被動接受說明。',
    solve: '2D 俯視車體，AI 透視掃描後在問題位置亮燈，依「需優先處理／建議本次處理／可持續觀察／狀況正常」分色。',
    async run() {
      atLeast('14:13');
      if (S.liff.length) closeLiff();
      csTab('owner');
      await tapFx('#chatList [data-act="openReport"]');
      openReport();
      await wait(3200);
    },
  },
  {
    ph: 1, t: '14:13', title: '區域項目列表', goals: ['溝通品質'], ai: '依車體區域分組，量測值對照原廠標準', who: '車主',
    pain: '多個項目混在一張報價單上，看不出哪裡出問題。',
    solve: '點擊亮燈的車體區域，列出該區域的項目、量測值與標準。',
    async run() {
      if (!liffIs('report')) openReport();
      await tapFx('#liff .hs[data-arg="FR"]');
      S.sheet = { zone: 'FR' }; renderLiff();
      act('點擊車體「右前輪」', 'owner');
      await wait(1800);
    },
  },
  {
    ph: 1, t: '14:14', title: '品項說明：正常 vs 目前', goals: ['溝通品質', '個人化體驗', '高峰體驗'], ai: '結合行車數據推估剩餘里程，說明磨耗原因', who: '車主', peak: true,
    pain: '缺乏可自行驗證的證據與標準，容易擔心被過度推銷。',
    solve: '正常與目前狀況對比、量測刻度、現場照片，並用車主自己的行車數據說明「為什麼磨得快、為什麼是現在」。',
    async run() {
      atLeast('14:14');
      if (!S.sheet) { S.sheet = { zone: 'FR' }; renderLiff(); }
      await tapFx('#liff .zrow[data-arg="brake"]');
      ACT.openItem('brake');
      await wait(1300);
      await scrollLiffTo('.gauge', 70); await wait(1400);
      await scrollLiffTo('.box.data', 20); await wait(1700);
      await scrollLiffTo('.pho', 20); await wait(1200);
      await smoothScroll($('#lbody'), 0, 700);
    },
  },
  {
    ph: 1, t: '14:15', title: 'AI 即時問答', goals: ['溝通品質', '服務效率'], ai: '只依工單、原廠標準與行車數據作答；安全保固轉真人', who: '車主＋AI',
    pain: '不好意思一直追問專員；尖峰時段專員也很難逐一解釋。',
    solve: 'AI 依本次工單、原廠標準與行車數據回答，附資料來源與讚／倒讚；涉及安全、保固或無法確認時自動轉真人。',
    async run() {
      atLeast('14:15');
      if (!liffIs('item')) ACT.openItem('brake');
      await tapFx('#liff [data-act="openAI"]');
      openLiff('ai', { id: 'brake' });
      await wait(700);
      await tapFx('#liff .chipbtn');
      await askAI('brake', '這次不更換可以嗎？');
      await waitTypewriter();
      await wait(1200);
      await tapFx('#liff [data-act="aiFb"][data-arg$="|up"]');
      ACT.aiFb(`brake|${(S.threads.brake || []).length - 1}|up`);
      await wait(900);
    },
  },
  {
    ph: 2, t: '14:18', title: '選擇施作項目', goals: ['溝通品質', '個人化體驗'], ai: '金額與完工時間即時重算，自動合併拆輪工時', who: '車主',
    pain: '不知道每一項要多少錢、要多等多久，只能整包接受或拒絕。',
    solve: '車主自主勾選，金額與完工時間即時重算；煞車與調位同時拆輪，系統自動扣減重複工時。',
    async run() {
      atLeast('14:18');
      if (liffIs('ai')) liffBack();
      if (!liffIs('item')) ACT.openItem('brake');
      await wait(400);
      await tapFx('#liff [data-act="addItem"]');
      ACT.addItem('brake');
      await wait(900);
      liffBack();
      await wait(500);
      await tapFx('#liff [data-act="openSelect"]');
      ACT.openSelect();
      await wait(900);
      await tapFx('#liff .sck[data-arg="rotate"]');
      ACT.toggleSel('rotate');
      await wait(1600);
    },
  },
  {
    ph: 2, t: '14:20', title: '報價確認與數位簽名', goals: ['服務效率', '高峰體驗'], ai: '保存簽名、時間戳記與操作紀錄', who: '車主', peak: true,
    pain: '紙本或口頭確認，事後容易對施作內容與費用有爭議。',
    solve: '報價單列出定保與追加項目、總額與完工時間變化，車主勾選同意並簽名，保存時間戳記與操作紀錄。',
    async run() {
      atLeast('14:20');
      if (!liffIs('select')) ACT.openSelect();
      await tapFx('#liff [data-act="openQuote"]');
      openLiff('quote');
      await wait(1000);
      await scrollLiffTo('.agree', 40);
      await wait(400);
      await tapFx('#agreeBox');
      S.agree = true; const box = $('#agreeBox'); if (box) box.checked = true; renderLiffFoot();
      await wait(300);
      await tapFx('#sigpad', { hold: 200 });
      await autoSign();
      await wait(400);
      await tapFx('#liff [data-act="confirmWork"]');
      await confirmWork();
    },
  },
  {
    ph: 3, t: '14:28', title: '維修進度・自由安排', goals: ['個人化體驗', '高峰體驗'], ai: '原廠標準工時＋技師施工節點推算完工時間', who: '技師＋車主',
    pain: '怕錯過中間報告或交車通知，只好守在客休室。',
    solve: '開工即推播，進度與預計完成時間即時更新；開啟完工前 15 分鐘提醒，車主可以安心暫時離開。',
    async run() {
      atLeast('14:28'); csTab('work');
      await tapFx('#console [data-act="csStart"]');
      await csStart();
      await wait(600);
      await tapFx('#chatList [data-act="openProgress"]');
      ACT.openProgress();
      await wait(1600);
      await scrollLiffTo('#free', 10);
      await wait(900);
      await tapFx('#liff [data-act="toggleAway"]');
      ACT.toggleAway();
      await wait(1300);
    },
  },
  {
    ph: 3, t: '14:40', title: '聊天室進度快捷入口', goals: ['服務效率'], ai: '聊天室關鍵字即時回覆進度與完工時間', who: '車主',
    pain: '想知道進度只能打電話或找專員。',
    solve: '在 LINE 聊天室輸入「進度」或點圖文選單，即時回覆預計完成時間，並可一鍵前往進度頁或聯絡專員。',
    async run() {
      atLeast('14:40');
      closeLiff();
      S.footer = 'kbd'; renderFoot();
      await wait(300);
      await typeInto($('#chatInput'), '進度');
      await tapFx('#chatFoot .cinput button');
      const v = $('#chatInput'); if (v) v.value = '';
      await sendChat('進度');
      await wait(1200);
    },
  },
  {
    ph: 3, t: '14:46', title: '追加項目・遠端決策', goals: ['服務效率', '溝通品質', '高峰體驗'], ai: 'AI 生成白話說明，專員審核後推播，完工時間即時更新', who: '技師＋AI＋車主', peak: true,
    pain: '中間報告必須找到車主當面說明；車主離開服務廠就無法決定。',
    solve: '技師回報新發現，AI 生成白話說明、專員審核後推播；車主在外也能看照片與影響，自行決定，完工時間即時更新。',
    async run() {
      atLeast('14:46'); csTab('work');
      await tapFx('#console [data-act="csFinding"]');
      await csFinding();
      await wait(700);
      await tapFx('#console [data-act="csAddonApprove"]');
      await csAddonApprove();
      atLeast('14:47');
      await wait(700);
      await tapFx('#chatList [data-act="openAddon"]');
      ACT.openAddon();
      await wait(1200);
      await scrollLiffTo('.choice', 30);
      await wait(1500);
      atLeast('14:48');
      await tapFx('#liff [data-act="addonDecide"][data-arg="decline"]');
      await decideAddon('decline');
    },
  },
  {
    ph: 3, t: '15:32', title: '完工通知・交車與評價', goals: ['高峰體驗', '新服務機會'], ai: '健康度、下次保養與複查提醒、用車關懷，評價回饋到儀表板', who: '系統＋車主', peak: true,
    pain: '交車時才知道做了什麼、花多少；體驗結尾沒有記憶點。',
    solve: '完工前提醒、提前完工主動通知；完整維修紀錄、車況健康度、下次保養與複查提醒，線上支付（選填）與評價回饋。',
    async run() {
      atLeast('15:20'); refreshLive();
      await csSoon();
      await wait(1500);
      atLeast('15:32'); csTab('deliver');
      await tapFx('#console [data-act="csDone"]');
      await csDone();
      await wait(700);
      await tapFx('#chatList [data-act="openRecord"]');
      openLiff('record');
      await wait(1600);
      await scrollLiffTo('.done-list', 20); await wait(1500);
      closeLiff();
      await oaPush({ kind: 'flex', flex: 'survey', data: {}, preview: '這次的回廠體驗如何？' }, 900);
      await wait(600);
      await tapFx('#chatList .fx-stars button:last-child');
      S.surveyDraft = { all: 5, clear: 0, free: 0, tags: [] };
      openLiff('survey', { stars: 5 });
      await wait(700);
      await tapFx('#liff [data-act="surveyStar"][data-arg="clear|5"]'); S.surveyDraft.clear = 5; renderLiff();
      await tapFx('#liff [data-act="surveyStar"][data-arg="free|5"]'); S.surveyDraft.free = 5; renderLiff();
      await tapFx('#liff [data-act="surveyTag"][data-arg="車況說明很清楚"]'); S.surveyDraft.tags.push('車況說明很清楚'); renderLiff();
      await tapFx('#liff [data-act="surveySubmit"]');
      ACT.surveySubmit();
      await wait(1400);
      closeLiff();
      await wait(500);
      await tapFx('#console [data-act="csCare"]');
      await csCare();
      await wait(1200);
    },
  },
];
STEPS.forEach((s, i) => { s.n = i + 1; });

function markStep(n) {
  if (n > S.step) { S.step = n; if (!S.busy) S.focus = Math.min(13, S.step + 1); renderRail(); }
}

/* ---------------- 側邊展示流程 ---------------- */
function renderRail() {
  const el = $('#rail'); if (!el) return;
  const cur = Math.min(13, S.step + 1);
  const focus = STEPS[(S.focus || cur) - 1];
  let html = `<div class="rail-h"><div><b>展示流程</b><small>${S.step} / 13 完成</small></div>
      <div class="rail-prog"><i style="width:${S.step / 13 * 100}%"></i></div></div>
    <div class="mviews">${[['present', '車主手機'], ['console', '服務廠端'], ['dash', '成效儀表板'], ['pain', '痛點分析'], ['arch', '架構與落地']].map(([v, l]) => `<button class="${S.view === v || (v === 'present' && S.view === 'owner') ? 'on' : ''}" data-act="setView" data-arg="${v}">${l}</button>`).join('')}</div>
    <div class="road" id="road">`;
  PHASES.forEach((p, pi) => {
    html += `<div class="phase" style="--pc:${p.color}"><span class="sign">${p.label}</span><small>${p.sub}</small></div>`;
    STEPS.filter(s => s.ph === pi).forEach(s => {
      const running = S.busy && s.n === S.focus;
      const st = running ? 'cur run' : s.n <= S.step ? 'done' : s.n === cur ? 'cur' : '';
      html += `<button class="stop ${st} ${focus && focus.n === s.n ? 'focus' : ''}" style="--pc:${p.color}" data-act="focusStep" data-arg="${s.n}">
        <i>${s.n <= S.step && !running ? ic('check', 12) : s.n}</i><span><b>${s.title}</b><small><span class="num">${s.t}</span>｜${s.who}</small></span>${s.peak ? '<em>高峰</em>' : ''}</button>`;
    });
  });
  html += `</div>`;
  if (focus) {
    const pc = PHASES[focus.ph].color;
    html += `<div class="sc" style="--pc:${pc}"><div class="sc-h"><span class="num">${focus.n}</span><b>${focus.title}</b>${focus.peak ? '<em>高峰體驗</em>' : ''}</div>
      <div class="sc-r"><small>痛點</small><p>${focus.pain}</p></div><div class="sc-r"><small>解法</small><p>${focus.solve}</p></div>
      <button class="btn pri full" data-act="goStep" data-arg="${focus.n}" ${S.busy ? 'disabled' : ''}>${S.busy ? '展示中…' : ic('play', 13) + (focus.n <= S.step ? '重播此步' : focus.n === cur ? '執行此步' : '跳到此步')}</button></div>`;
  }
  html += `<div class="rail-f">
      <button class="btn ghost sq" data-act="reset" aria-label="重新開始" title="重新開始（R）">${ic('reset', 17)}</button>
      <button class="btn ghost sq" data-act="prevStep" aria-label="上一步" title="上一步（←）" ${S.step < 1 || S.busy ? 'disabled' : ''}>${ic('prev', 17)}</button>
      <button class="btn pri" data-act="nextStep" title="下一步（→）" ${S.step >= 13 || S.busy ? 'disabled' : ''}>下一步${ic('next', 15)}</button>
      <button class="btn ${S.playing ? 'ok' : 'dark'}" data-act="autoplay" title="自動播放（空白鍵）">${ic(S.playing ? 'pause' : 'play', 14)}${S.playing ? '暫停' : '自動播放'}</button>
    </div>`;
  el.innerHTML = html;
  renderStoryPanel();
  const fb = $('.stop.focus', el); if (fb) { const road = $('#road'); if (road && (fb.offsetTop < road.scrollTop || fb.offsetTop > road.scrollTop + road.clientHeight - 60)) road.scrollTop = fb.offsetTop - 60; }
  const mb = $('#mStep'); if (mb) mb.textContent = `${S.step}/13`;
}

async function goStep(n) {
  n = clamp(+n, 1, 13);
  if (S.busy) return;
  S.busy = true; S.focus = n; renderRail();
  try {
    if (n <= S.step) await resetAll(true);
    if (S.step < n - 1) {
      S.fast = true;
      for (let k = S.step + 1; k <= n - 1; k++) { await STEPS[k - 1].run(); markStep(k); }
      S.fast = false;
      renderAll();
    }
    await STEPS[n - 1].run();
    markStep(n);
  } catch (e) {
    console.error(e); toast('這一步執行時發生錯誤：' + (e.message || e));
  } finally {
    S.fast = false; S.busy = false; S.focus = Math.min(13, S.step + 1); renderRail();
  }
}

async function autoplay() {
  if (S.playing) { S.playing = false; renderRail(); return; }
  if (S.step >= 13) await resetAll(true);
  S.playing = true; renderRail();
  while (S.playing && S.step < 13) {
    await goStep(S.step + 1);
    if (!S.playing) break;
    await wait(2400);
  }
  S.playing = false; renderRail();
}

function seedChat() {
  pushMsg({ from: 'oa', kind: 'text', text: `${D.customer.name} 您好！歡迎您成為 TOYOTA 好友！`, t: T('09:12') });
  pushMsg({ from: 'oa', kind: 'sep', text: '10/05（一）' });
  pushMsg({ from: 'me', kind: 'text', text: `${D.car.plate} 預約回廠`, t: T('10:40') });
  pushMsg({ from: 'oa', kind: 'flex', flex: 'booked', data: { dateLong: D.booking.dateLong, time: D.booking.time, branch: D.booking.branch, wait: D.booking.wait }, t: T('10:41') });
  pushMsg({ from: 'oa', kind: 'sep', text: '今天' });
  S.footer = 'menu';
}

async function resetAll(keepView) {
  const keep = { ai: S.ai, view: S.view, speed: S.speed, body: S.body, railCollapsed: S.railCollapsed, playing: S.playing, busy: S.busy, tviews: S.tviews, pain: S.pain, painText: S.painText, painBusy: S.painBusy, painSrc: S.painSrc };
  S = freshState();
  Object.assign(S, keep);
  Object.keys(AIO).forEach(k => delete AIO[k]);
  _liffKey = '';
  seedChat();
  renderAll();
}

function renderAll() {
  renderClock(); renderChat(); renderFoot(); renderLiff(); renderBanner(); renderDialog(); renderConsole(); renderRail();
  if (S.view === 'dash') renderDash();
  if (S.view === 'arch') renderArch();
  if (S.view === 'pain') renderPain();
}

/* ---------------- 車主端檢視：大字版情境說明（投影用） ---------------- */
function renderStoryPanel() {
  const el = $('#storyPanel'); if (!el) return;
  if (S.view !== 'owner') { el.innerHTML = ''; return; }
  const cur = Math.min(13, S.step + 1);
  const st = STEPS[(S.focus || cur) - 1], ph = PHASES[st.ph];
  el.innerHTML = `<div class="sp" style="--pc:${ph.color}">
      <div class="sp-ph"><span class="sign">${ph.label}</span><small>${ph.sub}</small><span class="sp-n num">${st.n} / 13</span></div>
      <h2 class="sp-t">${st.title}</h2>
      <div class="sp-who"><span class="num">${st.t}</span>｜${st.who}${st.peak ? '<em>品牌高峰體驗</em>' : ''}</div>
      <div class="sp-row"><small>痛點</small><p>${st.pain}</p></div>
      <div class="sp-row"><small>解法</small><p>${st.solve}</p></div>
      <div class="sp-ai">${ic('spark', 16)}<span>${st.ai}</span></div>
      <div class="sp-goals">${st.goals.map(g => `<span>${g}</span>`).join('')}</div>
      <div class="sp-f"><button class="btn pri" data-act="goStep" data-arg="${st.n}" ${S.busy ? 'disabled' : ''}>${S.busy ? '展示中…' : ic('play', 13) + (st.n <= S.step ? '重播此步' : st.n === cur ? '執行此步' : '跳到此步')}</button>
        <button class="btn ghost" data-act="nextStep" ${S.step >= 13 || S.busy ? 'disabled' : ''}>下一步${ic('next', 15)}</button></div>
    </div>`;
}

/* ---------------- 外框：檢視切換、縮放、設定 ---------------- */
function setView(v) {
  S.view = v;
  document.body.dataset.view = v;
  $$('.vtab').forEach(b => b.classList.toggle('on', b.dataset.arg === v));
  if (v === 'dash') renderDash();
  if (v === 'arch') renderArch();
  if (v === 'pain') { if (!S.pain && !S.painText) { S.painText = PAIN_SAMPLE.join('\n'); S.painSrc = 'sample'; } if (!S.pain && S.painText && !S.painBusy && !Gemini.enabled()) { S.pain = { rows: splitReviews(S.painText).map(text => ({ text, ...localClassify(text) })), engine: 'local', src: S.painSrc || 'user' }; } renderPain(); }
  renderStoryPanel();
  fitPhone();
  closeMobileSheet();
}

function fitPhone() {
  const wrap = $('#phoneWrap'), col = $('#phoneCol'); if (!wrap || !col) return;
  if (document.body.classList.contains('mobile')) { wrap.style.removeProperty('--ps'); wrap.style.width = ''; wrap.style.height = ''; return; }
  const W = 414, H = 868;
  const s = clamp((col.clientHeight - 20) / H, 0.5, 1.05);
  wrap.style.setProperty('--ps', s.toFixed(4));
  wrap.style.width = (W * s) + 'px'; wrap.style.height = (H * s) + 'px';
}

function checkMobile() {
  const m = window.matchMedia('(max-width: 860px)').matches;
  document.body.classList.toggle('mobile', m);
  fitPhone();
}

function openSettings() {
  const el = $('#modal');
  el.innerHTML = `<div class="mdim" data-act="closeModal"></div><div class="mbox" role="dialog" aria-label="系統設定">
    <div class="mh"><b>${ic('gear', 18)}系統設定</b><button class="lh-btn" data-act="closeModal" aria-label="關閉">${ic('close', 18)}</button></div>
    <div class="mb">
      <h4>AI 引擎</h4>
      <div class="seg"><button class="${S.ai.mode === 'local' ? 'on' : ''}" data-act="aiMode" data-arg="local">離線示範引擎</button><button class="${S.ai.mode === 'gemini' ? 'on' : ''}" data-act="aiMode" data-arg="gemini">Google Gemini</button></div>
      <p class="mut sm">離線示範引擎依本次工單資料作答，展示現場沒有網路也能完整運作。切換 Gemini 後，AI 整理、白話說明與問答會改由 Gemini 即時生成（失敗時自動退回離線引擎）。</p>
      <label class="f"><span>Gemini API Key</span><input id="setKey" type="password" autocomplete="off" placeholder="貼上 Google AI Studio 的 API Key" value="${esc(S.ai.key)}"></label>
      <label class="f"><span>模型</span><input id="setModel" list="models" value="${esc(S.ai.model)}"><datalist id="models"><option value="gemini-3.8-flash"><option value="gemini-3.6-flash"><option value="gemini-3.5-flash-lite"></datalist></label>
      <div class="btnrow"><button class="btn ghost" data-act="testAI">${ic('bolt', 15)}測試連線</button><span class="mut sm" id="testOut"></span></div>
      <p class="mut sm">金鑰只存在這台電腦的瀏覽器，不會寫進檔案；正式系統應由後端代為呼叫，避免金鑰外流。</p>
      <p class="mut sm">claude.ai 上的線上展示版基於安全限制無法連線外部 API，會自動使用離線示範引擎；要即時串接 Gemini，請下載 HTML 檔用 Chrome 直接開啟。</p>
      <h4>示範車型（2D 俯視圖）</h4>
      <div class="seg">${Object.entries(BODY).map(([k, b]) => `<button class="${S.body === k ? 'on' : ''}" data-act="setBody" data-arg="${k}">${b.label}｜${b.model}</button>`).join('')}</div>
      <h4>自動播放速度</h4>
      <div class="seg">${[[0.75, '慢'], [1, '標準'], [1.5, '快']].map(([v, l]) => `<button class="${S.speed === v ? 'on' : ''}" data-act="setSpeed" data-arg="${v}">${l}</button>`).join('')}</div>
    </div>
    <div class="mf"><button class="btn pri" data-act="saveSettings">儲存</button></div></div>`;
  el.classList.add('show');
}
function closeModal() { const el = $('#modal'); el.classList.remove('show'); el.innerHTML = ''; }
function readSettings() {
  const k = $('#setKey'), m = $('#setModel');
  if (k) S.ai.key = k.value.trim();
  if (m) S.ai.model = m.value.trim() || 'gemini-3.8-flash';
}
function persistAI() { try { localStorage.setItem('carlens.ai', JSON.stringify(S.ai)); } catch (e) { /* 無法存取時只保留在記憶體 */ } }

function openMobileSheet() { document.body.classList.add('msheet'); }
function closeMobileSheet() { document.body.classList.remove('msheet'); }

/* ---------------- 動作對照 ---------------- */
const ACT = {
  /* 聊天室與選單 */
  say: t => sendChat(t),
  toggleMenu() { S.footer = S.footer === 'menu' ? 'closed' : 'menu'; renderFoot(); },
  kbd() { S.footer = 'kbd'; renderFoot(); setTimeout(() => { const i = $('#chatInput'); if (i && !document.body.classList.contains('mobile')) i.focus(); }, 60); },
  menuTab(i) { S.menuTab = +i; renderFoot(); },
  menuBooking() { startBookingFlow(false); },
  menuHub() { if (stageIdx() < 1) return ptoast('抵達服務廠完成報到後即可使用'); openLiff('hub'); },
  menuProgress() { pushMsg({ from: 'me', kind: 'text', text: '維修進度' }); pushProgressCard(); },
  menuBot() {
    S.footer = 'kbd'; renderFoot();
    oaPush({ kind: 'text', text: `${D.customer.call}您好！我是 TOYOTA 智能客服，可以幫您查詢本次維修進度、車況說明與費用。`, quick: ['進度', '費用多少？', '找服務專員'], preview: '智能客服為您服務' }, 400);
  },
  menuApp() { ptoast('示意：開啟 My TOYOTA App'); },
  calAdd() { ptoast('已加入行事曆'); },
  toastDemo(t) { ptoast(t); },
  bannerTap() { S.banner = null; renderBanner(); closeLiff(); },
  dlgOk() { const d = S.dialog; S.dialog = null; renderDialog(); d && d.res(true); },
  dlgCancel() { const d = S.dialog; S.dialog = null; renderDialog(); d && d.res(false); },

  /* Flex 按鈕 */
  openBookingInfo() { openLiff('bookingInfo'); },
  openHub() { openLiff('hub'); act('開啟「本次服務」入口', 'owner'); },
  openReport() { openReport(); },
  askAdvisor(from) { requestAdvisor(from || 'report'); },
  openProgress(a) { openLiff('progress', a === 'free' ? { anchor: 'free' } : {}); if (stageIdx() >= 4) act('查看維修進度', 'owner'); },
  openQuoteView() { openLiff('quote', { view: 1 }); },
  openAddon() { if (S.addonState === 'none') return ptoast('目前沒有追加項目'); openLiff('addon'); act('查看追加項目照片與說明', 'owner'); },
  openRecord() { openLiff('record'); act('查看維修紀錄', 'owner'); },
  openPay() { if (S.stage !== 'done') return ptoast('完工後即可線上支付'); openLiff('pay'); },
  openSurvey(n) { if (!S.surveyDraft || +n > 0) S.surveyDraft = { all: +n || 0, clear: 0, free: 0, tags: [] }; openLiff('survey', { stars: +n || 0 }); },
  async pickCar() {
    pushMsg({ from: 'me', kind: 'text', text: `${D.car.plate} 預約回廠` });
    S.bk = null; await wait(300); openLiff('booking');
  },

  /* LIFF */
  liffBack() { liffBack(); },
  liffClose() { closeLiff(); },
  closeSheet() { S.sheet = null; renderLiff(); },
  openZone(z) { S.sheet = { zone: z }; renderLiff(); act(`點擊車體「${ZONES[z].label}」`, 'owner'); markStep(5); },
  openItem(id) { atLeast('14:14'); S.sheet = null; openLiff('item', { id }); act(`查看「${itemView(id).name}」說明`, 'owner'); markStep(6); },
  toggleXray() { S.xray = !S.xray; S.scanned = true; renderLiff(); },
  addItem(id) { if (S.confirm) return; atLeast('14:18'); S.sel[id] = true; act(`加入「${itemView(id).name}」`, 'owner'); ptoast('已加入本次維修'); renderLiff(); renderConsole(); },
  removeItem(id) { if (S.confirm) return; S.sel[id] = false; act(`移除「${itemView(id).name}」`, 'owner'); ptoast('已從本次維修移除'); renderLiff(); renderConsole(); },
  openAI(id) { openLiff('ai', { id }); },
  aiAsk(q) { const t = liffTop(); askAI((t && t.params && t.params.id) || 'general', q); },
  aiFb(arg) {
    const [k, i, v] = String(arg).split('|'); const m = S.threads[k] && S.threads[k][+i]; if (!m) return;
    if (m.fb === v) return;
    if (m.fb === 'up') S.metrics.up--; if (m.fb === 'down') S.metrics.down--;
    m.fb = v; if (v === 'up') S.metrics.up++; else S.metrics.down++;
    act(`AI 回答回饋：${v === 'up' ? '有幫助' : '沒有幫助'}`, 'ai');
    renderLiff();
  },
  handoffAI(arg) {
    const [k, i] = String(arg).split('|'); const th = S.threads[k] || [];
    const q = th[+i - 1] ? th[+i - 1].text : '';
    requestAdvisor('ai', { q: q || '請專員確認', key: k, idx: +i });
    renderLiff();
  },
  async toggleSel(id) {
    if (S.confirm) return;
    if (id === 'oil' && S.sel.oil) {
      const ok = await phoneDialog({ title: '確定本次不更換機油？', body: '<p>機油是您本次預約的定期保養項目，已達原廠建議的更換週期。</p>', ok: '不更換', cancel: '保留' });
      if (!ok) return;
    }
    atLeast('14:18');
    S.sel[id] = !S.sel[id];
    act(`${S.sel[id] ? '勾選' : '取消'}「${itemView(id).name}」｜預估 ${money(quote().total)}`, 'owner');
    renderLiff(); renderConsole(); markStep(8);
  },
  openSelect() { if (stageIdx() < 2) return ptoast('車輛檢查完成後即可選擇'); openLiff('select'); },
  openQuote() { openLiff('quote'); },
  agree(_, el) { S.agree = !!(el && el.checked); renderLiffFoot(); },
  sigClear() { S.signed = false; S.sigData = null; renderLiff(); },
  confirmWork() { confirmWork(); },
  toggleRemind() { S.remind = !S.remind; act(`完工前提醒：${S.remind ? '開啟' : '關閉'}`, 'owner'); renderLiff(); renderConsole(); },
  toggleAway() { S.away = !S.away; act(S.away ? '車主登記暫離服務廠（完工前以 LINE 通知）' : '車主回到客休室', 'owner'); renderLiff(); renderConsole(); },
  openLounge() { S.loungeDraft = null; openLiff('lounge'); },
  loungePick(i) { S.loungeDraft.pick = +i; renderLiff(); },
  loungeMode(m) { S.loungeDraft.mode = m; renderLiff(); },
  loungeOrder() {
    const menu = ['美式咖啡', '拿鐵', '冷泡茶', '水果醋飲', '米果', '公益手工餅乾'];
    S.lounge = { item: menu[S.loungeDraft.pick], mode: S.loungeDraft.mode };
    act(`客休點單：${S.lounge.item}（${S.lounge.mode === 'seat' ? '送到座位' : '外帶'}）`, 'owner');
    renderLiff();
  },
  addonDecide(d) { decideAddon(d); },
  payPoints() { S.payPoints = !S.payPoints; renderLiff(); },
  payConfirm() {
    const qt = quote(), use = !!S.payPoints, pts = Math.min(D.customer.points, qt.total);
    S.pay = { due: qt.total - (use ? pts : 0), use, pts };
    act(`線上支付完成（示意）實付 ${money(S.pay.due)}`, 'ok');
    renderLiff(); renderConsole();
  },
  surveyStar(arg) { const [k, n] = String(arg).split('|'); S.surveyDraft[k] = +n; renderLiff(); },
  surveyTag(t) { const a = S.surveyDraft.tags, i = a.indexOf(t); if (i >= 0) a.splice(i, 1); else a.push(t); renderLiff(); },
  surveySubmit() {
    const d = S.surveyDraft; if (!d || !d.all) return ptoast('請先給「整體滿意度」評分');
    S.survey = { ...d, tags: [...d.tags] };
    act(`車主評價：整體 ${d.all}／說明 ${d.clear || '—'}／等候 ${d.free || '—'}`, 'ok');
    renderLiff(); renderConsole(); if (S.view === 'dash') renderDash();
  },
  bkBranch(i) { S.bk.branch = +i; renderLiff(); },
  bkSlot(t) { S.bk.slot = t; renderLiff(); },
  bkWait(w) { S.bk.wait = w; renderLiff(); },
  async bkSubmit() {
    const b = S.bk, d = $('#bkDate'), c = $('#bkCall'), n = $('#bkNotify'), o = $('#bkOther');
    if (d) b.date = d.value; if (c) b.call = c.value; if (n) b.notify = n.value; if (o) b.other = o.value;
    const dt = new Date(b.date + 'T00:00:00');
    const wk = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()];
    const dateLong = `${dt.getMonth() + 1}月${dt.getDate()}日 星期${wk}`;
    const ok = await phoneDialog({ title: '確認預約', body: `<dl class="kv sm"><dt>保養日期</dt><dd>${b.date.replace(/-/g, '.')}</dd><dt>保養時間</dt><dd>${b.slot}</dd><dt>保養據點</dt><dd>${D.booking.branch}</dd></dl>` });
    if (!ok) return;
    S.overlay = { title: '預約成功', sub: '即將回到 LINE' }; renderLiff();
    await wait(1400);
    S.overlay = null; closeLiff();
    act(`車主透過 LINE 預約 ${b.date} ${b.slot}`, 'owner');
    oaPush({ kind: 'flex', flex: 'booked', data: { dateLong, time: b.slot, branch: D.booking.branch, wait: b.wait, other: b.other }, preview: '預約保養成功通知' }, 600);
  },

  careOk() { pushMsg({ from: 'me', kind: 'text', text: '一切正常' }); act('用車關懷回覆：一切正常', 'owner'); oaPush({ kind: 'text', text: '收到，祝您行車平安！下次保養前我們會再提醒您。', preview: '收到，祝您行車平安' }, 400); },
  careIssue() { pushMsg({ from: 'me', kind: 'text', text: '有異狀，請專員聯繫我' }); requestAdvisor('care', { q: '用車關懷：車主反映有異狀，請回電' }); },
  loungeX(x) { S.loungeX = S.loungeX || []; if (!S.loungeX.includes(x)) { S.loungeX.push(x); act(`客休服務：借用${x}`, 'owner'); ptoast('已通知客休專員'); } renderLiff(); },
  csCare() { csCare(); },
  painSample() { S.painText = PAIN_SAMPLE.join('\n'); S.painSrc = 'sample'; S.pain = null; renderPain(); },
  painClear() { S.painText = ''; S.pain = null; S.painSrc = ''; renderPain(); },
  painRun() { const t = $('#painText'); if (t) S.painText = t.value; runPain(); },
  painCsv() { copyPainCsv(); },

  /* 服務廠工作台 */
  csTab(t) { csTab(t); },
  setLoad(v) { S.load = v; renderConsole(); if (liffIs('bookingInfo')) renderLiff(); },
  csRemind() { if (S.now < T('13:20')) atLeast('13:20'); csSendReminder(); markStep(1); },
  async csArrive() { if (S.now < T('14:03')) atLeast('14:03'); await csArrive(); markStep(2); },
  csOrganize() { if (!S.arrivedAt) return toast('請先完成車牌辨識報到'); if (S.now < T('14:10')) atLeast('14:10'); csOrganize(); },
  csRedo() { S.inspect = { status: 'idle', step: -1, approved: false, provider: '' }; Object.keys(AIO).forEach(k => k !== 'rotor' && delete AIO[k]); renderConsole(); },
  async csApprove() { if (S.now < T('14:12')) atLeast('14:12'); await csApprove(); markStep(3); },
  csReply(arg) { const [i, k] = String(arg).split('|'); csReply(+i, +k); },
  nodeDone() { const n = currentNode(); if (n) { setNow(n.e); act(`技師回報完成：${n.label}`, 'sys'); refreshLive(); } },
  async csStart() { if (S.now < T('14:28')) atLeast('14:28'); await csStart(); markStep(10); },
  csFinding() { csFinding(); },
  csAddonApprove() { csAddonApprove(); },
  async csDone() { await csDone(); markStep(13); },

  /* 外框 */
  setView(v) { setView(v); },
  focusStep(n) { S.focus = +n; renderRail(); if (document.body.classList.contains('mobile')) goStep(+n); },
  goStep(n) { closeMobileSheet(); goStep(+n); },
  nextStep() { closeMobileSheet(); if (S.step < 13) goStep(S.step + 1); },
  prevStep() { if (S.step >= 1) goStep(Math.max(1, S.step - 1)); },
  autoplay() { closeMobileSheet(); autoplay(); },
  async reset() { S.playing = false; if (S.busy) return; await resetAll(true); S.focus = 1; renderRail(); toast('已重新開始示範'); },
  settings() { openSettings(); },
  closeModal() { closeModal(); },
  aiMode(m) { readSettings(); S.ai.mode = m; openSettings(); },
  setBody(b) { readSettings(); S.body = b; D.car.model = BODY[b].model; openSettings(); renderAll(); },
  setSpeed(v) { readSettings(); S.speed = +v; openSettings(); },
  async testAI() {
    readSettings();
    const out = $('#testOut'); if (!S.ai.key) { if (out) out.textContent = '請先貼上 API Key'; return; }
    if (out) out.textContent = '連線中…';
    try { const r = await AI.test(); if (out) out.textContent = '成功：' + r; }
    catch (e) { if (out) out.textContent = '失敗：' + aiErr(e); }
  },
  saveSettings() { readSettings(); persistAI(); closeModal(); toast(`AI 引擎：${AI.label()}`); renderAll(); },
  railToggle() { S.railCollapsed = !S.railCollapsed; document.body.classList.toggle('rail-min', S.railCollapsed); fitPhone(); },
  tview(id) { S.tviews = S.tviews || {}; S.tviews[id] = !S.tviews[id]; renderDash(); },
  mSheet() { if (document.body.classList.contains('msheet')) closeMobileSheet(); else openMobileSheet(); },
};

/* ---------------- 事件 ---------------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  if (el.tagName !== 'INPUT') e.preventDefault();
  if (el.disabled) return;
  fn(el.dataset.arg, el, e);
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  if (f.dataset.form === 'chat') {
    const i = $('#chatInput'); const v = i ? i.value.trim() : ''; if (!v) return;
    i.value = ''; S.chatDraft = ''; sendChat(v);
  } else if (f.dataset.form === 'ai') {
    const i = $('#aiInput'); const v = i ? i.value.trim() : ''; if (!v) return;
    i.value = ''; askAI(f.dataset.key, v);
  }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'chatInput') S.chatDraft = t.value;
  else if (t.id === 'aiInput') S.aiDraft = t.value;
  else if (t.dataset && t.dataset.model === 'note') S.note = t.value;
  else if (t.id === 'painText') { S.painText = t.value; if (S.painSrc === 'sample') S.painSrc = 'edited'; }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && t.dataset.meas) {
    const k = t.dataset.meas;
    S.meas[k] = k === 'ac' ? t.value : (isNaN(parseFloat(t.value)) ? S.meas[k] : parseFloat(t.value));
    const ML = { padFR: ['右前來令片', 'mm'], padFL: ['左前來令片', 'mm'], trFR: ['右前胎紋', 'mm'], trFL: ['左前胎紋', 'mm'], trRR: ['右後胎紋', 'mm'], trRL: ['左後胎紋', 'mm'], oilKm: ['機油里程', 'km'], ac: ['空調濾網', ''], battery: ['電瓶健康度', '%'], fluid: ['煞車油含水率', '%'] }[k] || [k, ''];
    if (S._lastMeas === k + S.meas[k]) return;
    S._lastMeas = k + S.meas[k];
    act(`技師更新量測：${ML[0]} ${S.meas[k]}${ML[1] ? ' ' + ML[1] : ''}`, 'sys');
    renderConsole(); if (S.liff.length) renderLiff();
  } else if (t.id === 'painFile') {
    const f = t.files && t.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { S.painText = String(rd.result || ''); S.painSrc = 'file:' + f.name; S.pain = null; renderPain(); };
    rd.readAsText(f, 'utf-8');
  } else if (t.dataset && t.dataset.photo) {
    const f = t.files && t.files[0]; if (!f) return;
    const id = t.dataset.photo;
    const rd = new FileReader();
    rd.onload = () => {
      const im = new Image();
      im.onload = () => {
        const sc = Math.min(1, 1024 / Math.max(im.width, im.height));
        const c = document.createElement('canvas'); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        S.photos[id] = c.toDataURL('image/jpeg', 0.85);
        act(`技師上傳現場照片：${itemView(id) ? itemView(id).name : id}`, 'sys');
        renderConsole(); if (S.liff.length) renderLiff();
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(f);
  }
});
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
  if ($('#modal.show')) { if (e.key === 'Escape') closeModal(); return; }
  if (e.key === 'ArrowRight') { e.preventDefault(); ACT.nextStep(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); ACT.prevStep(); }
  else if (e.key === ' ') { e.preventDefault(); ACT.autoplay(); }
  else if (e.key === 'r' || e.key === 'R') { ACT.reset(); }
  else if (e.key === 'Escape') { if (S.sheet) ACT.closeSheet(); else if (S.liff.length) liffBack(); }
});
['pointerover', 'focusin'].forEach(ev => document.addEventListener(ev, e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) tipShow(el); }));
['pointerout', 'focusout'].forEach(ev => document.addEventListener(ev, e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (el) tipHide(el); }));
window.addEventListener('resize', () => { checkMobile(); });

/* ---------------- 啟動 ---------------- */
function boot() {
  $('#brand').innerHTML = brandMark(32);
  $('#gearBtn').innerHTML = ic('gear', 20);
  const vi = { present: 'play', owner: 'device', console: 'monitor', dash: 'chart', pain: 'search', arch: 'layers' };
  $$('.vtab').forEach(b => { b.innerHTML = ic(vi[b.dataset.arg], 15) + b.textContent; });
  $('#lineHead').innerHTML = `<button class="lh-btn" aria-label="返回" data-act="toastDemo" data-arg="示意：返回聊天列表">${ic('back', 22)}</button>${oaAvatar()}<b class="lhd-n">TOYOTA 台灣</b><span class="vbadge">${ic('check', 11)}</span><span class="lhd-sp"></span><button class="lh-btn" aria-label="搜尋" data-act="toastDemo" data-arg="示意：搜尋聊天內容">${ic('search', 20)}</button><button class="lh-btn" aria-label="聊天室選單" data-act="toastDemo" data-arg="示意：聊天室設定">${ic('menu', 20)}</button>`;
  $('#sbarIcons').innerHTML = `<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true"><path d="M8 11.5l2.3-2.6a3.2 3.2 0 0 0-4.6 0z"/><path d="M3.3 6.6a6.6 6.6 0 0 1 9.4 0l-1.5 1.7a4.5 4.5 0 0 0-6.4 0z"/><path d="M.9 3.9a10 10 0 0 1 14.2 0l-1.5 1.7a7.8 7.8 0 0 0-11.2 0z"/></svg><svg width="27" height="12" viewBox="0 0 27 12" fill="currentColor" aria-hidden="true"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="17" height="8" rx="1.8"/><rect x="23.6" y="4" width="1.8" height="4" rx=".9" opacity=".5"/></svg>`;
  checkMobile();
  seedChat();
  S.focus = 1;
  setView(document.body.classList.contains('mobile') ? 'owner' : 'present');
  renderAll();
  setTimeout(fitPhone, 60);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPhone);
}
document.addEventListener('DOMContentLoaded', boot);
