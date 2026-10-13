/* =========================================================
   車況透視鏡 — 服務廠工作台（技師平板＋服務專員）
   ========================================================= */
const CS_TABS = [
  { id: 'board', label: '今日看板', icon: 'board' },
  { id: 'gate', label: '車牌報到', icon: 'scan' },
  { id: 'inspect', label: '車況檢查', icon: 'clip' },
  { id: 'owner', label: '車主互動', icon: 'users' },
  { id: 'work', label: '施工進度', icon: 'wrench' },
  { id: 'deliver', label: '交車結帳', icon: 'key' },
];

function renderConsole() {
  const root = $('#console'); if (!root) return;
  const main = $('#csMain', root);
  const keep = main ? main.scrollTop : 0;
  const openH = S.handoffs.filter(h => h.status === 'open').length;
  root.innerHTML = `<header class="cs-h">
      <div class="cs-brand">${ic('monitor', 18)}<b>服務廠工作台</b><span>${D.booking.branch}</span></div>
      <div class="cs-meta"><span>${D.advisor.title} ${D.advisor.name}</span><span class="cs-time">${ic('clock', 14)}<b class="js-clock num">${hm(S.now)}</b></span></div>
    </header>
    <div class="cs-body">
      <nav class="cs-nav">${CS_TABS.map(t => `<button class="${S.consoleTab === t.id ? 'on' : ''}" data-act="csTab" data-arg="${t.id}">${ic(t.icon, 19)}<span>${t.label}</span>${t.id === 'owner' && openH ? `<em>${openH}</em>` : ''}${t.id === 'inspect' && S.inspect.status === 'done' && !S.inspect.approved ? '<em>1</em>' : ''}</button>`).join('')}</nav>
      <main class="cs-main" id="csMain">${(CS[S.consoleTab] || CS.board)()}</main>
    </div>`;
  const nm = $('#csMain', root); if (nm) nm.scrollTop = keep;
}

function csHead(t, sub) { return `<div class="pn-h"><h3>${t}</h3>${sub ? `<span>${sub}</span>` : ''}</div>`; }
function stChip(text, tone) { return `<span class="st ${tone || ''}">${esc(text)}</span>`; }

function boardStatus() {
  const m = { booked: '預約', reminded: '已提醒', arrived: '已報到', inspected: '待車主確認', confirmed: '待開工', repairing: '維修中', done: '完工' };
  return m[S.stage] || '預約';
}

const CS = {
  board() {
    const busy = S.load === 'busy';
    const sent = S.stage !== 'booked';
    return `${csHead('今日入廠看板', D.today)}
      <div class="kline"><div><small>今日預約</small><b class="num">38 台</b></div><div><small>在廠車輛</small><b class="num">9 台</b></div><div><small>工位使用率</small><b class="num">${busy ? '94%' : '78%'}</b></div><div><small>平均在廠</small><b class="num">72 分</b></div></div>
      <div class="cgrid">
        <section class="card">
          <h4>${ic('route', 16)}動態到廠提醒</h4>
          <div class="seg"><button class="${!busy ? 'on' : ''}" data-act="setLoad" data-arg="normal">現場進度正常</button><button class="${busy ? 'on' : ''}" data-act="setLoad" data-arg="busy">前車追加項目 +20 分</button></div>
          <div class="calc">
            <div><span>車輛</span><b>${D.car.plate}｜林車主｜14:00 定保</b></div>
            <div><span>工位 ${D.tech.bay} 預估釋出</span><b class="num">${busy ? '14:18' : '13:55'}</b></div>
            <div><span>建議抵達時間</span><b class="num hl">${busy ? '14:15 – 14:25' : '13:50 – 14:00'}</b></div>
          </div>
          <p class="mut">依工位排程、前車剩餘標準工時與追加項目推算；延誤時提前請車主晚點出發，把「到廠後的等待」移到出發前。</p>
          <button class="btn pri" data-act="csRemind">${ic('send', 15)}${sent ? '重新發送' : '發送'} LINE 到廠提醒</button>
          <p class="was">原流程：預約前兩天電話提醒＋當天 30 分鐘前提醒</p>
        </section>
        <section class="card">
          <h4>${ic('board', 16)}今日預約入廠</h4>
          <table class="tbl"><thead><tr><th>預定入廠</th><th>車牌</th><th>車主</th><th>維修型態</th><th>專員</th><th>狀態</th></tr></thead>
          <tbody>${BOARD.map(r => `<tr class="${r.me ? 'me' : ''}"><td class="num">${r.t}</td><td class="num">${r.me ? r.plate : r.plate.slice(0, 3) + '-' + '**' + r.plate.slice(-2)}</td><td>${r.who}</td><td>${r.type}</td><td>${r.adv}</td><td>${stChip(r.me ? boardStatus() : r.st, r.me ? 'me' : '')}</td></tr>`).join('')}</tbody></table>
        </section>
      </div>`;
  },

  gate() {
    const g = S.gate;
    const steps = [
      ['辨識車牌', `${D.car.plate}｜信心度 98.7%`],
      ['比對今日預約', `${D.booking.time} ${D.booking.service}`],
      ['比對會員資料', `${D.customer.name}｜LINE 已綁定`],
      ['系統指派服務專員', `${D.advisor.name}（車主未指定專員）`],
      ['推播迎賓訊息與本次服務入口', 'LINE 官方帳號'],
    ];
    const lv = { idle: -1, scanning: 0, matched: 3, pushed: 5 }[g] ?? -1;
    return `${csHead('車牌辨識報到', '沿用既有入口車牌辨識，結合預約與 LINE 會員資料')}
      <div class="cgrid">
        <section class="card cam">
          <div class="camv ${g}">${gateScene(g)}<span class="cam-tag">● CAM-01 入口</span>${g !== 'idle' ? `<span class="cam-res">${D.car.plate}<small>98.7%</small></span>` : ''}</div>
          <button class="btn pri" data-act="csArrive" ${g !== 'idle' ? 'disabled' : ''}>${ic('car', 16)}模擬車輛抵達</button>
        </section>
        <section class="card">
          <h4>${ic('bolt', 16)}自動報到</h4>
          <ol class="chain">${steps.map((s, i) => `<li class="${i < lv ? 'done' : i === lv ? 'cur' : ''}"><i>${i < lv ? ic('check', 12) : i + 1}</i><div><b>${s[0]}</b><small>${s[1]}</small></div></li>`).join('')}</ol>
          <h4>${ic('clip', 16)}接待準備</h4>
          <ul class="checks">${['鋪設三寶（椅套、腳踏墊、方向盤套）', `平板記錄里程 ${fmtN(D.car.mileage)} km 與車內設定`, '確認本次施作項目：40,000 公里定期保養'].map(t => `<li class="${g === 'pushed' ? 'on' : ''}">${ic('check', 14)}${t}</li>`).join('')}</ul>
        </section>
      </div>`;
  },

  inspect() {
    const m = S.meas, R = rules(m), I = S.inspect;
    const row = (label, key, unit, std, sev, step = 0.1) => `<tr><td>${label}</td><td><input class="num" type="number" step="${step}" data-meas="${key}" value="${m[key]}" aria-label="${label}"> <span class="u">${unit}</span></td><td class="mut">${std}</td><td>${sevChip(sev)}</td></tr>`;
    const photos = [['brake', '右前來令片', 'pad'], ['rotate', '前後胎紋', 'tread'], ['oil', '機油尺', 'oil'], ['ac', '空調濾網', 'filter']];
    const its = findings();
    const basis = v => ({
      brake: `${v.vars.min} mm；依磨耗速度約 ${v.vars.km} km 內低於 3.0 mm`,
      rotate: `前後胎紋差 ${v.vars.diff} mm（≥ ${f1(STD.rotateDiff)} mm）`,
      oil: `距上次更換 ${fmtN(m.oilKm)} km（週期 10,000 km）`,
      ac: `目視判定：${m.ac}`,
    }[v.id]);
    let right = '';
    if (I.status === 'idle') {
      right = `<p>把量測、照片與技師口述，整理成車主看得懂的報告草稿。</p>
        <ul class="rules"><li>${ic('shield', 14)}嚴重度依原廠標準規則判定，AI 不自行決定</li><li>${ic('doc', 14)}價格與工時由零件價格庫、原廠標準工時帶入</li><li>${ic('users', 14)}AI 只產生草稿，專員審核後才會推播</li></ul>
        <button class="btn pri big" data-act="csOrganize">${ic('spark', 17)}AI 整理成車主報告</button>
        <p class="mut sm">目前引擎：${esc(AI.label())}</p>`;
    } else if (I.status === 'running') {
      right = `<ol class="pipe">${ORGANIZE_STEPS.map((s, i) => `<li class="${i < I.step ? 'done' : i === I.step ? 'cur' : ''}"><i>${i < I.step ? ic('check', 12) : ''}</i>${s}</li>`).join('')}</ol>`;
    } else {
      right = `<div class="draft-h">${I.approved ? stChip(`已審核並於 ${hm(S.inspectedAt)} 推播給車主`, 'ok') : stChip('AI 草稿｜待專員審核', 'warn')}<span class="mut sm">${I.provider === 'gemini' ? 'Gemini 生成' : '離線示範引擎'}｜${its.length} 個建議項目、${sevCounts().ok} 項正常</span></div>
        ${its.map(v => `<div class="draft"><div class="d1"><b>${esc(v.name)}</b>${sevChip(v.sev)}<span class="num">${money(v.price)}｜${v.base ? '定保內' : '+' + v.labor + ' 分'}</span></div>
          <div class="d2"><span class="lbl">判定依據</span>${esc(basis(v))}</div>
          <div class="d2"><span class="lbl ai">${ic('spark', 12)}白話說明</span>${esc(v.plain)}</div></div>`).join('')}
        ${I.approved ? '' : `<div class="btnrow"><button class="btn ghost" data-act="csRedo">重新整理</button><button class="btn pri" data-act="csApprove">${ic('check', 16)}審核通過並推播車主</button></div>`}`;
    }
    return `${csHead('車況檢查｜AI 整理', `技師 ${D.tech.name}｜工位 ${D.tech.bay}｜工單 ${D.ro}`)}
      <div class="cgrid wide">
        <section class="card aip">
          <h4>${ic('spark', 16)}AI 車況整理</h4>
          ${right}
        </section>
        <section class="card">
          <h4>${ic('clip', 16)}技師量測紀錄</h4>
          <table class="tbl meas"><thead><tr><th>項目</th><th>量測</th><th>原廠標準</th><th>規則判定</th></tr></thead><tbody>
            ${row('前煞車來令片（右）', 'padFR', 'mm', '≤ 3.0 更換', R.brakeSev)}
            ${row('前煞車來令片（左）', 'padFL', 'mm', '≤ 3.0 更換', R.brakeSev)}
            ${row('胎紋深度（右前）', 'trFR', 'mm', '前後差 ≤ 1.5', R.rotSev)}
            ${row('胎紋深度（左前）', 'trFL', 'mm', '前後差 ≤ 1.5', R.rotSev)}
            ${row('胎紋深度（右後）', 'trRR', 'mm', '≥ 3.0', 'ok')}
            ${row('胎紋深度（左後）', 'trRL', 'mm', '≥ 3.0', 'ok')}
            ${row('機油（距上次更換）', 'oilKm', 'km', '10,000 km', R.oilSev, 1)}
            <tr><td>空調濾網</td><td><select data-meas="ac" aria-label="空調濾網狀態">${['良好', '輕微髒污', '髒污'].map(o => `<option ${m.ac === o ? 'selected' : ''}>${o}</option>`).join('')}</select></td><td class="mut">目視</td><td>${sevChip(R.acSev)}</td></tr>
            ${row('電瓶健康度', 'battery', '%', '≥ 75%', m.battery >= 75 ? 'ok' : 'p3', 1)}
            ${row('煞車油含水率', 'fluid', '%', '< 3%', m.fluid < 3 ? 'ok' : 'p2', 0.5)}
          </tbody></table>
          <h4>${ic('camera', 16)}現場照片</h4>
          <div class="photos">${photos.map(([id, label, kind]) => `<label class="ph">${S.photos[id] ? `<img src="${S.photos[id]}" alt="${label}">` : thumbArt(kind)}<span>${label}</span><em>${ic('upload', 12)}換成實拍</em><input type="file" accept="image/*" data-photo="${id}"></label>`).join('')}
            <div class="ph more"><b class="num">+2</b><span>電瓶、後來令片</span></div></div>
          <h4>${ic('mic', 16)}技師口述（語音轉文字）</h4>
          <textarea class="note" data-model="note" rows="3">${esc(S.note)}</textarea>
        </section>
      </div>`;
  },

  owner() {
    const open = S.handoffs;
    const qt = quote();
    const ths = Object.entries(S.threads).flatMap(([k, th]) => th.map((m, i) => ({ k, m, i, q: th[i - 1] }))).filter(x => x.m.role === 'ai');
    const loc = S.away ? '已暫離服務廠（LINE 聯繫）' : S.stage === 'booked' || S.stage === 'reminded' ? '尚未到廠' : S.mode === 'advisor' && !S.confirm ? '1F 專員協助區' : `${D.lounge.floor} ${D.lounge.seat}`;
    return `${csHead('車主互動即時看板', `${D.customer.name}｜${D.car.plate}`)}
      <div class="ostat"><div><small>確認方式（雙軌）</small><b>${S.mode === 'advisor' ? '專員協助（1F 專員協助區）' : '數位自主（手機）'}</b></div><div><small>目前位置</small><b>${loc}</b></div><div><small>服務階段</small><b>${boardStatus()}</b></div><div><small>專員說明時間</small><b class="num">${S.mode === 'advisor' ? '約 12 分' : '0 分'}</b><em>傳統約 18 分</em></div></div>
      <div class="cgrid">
        <section class="card">
          <h4>${ic('device', 16)}車主即時動態</h4>
          ${S.activity.length ? `<ol class="feed">${S.activity.map(a => `<li class="${a.type}"><span class="num">${hm(a.t)}</span><span>${esc(a.text)}</span></li>`).join('')}</ol>` : '<p class="mut">車主的查看、提問與決策會即時顯示在這裡。</p>'}
        </section>
        <section class="card">
          <h4>${ic('users', 16)}請求協助${open.filter(h => h.status === 'open').length ? `<em class="cnt">${open.filter(h => h.status === 'open').length}</em>` : ''}</h4>
          ${open.length ? open.map((h, i) => `<div class="hreq ${h.status}"><div><span class="num">${hm(h.t)}</span><b>${esc(h.q)}</b><small>${h.from === 'ai' ? 'AI 判定涉及安全／保固，自動轉真人' : '車主主動請求'}</small></div>
              ${h.status === 'open' ? `<div class="replies">${replyOptions(h).map((t, k) => `<button class="btn sm ${k ? 'ghost' : 'pri'}" data-act="csReply" data-arg="${i}|${k}">${t}</button>`).join('')}</div>` : `<small class="ok">已回覆：${esc(h.reply || '')}</small>`}</div>`).join('') : '<p class="mut">目前沒有待處理的請求。AI 遇到安全、保固或無法確認的問題時，會自動轉到這裡。</p>'}
          <h4>${ic('doc', 16)}施作決策</h4>
          ${S.confirm ? `<div class="sigrec">${S.confirm.sig ? `<img src="${S.confirm.sig}" alt="車主簽名">` : ''}<div><b>${S.confirm.count} 項｜${money(S.confirm.total)}</b><small>${S.confirm.items.join('、')}</small><small class="num">簽名時間戳記 2026-10-12 ${hm(S.confirm.t)}:31｜預計 ${hm(S.confirm.eta)} 完成</small></div></div>`
          : `<p class="mut">${S.stage === 'inspected' ? `車主勾選中：${qt.count} 項｜${money(qt.total)}` : '車主確認後會顯示簽名與時間戳記。'}</p>`}
          <h4>${ic('spark', 16)}AI 問答紀錄</h4>
          ${ths.length ? `<ul class="qa">${ths.map(x => `<li><b>${esc(x.q ? x.q.text : '')}</b><small>${esc(x.m.text.slice(0, 54))}…</small><span>${x.m.fb === 'up' ? ic('up', 14) : x.m.fb === 'down' ? ic('down', 14) : ''}${x.m.handoff ? stChip('轉真人', 'warn') : ''}</span></li>`).join('')}</ul>` : '<p class="mut">尚無提問。</p>'}
        </section>
      </div>`;
  },

  work() {
    const p = plan(), started = S.work.start != null, done = S.stage === 'done';
    const A = S.addonDraft;
    const cur = currentNode();
    const nodes = p.nodes.map(n => {
      const st = done || S.now >= n.e ? 'done' : S.now >= n.s && started ? 'cur' : '';
      return `<li class="${st}"><i>${st === 'done' ? ic('check', 12) : ''}</i><div><b>${esc(n.label)}</b><small class="num">${hm(n.s)} – ${hm(n.e)}｜標準工時 ${n.min} 分</small></div>${st === 'cur' ? `<button class="btn sm pri" data-act="nodeDone">完成</button>` : ''}</li>`;
    }).join('');
    const parts = p.nodes.filter(n => n.id !== 'final').map(n => `${n.label.replace(/（.*）|・.*$/g, '').replace('前煞車', '')} ${n.min}`).join('、');
    let addon = '';
    if (A.status === 'idle') {
      addon = `<button class="btn ghost" data-act="csFinding" ${started && !done && S.sel.brake && S.addonState === 'none' ? '' : 'disabled'}>${ic('alert', 15)}回報新發現（中間報告）</button>`;
    } else {
      const v = itemView('rotor');
      addon = `<div class="addon-d"><div class="ad-h"><span class="zth sm">${thumbArt('rotor')}</span><div><b>${v.name}</b><small>碟盤厚度 25.4 mm（最低 24.0 mm）｜溝痕約 0.3 mm｜照片 1 張</small></div></div>
        ${A.status === 'running' ? `<ol class="pipe">${ADDON_STEPS.map((s, i) => `<li class="${i < A.step ? 'done' : i === A.step ? 'cur' : ''}"><i>${i < A.step ? ic('check', 12) : ''}</i>${s}</li>`).join('')}</ol>`
          : `<div class="d2"><span class="lbl ai">${ic('spark', 12)}白話說明</span>${esc(v.plain)}</div>
             <div class="d2"><span class="lbl">影響</span>費用 +${money(v.price)}｜工時 +${v.labor} 分；若同意，完工 ${hm(S.addonState === 'accepted' ? p.eta : p.eta + 20)}</div>
             ${A.approved ? `<div class="d2">${S.addonState === 'pending' ? stChip('已推播，等待車主決定', 'warn') : stChip(S.addonState === 'accepted' ? '車主同意本次處理' : '車主選擇下次複查', 'ok')}</div>`
            : `<div class="btnrow"><button class="btn pri" data-act="csAddonApprove">${ic('check', 15)}審核並推播車主</button></div>`}`}
        </div>`;
    }
    return `${csHead('施工進度｜技師平板', `${D.car.plate}｜工位 ${D.tech.bay}｜${D.tech.name}`)}
      <div class="cgrid">
        <section class="card">
          <h4>${ic('wrench', 16)}施工節點</h4>
          ${started ? `<ol class="nodes">${nodes}</ol>` : `<p class="mut">車主確認施作後，工單自動排入工位 ${D.tech.bay}。</p><button class="btn pri" data-act="csStart" ${S.confirm && !started ? '' : 'disabled'}>${ic('play', 14)}開始施工</button>`}
          ${addon}
        </section>
        <section class="card">
          <h4>${ic('clock', 16)}完工時間預估</h4>
          <div class="eta"><b class="num">${hm(done ? S.work.doneAt : p.eta)}</b><span>${done ? '已完工' : started ? `剩 ${Math.max(0, p.eta - S.now)} 分｜${cur ? esc(cur.label) : ''}` : '預估'}</span></div>
          <p class="formula">開工 <b class="num">${hm(p.start)}</b> ＋ 標準工時（${parts}）＋ 最終檢測 15 分 ＝ <b class="num">${hm(p.eta)}</b></p>
          <p class="mut">PoC 以原廠標準工時＋技師回報的施工節點計算；累積工單資料後，再導入預測模型並納入工位排隊。</p>
          <h4>${ic('bell', 16)}車主通知</h4>
          <ul class="checks">
            <li class="on">${ic('check', 14)}位置：${S.away ? '已暫離服務廠' : '客休室'}</li>
            <li class="${S.remind ? 'on' : ''}">${ic('check', 14)}完工前 15 分鐘提醒：${S.remind ? '開啟' : '關閉'}</li>
            <li class="on">${ic('check', 14)}只推播關鍵節點：開工、追加項目、完工前、完工</li>
          </ul>
        </section>
      </div>`;
  },

  deliver() {
    const done = S.stage === 'done', qt = quote();
    const checks = ['實車說明確認檢修項目', '展示替換舊品（舊來令片）', '恢復車主設定並移除保護措施', '下次保養時間說明（2027/04 或 50,000 km）'];
    const declined = findings().filter(v => !S.sel[v.id]).map(v => v.name);
    return `${csHead('交車與結帳', `${D.car.plate}｜${D.customer.name}`)}
      <div class="cgrid">
        <section class="card">
          <h4>${ic('key', 16)}完工交車</h4>
          <ul class="checks">${checks.map(c => `<li class="${done ? 'on' : ''}">${ic('check', 14)}${c}</li>`).join('')}</ul>
          <button class="btn pri" data-act="csDone" ${S.stage === 'repairing' ? '' : 'disabled'}>${ic('send', 15)}完工並通知車主</button>
          <p class="mut">完工通知含實際施作項目、最終費用與維修紀錄；舊品與實車說明仍於交車時當面進行。</p>
        </section>
        <section class="card">
          <h4>${ic('card', 16)}結帳</h4>
          <div class="calc"><div><span>總金額</span><b class="num">${money(qt.total)}</b></div><div><span>付款狀態</span><b>${S.pay ? `線上支付完成（示意）${S.pay.use ? `｜Points 折抵 ${fmtN(S.pay.pts)}` : ''}` : done ? '待付款（可線上或桌邊結帳）' : '—'}</b></div></div>
          <h4>${ic('star', 16)}車主評價</h4>
          ${S.survey ? `<div class="calc"><div><span>整體滿意度</span><b class="num">${S.survey.all} / 5</b></div><div><span>說明清楚度</span><b class="num">${S.survey.clear} / 5</b></div><div><span>等候自由度</span><b class="num">${S.survey.free} / 5</b></div>${S.survey.tags.length ? `<div><span>標籤</span><b>${S.survey.tags.join('、')}</b></div>` : ''}</div>` : '<p class="mut">完工後以 LINE 邀請評價。</p>'}
          <h4>${ic('heart', 16)}後續用車關懷</h4>
          <p class="mut">離廠 3 天後依本次施作內容自動發送（例如新來令片磨合提醒、暫不施作項目的複查提醒）。</p>
          <button class="btn ghost" data-act="csCare" ${done && !S.cared ? '' : 'disabled'}>${ic('send', 15)}${S.cared ? '已發送用車關懷' : '發送用車關懷（模擬 3 天後）'}</button>
          <h4>${ic('chart', 16)}決策數據回饋</h4>
          <ul class="checks"><li class="on">${ic('check', 14)}接受：${qt.its.map(v => v.short).join('、') || '—'}</li>${declined.length ? `<li class="on">${ic('check', 14)}暫不施作：${declined.join('、')}（下次提醒）</li>` : ''}${S.addonState !== 'none' ? `<li class="on">${ic('check', 14)}追加項目：${S.addonState === 'accepted' ? '同意' : S.addonState === 'declined' ? '下次複查' : '待決定'}</li>` : ''}<li class="on">${ic('check', 14)}AI 提問 ${S.metrics.aiQ} 次｜有幫助 ${S.metrics.up}｜轉真人 ${S.metrics.handoff}</li></ul>
        </section>
      </div>`;
  },
};

/* ---------- 工作台動作 ---------- */
async function csSendReminder() {
  setStage(S.stage === 'booked' ? 'reminded' : S.stage);
  act(`發送 LINE 到廠提醒（建議 ${S.load === 'busy' ? '14:15–14:25' : '13:50–14:00'} 抵達）`, 'sys');
  await oaPush({ kind: 'flex', flex: 'reminder', data: { busy: S.load === 'busy' }, preview: S.load === 'busy' ? '到廠時間建議更新：14:15–14:25' : '今天 14:00 保養提醒' }, 500);
}

async function csArrive() {
  if (S.gate !== 'idle') return;
  S.gate = 'scanning'; renderConsole();
  await wait(900);
  S.gate = 'matched'; renderConsole();
  await wait(800);
  S.arrivedAt = S.now; setStage('arrived');
  act('車牌辨識完成，自動報到', 'sys');
  S.gate = 'pushed'; renderConsole();
  await oaPush({ kind: 'flex', flex: 'welcome', data: {}, preview: `${D.customer.call}，歡迎回來！已完成報到` }, 500);
}

async function csOrganize() {
  if (S.inspect.status === 'running') return;
  S.inspect = { status: 'running', step: 0, approved: false, provider: '' };
  renderConsole();
  const provider = await AI.organize(i => { S.inspect.step = i; renderConsole(); });
  S.inspect.step = ORGANIZE_STEPS.length;
  S.inspect.status = 'done'; S.inspect.provider = provider;
  act(`AI 完成車況整理草稿（${findings().length} 項建議）`, 'ai');
  renderConsole();
}

async function csApprove() {
  if (S.inspect.status !== 'done' || S.inspect.approved) return;
  S.inspect.approved = true;
  S.inspectedAt = S.now; setStage('inspected');
  act(`${D.advisor.name} 審核車況報告並推播車主`, 'ok');
  renderConsole();
  const c = sevCounts();
  await oaPush({ kind: 'flex', flex: 'inspected', data: { p1: c.p1, p2: c.p2, p3: c.p3 }, preview: '車輛檢查已完成，共發現 ' + findings().length + ' 個建議項目' }, 600);
}

async function csStart() {
  if (!S.confirm || S.work.start != null) return;
  S.work.start = S.now; setStage('repairing');
  const p = plan();
  act(`開始施工（預計 ${hm(p.eta)} 完成）`, 'sys');
  renderConsole();
  await oaPush({ kind: 'flex', flex: 'started', data: { eta: p.eta, t: S.now }, preview: `已開始維修，預計 ${hm(p.eta)} 完成` }, 500);
}

async function csFinding() {
  if (S.addonDraft.status !== 'idle') return;
  S.addonDraft = { status: 'running', step: 0, approved: false };
  act('技師回報新發現：前煞車碟盤溝痕', 'warn');
  renderConsole();
  await AI.addon(i => { S.addonDraft.step = i; renderConsole(); });
  S.addonDraft.step = ADDON_STEPS.length; S.addonDraft.status = 'done';
  renderConsole();
}

async function csAddonApprove() {
  if (S.addonDraft.status !== 'done' || S.addonDraft.approved) return;
  S.addonDraft.approved = true; S.addonState = 'pending';
  act(`${D.advisor.name} 審核追加項目並推播車主`, 'ok');
  renderConsole();
  await oaPush({ kind: 'flex', flex: 'addon', data: {}, preview: '技師發現 1 個新的建議項目，請查看說明' }, 600);
}

async function csSoon() {
  if (S.soonSent || !S.remind || S.stage !== 'repairing') return;
  S.soonSent = true;
  const p = plan();
  if (S.now < p.eta - 15) setNow(p.eta - 15);
  act('推播完工前 15 分鐘提醒', 'sys');
  refreshLive();
  await oaPush({ kind: 'flex', flex: 'soon', data: { eta: p.eta }, preview: '您的愛車即將完工，約 15 分鐘後可取車' }, 500);
}

async function csDone() {
  if (S.stage !== 'repairing') return;
  if (!S.soonSent && S.remind) { await csSoon(); await wait(900); }
  const p = plan();
  setNow(Math.max(S.now, p.eta - 3));
  S.work.doneAt = S.now;
  setStage('done');
  act(`完工（${hm(S.work.doneAt)}），發送完工通知`, 'ok');
  renderConsole();
  const qt = quote();
  await oaPush({ kind: 'flex', flex: 'done', data: { eta: p.eta, doneAt: S.work.doneAt, count: qt.count, total: qt.total }, preview: '🎉 您的愛車已完成維修！' }, 600);
}

function replyOptions(h) {
  if (h.from === 'report') return ['我已在 1F 專員協助區，馬上為您說明', '請稍候，我 3 分鐘後到專員協助區'];
  if (h.from === 'care') return ['我稍後致電給您，了解狀況並安排檢查', '可以直接回廠，我們會優先為您檢查'];
  return ['我 3 分鐘後到客休室為您當面說明', '我請技師確認實車狀況後，再回覆您'];
}
function csReply(i, k) {
  const h = S.handoffs[i]; if (!h || h.status !== 'open') return;
  const t = replyOptions(h)[k] + '。';
  h.status = 'done'; h.reply = t;
  act(`${D.advisor.name} 回覆車主`, 'ok');
  pushMsg({ from: 'adv', kind: 'text', text: t, preview: `${D.advisor.name}：${t.slice(0, 20)}…` });
  renderConsole();
}

async function csCare() {
  if (S.stage !== 'done' || S.cared) return;
  S.cared = true;
  const later = findings().filter(v => !S.sel[v.id]).map(v => v.short);
  if (S.addonState === 'declined') later.push('前煞車碟盤溝痕');
  pushMsg({ from: 'oa', kind: 'sep', text: '10/15（四）' });
  act('發送用車關懷（離廠 3 天）', 'sys');
  renderConsole();
  await oaPush({ kind: 'flex', flex: 'care', t: T('10:00'), data: { brake: !!S.sel.brake, later }, preview: '用車關懷：愛車行駛還順利嗎？' }, 500);
}
