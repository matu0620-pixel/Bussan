// ─────────────────────────────────────────────────────────────
// SONAE — デモ用ダミーデータ
// すべて架空の企業「株式会社ミナトテック」の想定データです。
// ─────────────────────────────────────────────────────────────

export const TODAY = new Date("2026-09-10T09:00:00+09:00");

export const COMPANY = {
  name: "株式会社ミナトテック",
  headcount: 412,
  fiscalYearStartMonth: 4,
};

/* ---------------- 拠点 ---------------- */

export type Site = {
  id: string;
  name: string;
  short: string;
  address: string;
  pref: string;
  headcount: number;
  /** 来客・協力会社を見込んだ想定滞留係数 */
  visitorFactor: number;
  warehouse: string;
  seismic: "新耐震" | "旧耐震" | "免震";
};

export const SITES: Site[] = [
  { id: "hq", name: "東京本社", short: "東京", address: "東京都新宿区西新宿2-8-1", pref: "東京都", headcount: 186, visitorFactor: 1.15, warehouse: "B1F 防災倉庫 / 各フロア備蓄庫", seismic: "免震" },
  { id: "yok", name: "横浜テクノセンター", short: "横浜", address: "神奈川県横浜市西区みなとみらい3-1", pref: "神奈川県", headcount: 92, visitorFactor: 1.05, warehouse: "1F 資材倉庫 A-3", seismic: "新耐震" },
  { id: "ngy", name: "名古屋支店", short: "名古屋", address: "愛知県名古屋市中村区名駅4-7", pref: "愛知県", headcount: 45, visitorFactor: 1.1, warehouse: "8F 倉庫", seismic: "新耐震" },
  { id: "osk", name: "大阪支店", short: "大阪", address: "大阪府大阪市北区梅田1-3", pref: "大阪府", headcount: 64, visitorFactor: 1.1, warehouse: "12F 書庫兼倉庫", seismic: "旧耐震" },
  { id: "sdi", name: "仙台営業所", short: "仙台", address: "宮城県仙台市青葉区中央1-2", pref: "宮城県", headcount: 25, visitorFactor: 1.05, warehouse: "5F ロッカー室", seismic: "新耐震" },
];

export const siteById = (id: string) => SITES.find((s) => s.id === id)!;

/* ---------------- 品目カテゴリ / 基準セット ---------------- */

export type Basis = "perPersonDay" | "perPerson" | "perNPersons";

export type CategoryStd = {
  key: string;
  label: string;
  /** 必要量を数える単位 */
  unit: string;
  basis: Basis;
  /** basis に応じた原単位。perNPersons のときは「n 人あたり 1」 */
  value: number;
  n?: number;
  /** 発災時の枯渇インパクト（対策本部ビューの優先度） */
  critical: 1 | 2 | 3;
  note?: string;
};

export type Standard = {
  id: string;
  name: string;
  source: string;
  days: number;
  lines: CategoryStd[];
};

const TOKYO_LINES: CategoryStd[] = [
  { key: "water", label: "飲料水", unit: "L", basis: "perPersonDay", value: 3, critical: 3, note: "条例基準 1人1日3L" },
  { key: "food", label: "食料", unit: "食", basis: "perPersonDay", value: 3, critical: 3, note: "条例基準 1人1日3食" },
  { key: "toilet", label: "簡易トイレ", unit: "回", basis: "perPersonDay", value: 5, critical: 3, note: "1人1日5回" },
  { key: "blanket", label: "毛布・保温", unit: "枚", basis: "perPerson", value: 1, critical: 2, note: "条例基準 1人1枚" },
  { key: "hygiene", label: "衛生用品", unit: "セット", basis: "perPersonDay", value: 1, critical: 2 },
  { key: "light", label: "照明・電源", unit: "台", basis: "perNPersons", value: 1, n: 20, critical: 2 },
  { key: "medical", label: "医療・救急", unit: "式", basis: "perNPersons", value: 1, n: 50, critical: 1 },
  { key: "helmet", label: "ヘルメット", unit: "個", basis: "perPerson", value: 1, critical: 1 },
];

export const STANDARDS: Standard[] = [
  { id: "tokyo3", name: "東京都 帰宅困難者対策条例（3日分）", source: "東京都帰宅困難者対策条例／同ハンドブック", days: 3, lines: TOKYO_LINES },
  {
    id: "cao7",
    name: "内閣府ガイドライン準拠（7日分・強化案）",
    source: "内閣府 事業継続ガイドライン等を踏まえた自社強化基準",
    days: 7,
    lines: TOKYO_LINES.map((l) => (l.key === "toilet" ? { ...l, value: 6 } : l)),
  },
  {
    id: "own",
    name: "自社基準（4日分・トイレ強化）",
    source: "社内BCP規程 第4章",
    days: 4,
    lines: TOKYO_LINES.map((l) => (l.key === "toilet" ? { ...l, value: 7 } : l)),
  },
];

/* ---------------- 品目マスタ ---------------- */

export type Item = {
  id: string;
  name: string;
  category: string;
  /** 発注・保管の単位 */
  pack: string;
  /** 1パックが基準単位に換算していくつ分か */
  factor: number;
  shelfLifeYears: number;
  unitCost: number;
  vendor: string;
};

export const ITEMS: Item[] = [
  { id: "W01", name: "保存水 500ml", category: "water", pack: "本", factor: 0.5, shelfLifeYears: 5, unitCost: 95, vendor: "サンライズ防災" },
  { id: "W02", name: "長期保存水 2L", category: "water", pack: "本", factor: 2, shelfLifeYears: 7, unitCost: 285, vendor: "サンライズ防災" },
  { id: "F01", name: "アルファ化米（白飯）", category: "food", pack: "食", factor: 1, shelfLifeYears: 5, unitCost: 280, vendor: "サンライズ防災" },
  { id: "F02", name: "パンの缶詰", category: "food", pack: "缶", factor: 1, shelfLifeYears: 5, unitCost: 380, vendor: "コーワ商事" },
  { id: "F03", name: "レトルト惣菜（常温）", category: "food", pack: "食", factor: 1, shelfLifeYears: 3, unitCost: 330, vendor: "コーワ商事" },
  { id: "F04", name: "栄養補助バー", category: "food", pack: "本", factor: 0.5, shelfLifeYears: 2, unitCost: 150, vendor: "コーワ商事" },
  { id: "T01", name: "簡易トイレ凝固剤セット", category: "toilet", pack: "回分", factor: 1, shelfLifeYears: 15, unitCost: 88, vendor: "日新サニタリー" },
  { id: "T02", name: "組立式簡易便座", category: "toilet", pack: "台", factor: 0, shelfLifeYears: 20, unitCost: 4800, vendor: "日新サニタリー" },
  { id: "B01", name: "アルミブランケット", category: "blanket", pack: "枚", factor: 1, shelfLifeYears: 10, unitCost: 320, vendor: "サンライズ防災" },
  { id: "B02", name: "圧縮毛布", category: "blanket", pack: "枚", factor: 1, shelfLifeYears: 10, unitCost: 1480, vendor: "サンライズ防災" },
  { id: "H01", name: "ウェットタオル（大判）", category: "hygiene", pack: "袋", factor: 1, shelfLifeYears: 5, unitCost: 220, vendor: "日新サニタリー" },
  { id: "H02", name: "不織布マスク（50枚入）", category: "hygiene", pack: "箱", factor: 25, shelfLifeYears: 5, unitCost: 850, vendor: "日新サニタリー" },
  { id: "L01", name: "LEDランタン（乾電池式）", category: "light", pack: "台", factor: 1, shelfLifeYears: 10, unitCost: 2400, vendor: "テクノライト" },
  { id: "L02", name: "アルカリ乾電池 単三（20本）", category: "light", pack: "パック", factor: 0, shelfLifeYears: 10, unitCost: 1200, vendor: "テクノライト" },
  { id: "L03", name: "ポータブル電源 700Wh", category: "light", pack: "台", factor: 0, shelfLifeYears: 8, unitCost: 78000, vendor: "テクノライト" },
  { id: "M01", name: "救急セット（法定準拠）", category: "medical", pack: "式", factor: 1, shelfLifeYears: 5, unitCost: 4800, vendor: "日新サニタリー" },
  { id: "K01", name: "防災ヘルメット（折畳）", category: "helmet", pack: "個", factor: 1, shelfLifeYears: 5, unitCost: 2200, vendor: "サンライズ防災" },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id)!;
export const categoryOf = (key: string) => TOKYO_LINES.find((l) => l.key === key)!;

/* ---------------- ロット台帳 ---------------- */

export type LotStatus = "in_stock" | "disposed" | "drill_used" | "donated";

export type Lot = {
  id: string;
  siteId: string;
  itemId: string;
  location: string;
  qty: number;
  unitCost: number;
  purchasedAt: string; // YYYY-MM-DD
  expiresAt: string | null;
  status: LotStatus;
  po: string;
};

/* 決定論的な擬似乱数（表示が毎回変わらないように） */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20260910);

/** 拠点ごとの「くせ」— デモのストーリーを作るためのプロファイル */
const SITE_PROFILE: Record<
  string,
  { book: Record<string, number>; expiredShare: number; label: string }
> = {
  // 帳簿上は潤沢。ただし2022年の一括購入分が2027年に一斉満了する
  hq: { book: { water: 1.12, food: 1.05, toilet: 0.94, blanket: 1.0, hygiene: 0.9, light: 1.1, medical: 1.0, helmet: 1.02 }, expiredShare: 0.06, label: "更新の山あり" },
  yok: { book: { water: 1.0, food: 1.02, toilet: 1.05, blanket: 0.98, hygiene: 1.0, light: 1.0, medical: 1.2, helmet: 1.0 }, expiredShare: 0.04, label: "良好" },
  // トイレが慢性的に不足
  ngy: { book: { water: 0.98, food: 0.95, toilet: 0.42, blanket: 0.88, hygiene: 0.7, light: 0.8, medical: 1.0, helmet: 0.93 }, expiredShare: 0.08, label: "トイレ不足" },
  // 帳簿は足りているが期限切れが山積み（実効充足率が崩れる）
  osk: { book: { water: 1.04, food: 0.99, toilet: 1.0, blanket: 0.95, hygiene: 0.95, light: 0.9, medical: 1.0, helmet: 0.9 }, expiredShare: 0.55, label: "期限切れ多数" },
  // 全般的に不足
  sdi: { book: { water: 0.62, food: 0.7, toilet: 0.55, blanket: 0.8, hygiene: 0.6, light: 0.6, medical: 1.0, helmet: 0.84 }, expiredShare: 0.1, label: "全般不足" },
};

const LOCATIONS: Record<string, string[]> = {
  hq: ["B1F 防災倉庫 R-01", "B1F 防災倉庫 R-02", "8F 備蓄庫", "15F 備蓄庫"],
  yok: ["1F 資材倉庫 A-3", "3F 備蓄棚"],
  ngy: ["8F 倉庫", "8F 倉庫（棚下）"],
  osk: ["12F 書庫兼倉庫", "12F 廊下ラック"],
  sdi: ["5F ロッカー室"],
};

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addYears(d: Date, y: number) {
  const n = new Date(d);
  n.setFullYear(n.getFullYear() + y);
  return n;
}
function addDays(d: Date, days: number) {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

function buildLots(): Lot[] {
  const lots: Lot[] = [];
  let seq = 1;

  for (const site of SITES) {
    const prof = SITE_PROFILE[site.id];
    const persons = Math.round(site.headcount * site.visitorFactor);

    for (const line of TOKYO_LINES) {
      const items = ITEMS.filter((i) => i.category === line.key && i.factor > 0);
      if (items.length === 0) continue;

      // 3日基準での必要量
      const required =
        line.basis === "perPersonDay"
          ? persons * line.value * 3
          : line.basis === "perPerson"
            ? persons * line.value
            : Math.ceil(persons / (line.n ?? 1)) * line.value;

      const target = required * (prof.book[line.key] ?? 1);

      // 品目間の配分
      const weights = items.map(() => 0.4 + rnd());
      const wsum = weights.reduce((a, b) => a + b, 0);

      items.forEach((item, idx) => {
        const share = (weights[idx] / wsum) * target;
        const totalPacks = Math.max(1, Math.round(share / item.factor));
        // 購入時期の違いを表現してロット分割（少量品は分割しない）
        const nLots = totalPacks < 10 ? 1 : totalPacks < 40 ? 2 : 3 + Math.floor(rnd() * 2);
        for (let k = 0; k < nLots; k++) {
          const qty = Math.max(1, Math.round(totalPacks / nLots));
          if (qty <= 0) continue;

          // 各品目につき最低1ロットは有効なものを残す（実効ゼロの不自然さを避ける）
          const expired = k > 0 && rnd() < prof.expiredShare;
          let expires: Date;
          if (expired) {
            expires = addDays(TODAY, -Math.round(30 + rnd() * 900));
          } else {
            // 東京本社は2027年に山を作る
            if (site.id === "hq" && rnd() < 0.45) {
              expires = new Date(2027, Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 27));
            } else {
              expires = addDays(TODAY, Math.round(20 + rnd() * item.shelfLifeYears * 330));
            }
          }
          const purchased = addYears(expires, -item.shelfLifeYears);
          const inflation = 0.92 + rnd() * 0.2;

          lots.push({
            id: `L${String(seq).padStart(4, "0")}`,
            siteId: site.id,
            itemId: item.id,
            location: LOCATIONS[site.id][Math.floor(rnd() * LOCATIONS[site.id].length)],
            qty,
            unitCost: Math.round(item.unitCost * inflation),
            purchasedAt: fmt(purchased),
            expiresAt: fmt(expires),
            status: "in_stock",
            po: `PO-${purchased.getFullYear()}-${String(1000 + Math.floor(rnd() * 8999))}`,
          });
          seq++;
        }
      });
    }

    // 期限のない資機材（便座・乾電池・ポータブル電源）
    for (const id of ["T02", "L02", "L03"]) {
      const item = itemById(id);
      const qty =
        id === "T02" ? Math.max(1, Math.round(persons / 50)) : id === "L03" ? Math.max(1, Math.round(persons / 90)) : Math.max(2, Math.round(persons / 25));
      const purchased = addDays(TODAY, -Math.round(200 + rnd() * 1400));
      lots.push({
        id: `L${String(seq).padStart(4, "0")}`,
        siteId: site.id,
        itemId: id,
        location: LOCATIONS[site.id][0],
        qty,
        unitCost: item.unitCost,
        purchasedAt: fmt(purchased),
        expiresAt: item.shelfLifeYears >= 15 ? null : fmt(addYears(purchased, item.shelfLifeYears)),
        status: "in_stock",
        po: `PO-${purchased.getFullYear()}-${String(1000 + Math.floor(rnd() * 8999))}`,
      });
      seq++;
    }
  }
  return lots;
}

export const LOTS: Lot[] = buildLots();

/* ---------------- 入出庫履歴 ---------------- */

export type Movement = {
  id: string;
  date: string;
  siteId: string;
  itemId: string;
  qty: number;
  kind: "受入" | "払出" | "廃棄" | "訓練消費" | "寄贈" | "拠点間移送" | "棚卸差異";
  memo: string;
  actor: string;
};

export const MOVEMENTS: Movement[] = [
  { id: "M0012", date: "2026-09-03", siteId: "osk", itemId: "F01", qty: -240, kind: "廃棄", memo: "賞味期限切れ（2026-08-31）のため廃棄処分。産廃伝票 #A-8821", actor: "総務部 大阪", },
  { id: "M0011", date: "2026-08-28", siteId: "hq", itemId: "W01", qty: 1200, kind: "受入", memo: "PO-2026-4471 入庫検収済", actor: "総務部 本社" },
  { id: "M0010", date: "2026-08-20", siteId: "sdi", itemId: "F02", qty: 96, kind: "拠点間移送", memo: "東京本社の期限接近分を仙台へ移送", actor: "総務部 本社" },
  { id: "M0009", date: "2026-08-11", siteId: "sdi", itemId: "W01", qty: -50, kind: "払出", memo: "宮城県沖地震（震度5弱）対応で開封", actor: "仙台営業所" },
  { id: "M0008", date: "2026-07-31", siteId: "yok", itemId: "F01", qty: -180, kind: "訓練消費", memo: "夏季防災訓練で試食配布（ローリングストック）", actor: "横浜総務" },
  { id: "M0007", date: "2026-07-15", siteId: "hq", itemId: "F03", qty: -420, kind: "寄贈", memo: "期限6ヶ月前ルールによりフードバンクへ寄贈", actor: "総務部 本社" },
  { id: "M0006", date: "2026-06-30", siteId: "ngy", itemId: "T01", qty: 300, kind: "受入", memo: "PO-2026-3310 入庫検収済", actor: "名古屋支店" },
  { id: "M0005", date: "2026-06-12", siteId: "osk", itemId: "B01", qty: -8, kind: "棚卸差異", memo: "定期棚卸で数量差異。要因調査中", actor: "総務部 大阪" },
];

/* ---------------- 安否確認 ---------------- */

export type Dispatch = {
  id: string;
  kind: "自動発報" | "手動発報" | "訓練";
  title: string;
  trigger: string;
  sentAt: string;
  targetSites: string[];
  targets: number;
  answered: number;
  status: "対応中" | "完了";
  channels: string[];
};

export const DISPATCHES: Dispatch[] = [
  {
    id: "D2026-014",
    kind: "自動発報",
    title: "首都直下地震（東京都23区 最大震度6強）",
    trigger: "気象庁 震度速報 / しきい値：震度5強以上",
    sentAt: "2026-09-10 11:42",
    targetSites: ["hq", "yok"],
    targets: 278,
    answered: 225,
    status: "対応中",
    channels: ["アプリPush", "メール", "LINE", "SMS"],
  },
  {
    id: "D2026-013",
    kind: "訓練",
    title: "9月 全社一斉防災訓練",
    trigger: "予約送信（2026-09-01 09:00）",
    sentAt: "2026-09-01 09:00",
    targetSites: ["hq", "yok", "ngy", "osk", "sdi"],
    targets: 412,
    answered: 377,
    status: "完了",
    channels: ["アプリPush", "メール"],
  },
  {
    id: "D2026-012",
    kind: "自動発報",
    title: "宮城県沖地震（仙台市青葉区 最大震度5弱）",
    trigger: "気象庁 震度速報 / しきい値：震度5弱以上",
    sentAt: "2026-08-11 04:23",
    targetSites: ["sdi"],
    targets: 25,
    answered: 25,
    status: "完了",
    channels: ["アプリPush", "メール", "SMS"],
  },
  {
    id: "D2026-011",
    kind: "手動発報",
    title: "台風12号 接近に伴う出社可否確認",
    trigger: "危機管理責任者による手動送信",
    sentAt: "2026-07-28 17:00",
    targetSites: ["hq", "yok", "ngy"],
    targets: 323,
    answered: 318,
    status: "完了",
    channels: ["アプリPush", "メール"],
  },
  {
    id: "D2026-010",
    kind: "訓練",
    title: "6月 連絡先到達性チェック",
    trigger: "定期確認（半期に1回）",
    sentAt: "2026-06-02 10:00",
    targetSites: ["hq", "yok", "ngy", "osk", "sdi"],
    targets: 412,
    answered: 391,
    status: "完了",
    channels: ["メール"],
  },
];

/* ---------------- 回答（進行中の発報 D2026-014） ---------------- */

export type SafetyStatus = "無事" | "軽傷" | "重傷" | "未回答";
export type WorkStatus = "出社済・社内" | "出社可" | "在宅対応可" | "対応不可";
export type Place = "社内" | "自宅" | "外出先" | "移動中";

export type Response = {
  id: string;
  name: string;
  siteId: string;
  dept: string;
  safety: SafetyStatus;
  work: WorkStatus;
  place: Place;
  family: "全員無事" | "確認中" | "被害あり";
  home: "被害なし" | "軽微" | "大きい";
  answeredAt: string | null;
  comment?: string;
};

const DEPTS = ["経営企画部", "営業本部", "技術本部", "生産管理部", "総務人事部", "情報システム部", "品質保証部"];
const SURNAMES = ["佐藤", "鈴木", "高橋", "田中", "伊藤", "渡辺", "山本", "中村", "小林", "加藤", "吉田", "山田", "佐々木", "松本", "井上", "木村", "林", "斎藤", "清水", "山口", "森", "池田", "橋本", "石川", "前田", "藤田", "後藤", "岡田", "長谷川", "村上"];
const GIVEN = ["健一", "美咲", "翔太", "由紀", "拓也", "恵理", "大輔", "彩", "直樹", "沙織", "亮", "優子", "誠", "麻衣", "淳", "香織", "隆", "真理", "剛", "千尋"];

function buildResponses(): Response[] {
  const r = mulberry32(777);
  const out: Response[] = [];
  const target = SITES.filter((s) => ["hq", "yok"].includes(s.id));
  let n = 1;
  for (const site of target) {
    for (let i = 0; i < site.headcount; i++) {
      const p = r();
      const answered = p > 0.169; // 全体で約83%
      const q = r();
      const safety: SafetyStatus = !answered ? "未回答" : q > 0.965 ? "重傷" : q > 0.885 ? "軽傷" : "無事";
      const t = r();
      const place: Place = t > 0.35 ? "社内" : t > 0.2 ? "自宅" : t > 0.08 ? "外出先" : "移動中";
      const w = r();
      const work: WorkStatus =
        place === "社内" ? "出社済・社内" : safety === "重傷" ? "対応不可" : w > 0.55 ? "在宅対応可" : w > 0.22 ? "出社可" : "対応不可";
      const f = r();
      const g = r();
      out.push({
        id: `E${String(n).padStart(4, "0")}`,
        name: `${SURNAMES[Math.floor(r() * SURNAMES.length)]} ${GIVEN[Math.floor(r() * GIVEN.length)]}`,
        siteId: site.id,
        dept: DEPTS[Math.floor(r() * DEPTS.length)],
        safety,
        work,
        place,
        family: f > 0.82 ? "確認中" : f > 0.955 ? "被害あり" : "全員無事",
        home: g > 0.9 ? "軽微" : g > 0.975 ? "大きい" : "被害なし",
        answeredAt: answered ? `11:${String(43 + Math.floor(r() * 16)).padStart(2, "0")}` : null,
        comment: q > 0.965 ? "落下物により負傷。救護室で応急処置中。" : undefined,
      });
      n++;
    }
  }
  return out;
}

export const RESPONSES: Response[] = buildResponses();

/* ---------------- 掲示板 ---------------- */

export const BOARD = [
  { at: "12:05", by: "対策本部（総務部長）", text: "東京本社は建物の安全確認が完了。館内待機を継続してください。エレベーターは停止中、階段を使用のこと。" },
  { at: "11:58", by: "施設管理", text: "B1F 防災倉庫を開放しました。水・食料の配給は13:00より15Fホールで実施します。" },
  { at: "11:52", by: "情報システム部", text: "社内ネットワークは非常用電源で稼働中。VPNは利用可能です。" },
  { at: "11:45", by: "対策本部（総務部長）", text: "災害対策本部を設置しました。各部門長は所属メンバーの安否を確認し、未回答者への直接連絡をお願いします。" },
];

/* ---------------- 訓練履歴 ---------------- */

export const DRILLS = [
  { id: "DR-2026-02", date: "2026-09-01", name: "9月 全社一斉防災訓練", targets: 412, rate: 91.5, medianMin: 14, within30: 78.2, note: "初回想定を上回る回答率。大阪支店の未回答率が突出（18%）" },
  { id: "DR-2026-01", date: "2026-06-02", name: "6月 連絡先到達性チェック", targets: 412, rate: 94.9, medianMin: 41, within30: 63.1, note: "メール到達エラー 7件を検出し連絡先を更新" },
  { id: "DR-2025-04", date: "2025-11-05", name: "11月 全国一斉訓練（津波想定）", targets: 398, rate: 88.4, medianMin: 22, within30: 69.8, note: "夜間想定のため回答が翌朝に集中" },
  { id: "DR-2025-03", date: "2025-09-01", name: "9月 全社一斉防災訓練", targets: 396, rate: 86.1, medianMin: 26, within30: 64.4, note: "—" },
];

/* 訓練の回答率推移（分, 累積%） */
export const DRILL_CURVE = [
  { min: 0, cur: 0, prev: 0 },
  { min: 5, cur: 31, prev: 18 },
  { min: 10, cur: 55, prev: 36 },
  { min: 15, cur: 68, prev: 48 },
  { min: 30, cur: 78, prev: 64 },
  { min: 60, cur: 85, prev: 74 },
  { min: 180, cur: 89, prev: 81 },
  { min: 1440, cur: 91.5, prev: 86.1 },
];
