/* =========================================================
   車況透視鏡 — 資料模型（示意資料）
   所有數字皆為 PoC 示範用，正式導入時改由工單系統 / 零件價格庫 / 行車數據串接
   ========================================================= */

const SEV = {
  p1: { key: 'p1', label: '需優先處理', short: '優先', color: '#E5322D', soft: '#FDECEB', ink: '#B42318', pen: 12 },
  p2: { key: 'p2', label: '建議本次處理', short: '建議', color: '#F29100', soft: '#FFF4E0', ink: '#A15C00', pen: 5 },
  p3: { key: 'p3', label: '可持續觀察', short: '觀察', color: '#2E7CF6', soft: '#EAF2FE', ink: '#175CD3', pen: 2 },
  ok: { key: 'ok', label: '狀況正常', short: '正常', color: '#1E9E5B', soft: '#E8F6EE', ink: '#067647', pen: 0 },
};
const SEV_ORDER = ['p1', 'p2', 'p3', 'ok'];

const ZONES = {
  ENG: { label: '引擎室', icon: 'engine' },
  FL: { label: '左前輪', icon: 'wheel' },
  FR: { label: '右前輪', icon: 'wheel' },
  RL: { label: '左後輪', icon: 'wheel' },
  RR: { label: '右後輪', icon: 'wheel' },
  CAB: { label: '車內座艙', icon: 'seat' },
  REAR: { label: '車尾燈光', icon: 'light' },
};

/* 2D 俯視車體參數（概念驗證先做三種車型） */
const BODY = {
  sedan: { label: '轎車', model: 'COROLLA ALTIS', L: 410, W: 146, hood: 112, ws: 62, roof: 112, rw: 54, fa: 0.205, ra: 0.79, rF: 50, rR: 44 },
  suv: { label: '休旅', model: 'COROLLA CROSS', L: 392, W: 156, hood: 98, ws: 58, roof: 158, rw: 34, fa: 0.215, ra: 0.795, rF: 46, rR: 34 },
  mpv: { label: 'MPV', model: 'SIENTA', L: 396, W: 150, hood: 66, ws: 76, roof: 200, rw: 26, fa: 0.185, ra: 0.82, rF: 40, rR: 26 },
};

const D = {
  today: '2026/10/12（一）',
  ro: 'RO-20261012-0147',
  customer: { name: '林佳穎', call: '林小姐', phone: '0912-345-678', points: 3280 },
  car: { model: 'COROLLA CROSS', trim: '1.8 汽油旗艦', body: 'suv', plate: 'ABC-1234', year: 2024, delivered: '2024/10', mileage: 40126, color: '珍珠白' },
  booking: {
    date: '10/12（一）', dateLong: '10月12日 星期一', time: '14:00', service: '40,000 公里定期保養',
    branch: '高雄中正服務廠', addr: '高雄市苓雅區中正一路（示意地址）', tel: '07-000-0000', wait: '是', notify: 'LINE',
  },
  advisor: { name: '王志明', title: '服務專員' },
  tech: { name: '陳建宏', title: '技師', bay: 'B3' },
  lounge: { seat: 'B 區 12 號桌', floor: '2F 客休室' },
  driving: { period: '近 6 個月', city: 81, speed: 24, hardBrake: 3.6, hardBrakeAvg: 2.1, monthKm: 1650 },
  history: [
    { date: '2026/04/18', km: 30085, what: '30,000 公里定期保養', note: '機油、機油濾芯、空調濾網' },
    { date: '2025/10/20', km: 20140, what: '20,000 公里定期保養', note: '機油、機油濾芯' },
    { date: '2025/04/16', km: 10210, what: '10,000 公里定期保養', note: '機油、機油濾芯、輪胎調位' },
  ],
  nextService: { date: '2027/04', km: '50,000 km' },
};

/* 技師量測初始值（服務廠端可修改，車主端報告會跟著重算） */
const MEAS0 = {
  padFR: 3.2, padFL: 3.6, padRR: 6.8, padRL: 7.0,
  trFL: 4.3, trFR: 4.1, trRL: 6.0, trRR: 6.1,
  battery: 91, fluid: 1, oilKm: 10041, ac: '輕微髒污',
};

const TECH_NOTE0 = '右前來令片剩三點二，左前三點六，快到標準了，建議這次換。前後胎紋差快兩毫米，建議順便調位。機油到期。冷氣濾網有點髒，可以下次換。其他都正常。';

/* 原廠標準（規則引擎用：嚴重度由規則判定，AI 只負責白話說明） */
const STD = {
  padLimit: 3.0, padNew: 10, padWearPerK: 0.17,
  treadNew: 8.0, treadLimit: 3.0, treadLegal: 1.6, rotateDiff: 1.5,
  oilInterval: 10000,
  rotorNew: 26.0, rotorMin: 24.0,
};

/* 零件價格庫（示意）與原廠標準工時（分鐘） */
const PRICE = {
  oil: { parts: [['原廠機油 0W-20（4.2 L）', 1200], ['機油濾芯', 350]], total: 1550, labor: 0 },
  brake: { total: 2800, labor: 20, note: '原廠前輪來令片一組（4 片）＋工資' },
  rotate: { total: 600, labor: 5, laborAlone: 15, note: '四輪換位、胎壓調整、螺帽扭力檢查' },
  ac: { total: 900, labor: 10, note: '原廠空調濾網＋工資' },
  rotor: { total: 1000, labor: 20, note: '前輪兩片碟盤研磨工資（不需更換零件）' },
};

/* 正常項目（狀況正常 12 項） */
const NORMALS = [
  { zone: 'ENG', name: '冷卻液', val: '液位正常' },
  { zone: 'ENG', name: '電瓶', val: '健康度 91%' },
  { zone: 'ENG', name: '煞車油', val: '含水率 1%' },
  { zone: 'FR', name: '前避震器', val: '無漏油' },
  { zone: 'FL', name: '轉向拉桿', val: '無鬆動' },
  { zone: 'RL', name: '左後煞車來令片', val: '7.0 mm' },
  { zone: 'RR', name: '右後煞車來令片', val: '6.8 mm' },
  { zone: 'RL', name: '四輪胎壓', val: '已調整至 35 psi' },
  { zone: 'CAB', name: '雨刷', val: '刮拭正常' },
  { zone: 'CAB', name: '空調出風', val: '溫度正常' },
  { zone: 'REAR', name: '煞車燈・方向燈', val: '作動正常' },
  { zone: 'REAR', name: '倒車雷達', val: '作動正常' },
];

/* 今日入廠看板（仿官方日視看板，車主姓名遮蔽） */
const BOARD = [
  { t: '13:30', plate: 'RDA-5821', who: '張車主', type: 'EM定保', adv: '林', st: '維修中' },
  { t: '13:45', plate: 'BKL-0730', who: '古車主', type: '定保', adv: '陳', st: '檢查中' },
  { t: '14:00', plate: 'ABC-1234', who: '林車主', type: '定保', adv: '王', st: '', me: true },
  { t: '14:15', plate: 'TPE-3317', who: '黃車主', type: '一般', adv: '黃', st: '預約' },
  { t: '14:25', plate: 'AMN-2186', who: '董車主', type: '定保', adv: '陳', st: '預約' },
  { t: '14:35', plate: 'BCX-9042', who: '陳車主', type: '鈑噴', adv: '林', st: '預約' },
  { t: '15:00', plate: 'KHH-6620', who: '劉車主', type: '一般', adv: '黃', st: '預約' },
  { t: '15:05', plate: 'BQL-1288', who: '呂車主', type: '定保', adv: '王', st: '預約' },
];

/* 成效儀表板（示意數據：模擬單一服務廠 30 天 PoC） */
const DASH = {
  ledger: [
    { k: '施作確認所需時間', unit: '分', before: 11.8, after: 4.2, better: 'down', note: '中間報告＋報價確認' },
    { k: '專員說明工時（每台）', unit: '分', before: 18.5, after: 9.0, better: 'down', note: '數位自主者僅需處理例外' },
    { k: '車主主動詢問進度（每台）', unit: '次', before: 2.4, after: 0.6, better: 'down', note: 'LINE 進度推播與查詢' },
    { k: '車況說明理解度', unit: '/5', before: 3.4, after: 4.6, better: 'up', note: '完工後問卷' },
    { k: '維修資訊透明度', unit: '/5', before: 3.2, after: 4.5, better: 'up', note: '完工後問卷' },
    { k: '整體滿意度', unit: '/5', before: 4.1, after: 4.7, better: 'up', note: '完工後問卷' },
    { k: '等候期間曾離開客休室', unit: '%', before: 12, after: 41, better: 'up', note: '等得自由' },
  ],
  adoption: [42, 55, 63, 68],
  tiles: [
    { k: '數位服務使用率', v: '68%', sub: '收到檢查通知後選擇數位自主' },
    { k: '自主完成率', v: '83%', sub: '不需專員介入即完成確認' },
    { k: '完工時間誤差', v: '±6.8 分', sub: '85% 落在 ±10 分鐘內' },
    { k: 'AI 回答有幫助', v: '92%', sub: '轉真人比例 7%' },
  ],
  accept: [
    { k: '機油（定期保養）', v: 99 }, { k: '煞車來令片', v: 87 }, { k: '輪胎調位', v: 64 },
    { k: '電瓶', v: 52 }, { k: '碟盤研磨', v: 46 }, { k: '空調濾網', v: 38 },
  ],
  questions: [
    { k: '這次不更換可以嗎？', v: 28 }, { k: '費用包含哪些？', v: 19 }, { k: '為什麼磨損這麼快？', v: 15 },
    { k: '更換需要多久？', v: 13 }, { k: '原廠零件差在哪？', v: 9 }, { k: '其他', v: 16 },
  ],
  funnel: [
    { k: '收到檢查完成通知', v: 100 }, { k: '開啟車況報告', v: 91 }, { k: '查看品項說明', v: 84 },
    { k: '完成項目勾選', v: 80 }, { k: '數位簽名確認', v: 78 },
  ],
};

/* 痛點分析（公開輿情）：分類以提案三大痛點與四個體驗階段為骨架 */
const PAIN_CATS = [
  { id: 'explain', label: '說明不清・資訊落差', phase: 1, pain: '痛點一', fix: '車體透視＋正常／目前對比＋AI 白話說明',
    kw: ['聽不懂', '不清楚', '沒說', '沒講', '看不懂', '專有名詞', '為什麼要', '不知道為什麼', '講不清', '沒解釋', '解釋不清', '說明不清', '說明清楚一點', '沒給我看', '照片', '證據', '零件名稱'] },
  { id: 'price', label: '推銷・價格疑慮', phase: 2, pain: '痛點一', fix: '量測依據＋逐項勾選＋即時報價',
    kw: ['推銷', '貴', '價格', '報價', '加價', '坑', '多收', '換一堆', '硬要', '費用', '收費', '一定要做', '多做'] },
  { id: 'progress', label: '進度不透明', phase: 3, pain: '痛點二', fix: '維修進度＋關鍵節點推播＋遠端追加確認',
    kw: ['進度', '修到哪', '沒通知', '沒有通知', '不知道修', '問進度', '一直問', '沒人跟', '中間報告', '追加', '找不到我', '主動通知'] },
  { id: 'wait', label: '等待時間長', phase: 3, pain: '痛點三', fix: '動態到廠＋完工時間預估＋完工前提醒',
    kw: ['等了', '等很久', '等太久', '久', '小時', '排隊', '拖到', '超時', '延誤', '耗時', '半天', '還要等', '多久'] },
  { id: 'booking', label: '預約與到廠', phase: 0, pain: '', fix: '動態到廠提醒＋車牌辨識自動報到',
    kw: ['預約', '到廠', '準時到', '現場', '停車', '報到', '進廠', '約好'] },
  { id: 'lounge', label: '客休室與等候設施', phase: 3, pain: '痛點三', fix: '線上點單＋等候時間自由安排',
    kw: ['客休', '咖啡', '飲料', 'wifi', 'Wi-Fi', '座位', '休息室', '點心', '無聊', '離開', '附近'] },
  { id: 'staff', label: '服務態度與專業', phase: -1, pain: '', fix: '專員協助模式＋AI 分擔重複說明',
    kw: ['態度', '親切', '不耐煩', '專業', '熱心', '冷淡', '服務人員', '禮貌', '很忙'] },
];
const PAIN_PHASE = ['到得準', '看得懂', '選得清', '等得自由'];
const SENT = {
  pos: ['親切', '專業', '滿意', '很好', '推薦', '舒服', '快速', '謝謝', '用心', '貼心', '好喝', '乾淨', '準時完成', '不錯', '感謝', '安心'],
  neg: ['不知道', '不清楚', '聽不懂', '看不懂', '不耐煩', '沒有', '沒通知', '沒人', '沒給', '太久', '很久', '貴', '推銷', '坑', '失望', '無奈', '擔心', '不敢', '怕', '延誤', '拖到', '誇張', '傻眼', '麻煩', '無聊', '多了', '找不到', '排隊'],
};
const PAIN_SAMPLE = [
  '保養等了快兩個小時，中間完全不知道修到哪裡，只能一直看電視。',
  '專員講了一堆零件名稱，聽不懂為什麼要換，最後只好先付錢。',
  '每次回廠都被建議換一堆東西，不知道是不是真的需要，感覺在推銷。',
  '預約十點準時到，結果現場還要排隊等進廠快半小時。',
  '客休室咖啡好喝、座位舒服，但等太久還是很無聊。',
  '技師發現要追加項目，專員找不到我，回來才知道還要再等。',
  '報價單上的項目太多，看不懂哪些是一定要做的。',
  '服務人員很親切，說明也很專業，整體滿意。',
  '不敢離開客休室，怕錯過專員的中間報告。',
  '打電話問進度要等很久才有人接，也沒有主動通知完工。',
  '說煞車來令片要換，但沒給我看實際磨損的照片。',
  '原本說一小時，結果拖到快三小時，也沒人跟我說為什麼延誤。',
  '專員很忙，問兩次問題就覺得他有點不耐煩。',
  '希望可以知道還要等多久，這樣我可以先去附近吃飯。',
  '價格比外面貴，但原廠比較安心，只是希望說明清楚一點。',
  '交車時才發現多做了一個項目，費用多了一千多。',
];
