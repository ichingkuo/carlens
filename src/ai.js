/* =========================================================
   車況透視鏡 — AI 層
   1) Google Gemini（填入 API Key 後啟用，對應提案的 PoC 技術選型）
   2) 離線示範引擎：依本次工單資料作答（展示現場無網路也能運作）
   護欄：回答只依工單／原廠標準／行車數據；安全、保固、無法確認 → 轉真人
   ========================================================= */

const INTENTS = [
  { id: 'safety', w: 3, kw: ['危險', '安全', '出事', '還能開', '可以開', '能開', '煞不住', '事故', '高速', '長途', '開回家', '跑山'] },
  { id: 'warranty', w: 3, kw: ['保固', '保修', '理賠', '索賠', '免費換', '保險'] },
  { id: 'skip', w: 1, kw: ['不換', '不更換', '不修', '不處理', '延後', '下次再', '可以嗎', '晚點', '先不要', '不要換', '撐', '再觀察', '不做', '不研磨'] },
  { id: 'cost', w: 1, kw: ['多少錢', '價格', '費用', '貴', '便宜', '包含', '錢', '價錢', '報價', '花費'] },
  { id: 'time', w: 1, kw: ['多久', '幾分鐘', '工時', '要等', '時間', '完成', '好了沒'] },
  { id: 'why', w: 1, kw: ['為什麼', '原因', '怎麼會', '磨這麼快', '為何', '怎麼磨', '磨損'] },
  { id: 'what', w: 1, kw: ['是什麼', '什麼是', '功能', '作用', '用途', '幹嘛', '做什麼'] },
  { id: 'oem', w: 1, kw: ['原廠', '副廠', '外面', '其他店', '一般零件', '品牌', '差在哪'] },
  { id: 'self', w: 1, kw: ['怎麼看', '自己檢查', '判斷', '異音', '聲音', '徵兆', '怎麼知道'] },
];

function detectIntent(q) {
  const s = String(q).replace(/\s/g, '');
  let best = { id: 'unknown', n: 0 };
  INTENTS.forEach(it => {
    const n = it.kw.reduce((a, k) => a + (s.includes(k) ? k.length * it.w : 0), 0);
    if (n > best.n) best = { id: it.id, n };
  });
  return best.id;
}

const HANDOFF_SAFETY = v => `我先提供參考：目前量測值${v.vars && v.vars.under ? '已低於' : '仍高於'}原廠更換標準${v.vars && v.vars.under ? '，不建議延後處理' : '，正常駕駛下功能仍在'}。但「是否適合延後、能不能跑長途」需要技師依實車狀況判斷，我不能代替技師下結論。\n已幫您通知 ${D.advisor.name} 專員，約 3 分鐘內回覆您。`;
const HANDOFF_WARRANTY = v => `${v.short}${v.id === 'brake' || v.id === 'ac' || v.id === 'oil' ? '屬於正常消耗件，一般不在新車保固範圍內，' : ''}但實際認定仍需依您的保固條款與實車狀況，我無法直接判斷。\n已幫您通知 ${D.advisor.name} 專員確認。`;
const UNKNOWN = () => `這個問題我無法從本次工單資料中確認，為了不給您不準確的資訊，建議由服務專員說明。要幫您轉接 ${D.advisor.name} 專員嗎？`;

const KB = {
  brake: {
    skip: v => v.vars.under
      ? `${v.vars.side}來令片 ${v.vars.min} mm，已低於原廠更換標準（3.0 mm），不建議延後。\n繼續使用可能：\n• 煞車距離變長\n• 金屬直接摩擦碟盤、產生尖銳異音\n• 碟盤一併受損，費用增加 $4,000 以上\n若有安全疑慮，我可以請專員為您說明。`
      : `可以理解您想再觀察。以目前數據來看：${v.vars.side}來令片 ${v.vars.min} mm，離更換標準（3.0 mm）只差一點；依您的磨耗速度，約再開 ${v.vars.km} 公里（約 ${v.vars.weeks} 週）就會低於標準，早於下次保養。\n若暫不更換，可能出現：\n• 煞車距離變長、腳感變軟\n• 磨盡時金屬摩擦碟盤，產生尖銳異音\n• 碟盤一併受損，費用可能增加 $4,000 以上\n考量行車安全，建議本次更換；若仍想延後，建議 2–3 週內回廠。`,
    why: v => `主要和用車環境有關。依您的行車數據，近 6 個月市區行駛占 ${D.driving.city}%、平均時速 ${D.driving.speed} km/h，每百公里急煞約 ${D.driving.hardBrake} 次（同車型平均 ${D.driving.hardBrakeAvg} 次）。\n走走停停的路況讓煞車次數變多，來令片自然磨得比較快，並不是零件品質異常。`,
    cost: v => `${money(v.price)} 包含：\n• 原廠前輪煞車來令片一組（左右輪共 4 片）\n• 更換工資與煞車系統清潔\n• 完工後煞車測試\n價格依原廠零件價格表帶入，已含稅。`,
    time: v => { const p = plan(); return `更換前輪來令片約需 20 分鐘。若同時做輪胎調位，因為都要拆輪，可合併施工，只再多約 5 分鐘。\n依您目前的勾選，預計完成時間為 ${hm(p.eta)}。`; },
    what: v => `煞車來令片是煞車時夾住碟盤、產生摩擦讓車子停下來的零件，就像鞋底一樣，每踩一次煞車都會磨掉一點。新品約 10 mm，磨到 3 mm 左右就建議更換。`,
    oem: v => `原廠來令片依此車型的煞車系統設計與測試，摩擦係數與耐熱度都經過匹配，更換後腳感與原車一致。其他品牌也有符合規格的選擇，是否在原廠施作由您決定；本報價為原廠零件價格。`,
    self: v => `可以留意這幾個徵兆：\n• 煞車時出現「嘰——」的尖銳金屬聲\n• 踩煞車要踩更深才煞得住\n• 儀表板煞車警示燈亮起\n出現任何一項，都建議盡快回廠檢查。`,
  },
  rotate: {
    skip: v => `可以，輪胎調位不是立即性的安全問題。不過前後胎紋已差 ${v.vars.diff} mm，若不調位，前輪會繼續磨得比較快，可能提早到達更換標準，到時需要提早換胎（一組約 $12,000 起）。\n這次因為換煞車要拆輪，合併做最划算，只多約 5 分鐘。`,
    why: v => `前輪同時負責轉向，又承受引擎和煞車時的重量，所以磨得比後輪快。加上您市區行駛比例高（${D.driving.city}%）、轉彎與煞停次數多，前後差距會更明顯。`,
    cost: v => `${money(v.price)} 包含四輪拆裝換位、胎壓調整與螺帽扭力檢查。`,
    time: v => `單獨施作約 15 分鐘；這次和煞車來令片一起做，只需多約 5 分鐘。`,
    what: v => `輪胎調位就是把前後輪交換位置，讓四條輪胎平均磨耗，延長整組輪胎壽命。原廠建議約每 1 萬公里檢查並視需要調位。`,
    oem: v => `輪胎調位不涉及零件更換，主要是工時與檢查，原廠會一併檢查胎壓與螺帽扭力。`,
    self: v => `可以看胎紋溝槽裡的「磨耗指示點」，胎面磨到和指示點齊平就必須換胎。平常也可以留意方向盤是否偏向一側。`,
    safety: v => `目前胎紋最淺 ${v.vars.min} mm，仍高於建議換胎標準（3.0 mm）與法規下限（1.6 mm），短期內不影響安全。若您還有其他行車安全疑慮，可以請專員說明。`,
  },
  oil: {
    skip: v => `機油是本次預約的定期保養項目，已達原廠建議的 10,000 公里週期（距上次已 ${fmtN(S.meas.oilKm)} km）。若不更換，潤滑與散熱效果會下降，長期可能增加引擎磨耗與油耗，建議依原廠週期更換。`,
    why: v => `機油會隨使用逐漸氧化、混入燃燒產生的雜質，顏色從金黃變成深褐色，保護力也跟著下降。這是正常消耗，不是異常。`,
    cost: v => `定期保養 ${money(v.price)} 包含：\n• 原廠機油 0W-20（4.2 L）$1,200\n• 機油濾芯 $350\n已含工資與 40,000 公里定保檢查項目。`,
    time: v => `機油與濾芯更換約 12 分鐘，已包含在定期保養的標準工時內，不會額外增加時間。`,
    what: v => `機油就像引擎的血液，負責潤滑、散熱與清潔，讓引擎內部的金屬零件不會直接摩擦。`,
    oem: v => `原廠機油規格（0W-20）依引擎設計選用，可兼顧低溫啟動保護與省油表現。`,
    self: v => `可以用機油尺查看油位是否在上下刻度之間；若儀表出現機油警示燈，請儘速停車檢查。`,
    safety: v => `機油已到更換週期，但不屬於立即影響煞車或轉向的安全項目，本次定保就會更換，您不必擔心。`,
  },
  ac: {
    skip: v => `可以，空調濾網目前屬於「可持續觀察」，過濾效果尚可，等下次保養再更換沒問題。系統會在下次保養提醒您複查。`,
    why: v => `濾網會攔住空氣中的灰塵、花粉和落葉，使用 6 個月後表面出現灰塵是正常現象。`,
    cost: v => `${money(v.price)} 包含原廠空調濾網與更換工資，約 10 分鐘。`,
    time: v => `約 10 分鐘，可在保養期間同步施作。`,
    what: v => `空調濾網就像車子的口罩，過濾從外面吸進車內的空氣。`,
    oem: v => `原廠濾網尺寸與車型完全吻合，可避免縫隙讓灰塵繞過濾網。`,
    self: v => `若冷氣出風變小、開空調有霉味，或家人容易過敏，都可以考慮提早更換。`,
    safety: v => `空調濾網不影響行車安全，主要影響車內空氣品質與冷氣出風量。`,
  },
  rotor: {
    skip: v => `可以。碟盤厚度 25.4 mm 仍高於最低使用厚度（24.0 mm），不研磨不影響煞車安全。只是新來令片在有溝痕的碟盤上，初期接觸面積較小，前幾百公里可能有輕微異音。\n下次保養會再量測一次，系統會提醒您複查。`,
    why: v => `碟盤溝痕通常來自來令片變薄時夾帶的砂塵，加上您市區煞車次數多，屬於常見磨耗。`,
    cost: v => `${money(v.price)} 為前輪兩片碟盤研磨工資，不需更換零件。`,
    time: v => { const p = plan(); return `研磨約 20 分鐘。若本次處理，預計完成時間會從 ${hm(p.eta)} 調整為 ${hm(p.eta + (S.addonState === 'accepted' ? 0 : 20))}。`; },
    what: v => `碟盤是固定在車輪上的金屬圓盤，煞車時來令片會夾住它。研磨就是把表面車平，讓新來令片能完整貼合。`,
    oem: v => `研磨不涉及零件更換；若日後碟盤低於最低厚度，才需要更換碟盤。`,
    self: v => `若煞車時方向盤抖動、或有規律的「唰唰」聲，可能是碟盤不平，建議回廠檢查。`,
    safety: v => `目前碟盤厚度仍在安全範圍內，不研磨不影響煞車功能。若您仍有疑慮，可以請專員說明。`,
  },
};

function localAnswer(key, q) {
  const intent = detectIntent(q);
  if (key === 'general') return generalAnswer(q, intent);
  const v = itemView(key);
  const kb = KB[key] || {};
  let text, handoff = false;
  if (intent === 'safety' && !kb.safety) { text = HANDOFF_SAFETY(v); handoff = true; }
  else if (intent === 'safety') { text = kb.safety(v); }
  else if (intent === 'warranty') { text = HANDOFF_WARRANTY(v); handoff = true; }
  else if (kb[intent]) { text = kb[intent](v); }
  else { text = UNKNOWN(); handoff = true; }
  const follow = {
    skip: ['為什麼會磨損這麼快？', '費用包含哪些？'], why: ['這次不更換可以嗎？', '更換需要多久？'],
    cost: ['更換需要多久？', '原廠零件差在哪？'], time: ['費用包含哪些？', '這次不更換可以嗎？'],
    what: ['這次不更換可以嗎？', '怎麼自己判斷？'], oem: ['費用包含哪些？', '這次不更換可以嗎？'],
    self: ['這次不更換可以嗎？', '費用包含哪些？'], safety: ['費用包含哪些？', '更換需要多久？'],
    warranty: ['費用包含哪些？', '更換需要多久？'], unknown: ['這次不更換可以嗎？', '費用包含哪些？'],
  }[intent] || [];
  return { text, handoff, intent, followups: follow, sources: handoff ? ['本次工單', '轉由服務專員確認'] : v.sources };
}

function generalAnswer(q, intent) {
  const s = q.replace(/\s/g, '');
  if (/進度|好了|完成了|還要多久|多久|修好/.test(s)) return { kind: 'progress' };
  if (/專員|真人|客服|人工|打電話/.test(s)) return { kind: 'advisor' };
  if (/預約|改時間|改約/.test(s)) return { kind: 'booking' };
  if (/多少錢|費用|報價|總共/.test(s)) {
    const qt = quote();
    return { text: `目前勾選 ${qt.count} 項，預估總額 ${money(qt.total)}（含零件、工資、稅）。可以在「報價與施作確認」查看明細與調整項目。`, followups: ['查看維修進度', '找服務專員'] };
  }
  if (/你好|哈囉|嗨|hi|hello/i.test(s)) return { text: `${D.customer.call}您好！我是 TOYOTA 智能客服，可以幫您查詢本次維修進度、車況說明與費用，也可以點下方選單。`, followups: ['進度', '費用多少？'] };
  return { text: `我可以協助您查詢本次維修進度、車況說明與費用；其他問題我會轉給 ${D.advisor.name} 專員。`, followups: ['進度', '找服務專員'] };
}

/* ---------- Gemini（REST generateContent） ---------- */
function aiErr(e) {
  const m = String((e && e.message) || e || '');
  if (e && e.name === 'AbortError') return '連線逾時';
  if (e instanceof TypeError || /Failed to fetch|NetworkError|Load failed/i.test(m)) return '無法連線（線上展示版不允許外部連線，請用本機 HTML 檔）';
  return m.slice(0, 48);
}
const Gemini = {
  enabled() { return S.ai.mode === 'gemini' && !!(S.ai.key || '').trim(); },
  async call({ system, user, json = true, history = [], images = [], timeout = 25000 }) {
    const key = S.ai.key.trim(), model = (S.ai.model || 'gemini-3.8-flash').trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const contents = history.map(h => ({ role: h.role === 'me' ? 'user' : 'model', parts: [{ text: h.text }] }));
    contents.push({ role: 'user', parts: [{ text: user }, ...images.map(im => ({ inline_data: { mime_type: im.mime, data: im.b64 } }))] });
    const body = { systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { temperature: 0.3 } };
    if (json) body.generationConfig.responseMimeType = 'application/json';
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
      const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      const text = parts.filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('');
      if (!text) throw new Error('模型沒有回傳內容');
      return text;
    } finally { clearTimeout(to); }
  },
  parse(text) {
    const t = String(text).replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim();
    try { return JSON.parse(t); } catch (e) {
      const m = t.match(/\{[\s\S]*\}/);
      if (m) { try { return JSON.parse(m[0]); } catch (e2) { /* fallthrough */ } }
      return null;
    }
  },
};

function aiContext(key) {
  const p = plan(), qt = quote();
  const brief = v => ({ 項目: v.name, 緊急程度: SEV[v.sev].label, 量測: v.measure, 標準: v.line2, 白話說明: v.plain, 建議理由: v.why, 不處理影響: v.risks, 費用: v.price, 工時分鐘: v.labor, 費用說明: v.priceNote });
  const ctx = {
    車主: D.customer.call, 車輛: `${D.car.model} ${D.car.year} 年式，里程 ${fmtN(D.car.mileage)} km`,
    服務專員: D.advisor.name, 工單: D.ro,
    本次提問項目: key !== 'general' ? brief(itemView(key)) : '整體服務',
    其他建議項目: findings().filter(v => v.id !== key).map(v => ({ 項目: v.name, 緊急程度: SEV[v.sev].label, 量測: v.measure, 費用: v.price })),
    行車數據_近6個月: { 市區行駛占比: D.driving.city + '%', 平均時速: D.driving.speed + ' km/h', 每百公里急煞: D.driving.hardBrake, 同車型平均急煞: D.driving.hardBrakeAvg, 月均里程: D.driving.monthKm },
    保養紀錄: D.history,
    目前勾選與報價: { 項目數: qt.count, 預估總額: qt.total, 預計完成: hm(p.eta) },
  };
  return JSON.stringify(ctx, null, 1);
}

const AI = {
  label() { return Gemini.enabled() ? `Gemini｜${S.ai.model}` : '離線示範引擎'; },

  async ask(key, q, history = []) {
    const local = localAnswer(key, q);
    if (key === 'general' && local.kind) return local;
    if (Gemini.enabled() && !fastMode()) {
      try {
        const system = `你是 TOYOTA「車況透視鏡」的 AI 車況助手，正在協助車主理解本次回廠的車況。
回答規則：
1. 使用繁體中文（台灣用語），口語、簡潔，120 字以內；可用「• 」條列，最多 4 點。
2. 只能根據下方 JSON 資料回答，不得編造數據、價格或工時；資料中沒有的就說無法確認。
3. 客觀說明「處理」與「不處理」的影響，不推銷、不恐嚇，尊重車主決定。
4. 若問題涉及：能否安全行駛的最終判斷、保固或理賠認定、資料中沒有的資訊 → 簡短回答後把 handoff 設為 true，建議由服務專員 ${D.advisor.name} 協助。
5. 只輸出 JSON：{"answer":"…","handoff":false,"followups":["…","…"]}，followups 是車主可能追問的 2 個短問題（各 12 字內）。
資料：
${aiContext(key)}`;
        const hist = history.slice(-6).map(h => ({ role: h.role, text: h.text }));
        const raw = await Gemini.call({ system, user: q, history: hist });
        const j = Gemini.parse(raw);
        if (j && j.answer) {
          return { text: String(j.answer), handoff: !!j.handoff, followups: Array.isArray(j.followups) ? j.followups.slice(0, 2) : local.followups, sources: j.handoff ? ['本次工單', '轉由服務專員確認'] : (local.sources || ['本次工單']), provider: 'gemini' };
        }
        throw new Error('格式不符');
      } catch (e) {
        toast(`Gemini 暫時無法回應：${aiErr(e)}。已改用離線示範回覆`);
      }
    }
    await sleep(fastMode() ? 0 : 650 + Math.random() * 450);
    return { ...local, provider: 'local' };
  },

  async organize(onStep) {
    const steps = ORGANIZE_STEPS;
    for (let i = 0; i < steps.length; i++) { onStep(i); await sleep(fastMode() ? 0 : 430); }
    let provider = 'local';
    if (Gemini.enabled() && !fastMode()) {
      try {
        const imgs = Object.entries(S.photos).slice(0, 3).map(([k, url]) => ({ mime: url.slice(5, url.indexOf(';')), b64: url.slice(url.indexOf(',') + 1) }));
        const system = `你是 TOYOTA 服務廠的 AI 車況整理助理。根據技師量測、口述備註${imgs.length ? '與現場照片' : ''}，為車主撰寫白話車況說明草稿，之後會由服務專員審核。
規則：繁體中文（台灣用語）；不得更改任何量測數字；不寫價格與工時（由系統帶入）；語氣客觀、不推銷、不恐嚇。
只輸出 JSON：{"items":[{"id":"brake|rotate|oil|ac","plain":"給車主的一句白話比喻與現況（45 字內）","why":"建議理由，引用量測數字（70 字內）"}],"summary":"一句話總結（30 字內）"}`;
        const user = `車輛：${D.car.model} ${D.car.year}，里程 ${fmtN(D.car.mileage)} km
量測：右前來令片 ${S.meas.padFR} mm、左前 ${S.meas.padFL} mm（更換標準 ≤3.0 mm，新品 10 mm，車主磨耗速度每千公里 0.17 mm）；胎紋 FL ${S.meas.trFL} FR ${S.meas.trFR} RL ${S.meas.trRL} RR ${S.meas.trRR} mm（前後差 >1.5 mm 建議調位）；機油距上次 ${S.meas.oilKm} km（週期 10,000 km）；空調濾網：${S.meas.ac}；電瓶健康度 ${S.meas.battery}%；煞車油含水率 ${S.meas.fluid}%。
行車數據：市區行駛 81%、平均時速 24 km/h、每百公里急煞 3.6 次（同車型 2.1 次）。
技師口述：${S.note}
需要說明的項目 id：${findings().map(v => v.id).join(', ')}`;
        const j = Gemini.parse(await Gemini.call({ system, user, images: imgs, timeout: 40000 }));
        if (j && Array.isArray(j.items)) {
          j.items.forEach(it => { if (ITEM_IDS.includes(it.id) && (it.plain || it.why)) AIO[it.id] = { plain: it.plain ? String(it.plain) : undefined, why: it.why ? String(it.why) : undefined }; });
          provider = 'gemini';
        } else throw new Error('格式不符');
      } catch (e) {
        toast(`Gemini 整理失敗：${aiErr(e)}。已改用離線示範結果`);
      }
    }
    return provider;
  },

  async addon(onStep) {
    for (let i = 0; i < ADDON_STEPS.length; i++) { onStep(i); await sleep(fastMode() ? 0 : 420); }
    if (Gemini.enabled() && !fastMode()) {
      try {
        const system = '你是 TOYOTA 服務廠的 AI 車況整理助理。技師在維修中發現新項目，請為車主寫白話說明草稿（之後由專員審核）。繁體中文，不得改數字、不寫價格，語氣客觀、明確說明不處理也可以。只輸出 JSON：{"plain":"一句白話比喻（45 字內）","why":"理由（70 字內）"}';
        const user = '項目：前煞車碟盤表面溝痕。量測：碟盤厚度 25.4 mm（最低使用厚度 24.0 mm），溝痕深約 0.3 mm。情境：正在更換前煞車來令片時發現。可選：本次研磨，或下次保養複查。';
        const j = Gemini.parse(await Gemini.call({ system, user }));
        if (j && (j.plain || j.why)) { AIO.rotor = { plain: j.plain, why: j.why }; return 'gemini'; }
      } catch (e) { toast('Gemini 暫時無法回應，改用離線示範結果'); }
    }
    return 'local';
  },

  async test() {
    const t = await Gemini.call({ system: '你是測試助理。', user: '請只回覆：連線成功', json: false, timeout: 15000 });
    return t.trim().slice(0, 40);
  },
};

const ORGANIZE_STEPS = ['讀取技師量測數據（14 筆）', '語音備註轉寫與重點擷取', '判讀現場照片（6 張）', '比對原廠標準與保養紀錄', '帶入零件價格與原廠標準工時', '生成白話說明（嚴重度由規則判定）'];
const ADDON_STEPS = ['讀取技師回報與量測值', '判讀碟盤照片', '帶入工時與費用、重算完工時間', '生成白話說明草稿'];
