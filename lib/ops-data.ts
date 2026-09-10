// ─────────────────────────────────────────────────────────────
// SONAE OPS — 事業者（防災用品卸）側のデモ用ダミーデータ
// 顧客側データ（lib/data.ts）を横断して、卸の需要・在庫・受注・契約を表現する。
// すべて架空の卸会社「みなと防災サプライ株式会社」の想定データです。
// ─────────────────────────────────────────────────────────────

import { ITEMS, TODAY, itemById } from "./data";

export const OPERATOR = {
  name: "みなと防災サプライ株式会社",
  short: "みなと防災",
  /** 売切り販売時の仕入原価率 */
  cogsRate: 0.7,
  /** 預託サブスクの標準単価（円 / 人・月） */
  subMonthly: 280,
  /** 引取り・廃棄代行の基本料（円 / 回） */
  pickupBase: 25000,
  /** 保存年数 5年・3日分の1人あたり標準売価（円） */
  kitPricePerHead: 10630,
};

/* ---------------- 倉庫 ---------------- */

export const DCS = [
  { id: "dc-e", name: "東日本DC（三郷）", pref: "埼玉県", covers: ["北海道・東北", "関東", "甲信越"] },
  { id: "dc-w", name: "西日本DC（茨木）", pref: "大阪府", covers: ["東海", "近畿", "中国・四国"] },
  { id: "dc-k", name: "九州DC（鳥栖）", pref: "佐賀県", covers: ["九州・沖縄"] },
];

/* ---------------- 顧客 ---------------- */

export type ContractType = "売切り" | "預託サブスク";

export type Customer = {
  id: string;
  name: string;
  industry: string;
  pref: string;
  dc: string;
  headcount: number;
  sites: number;
  contract: ContractType;
  since: string;
  /** 預託サブスクの単価（円 / 人・月） */
  perHead: number | null;
  /** 優先供給契約の有無 */
  priority: boolean;
  owner: string;
  status: "稼働" | "更新期近" | "商談中";
};

function m32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES: [string, string, string, string][] = [
  ["ミナトテック", "電子部品製造", "東京都", "dc-e"],
  ["城東フーズ", "食品加工", "埼玉県", "dc-e"],
  ["北信越建設", "総合建設", "新潟県", "dc-e"],
  ["セイワ物流", "運輸倉庫", "千葉県", "dc-e"],
  ["三田会計事務所グループ", "士業", "東京都", "dc-e"],
  ["トウホク精機", "産業機械", "宮城県", "dc-e"],
  ["湘南メディカル", "医療機器卸", "神奈川県", "dc-e"],
  ["日本橋アセット", "不動産管理", "東京都", "dc-e"],
  ["赤羽メタル", "金属加工", "東京都", "dc-e"],
  ["常磐エナジー", "エネルギー", "茨城県", "dc-e"],
  ["ナニワ化成", "化学", "大阪府", "dc-w"],
  ["近畿システムズ", "情報通信", "大阪府", "dc-w"],
  ["東海オートパーツ", "自動車部品", "愛知県", "dc-w"],
  ["瀬戸内マリン", "造船関連", "広島県", "dc-w"],
  ["京都繊維工業", "繊維", "京都府", "dc-w"],
  ["浪速リテール", "小売チェーン", "大阪府", "dc-w"],
  ["中部プレシジョン", "精密機器", "岐阜県", "dc-w"],
  ["神戸トレーディング", "商社", "兵庫県", "dc-w"],
  ["四国電子", "電子機器", "香川県", "dc-w"],
  ["博多ロジスティクス", "運輸倉庫", "福岡県", "dc-k"],
  ["筑後製薬", "医薬品", "福岡県", "dc-k"],
  ["南九州アグリ", "農業法人", "鹿児島県", "dc-k"],
  ["長崎マリンサービス", "海運", "長崎県", "dc-k"],
  ["沖縄リゾート開発", "観光", "沖縄県", "dc-k"],
];

const OWNERS = ["営業1課 東", "営業1課 南", "営業2課 西", "営業2課 北", "西日本支店"];

function buildCustomers(): Customer[] {
  const r = m32(4242);
  return NAMES.map((n, i) => {
    const headcount = i === 0 ? 412 : Math.round(80 + r() * 620);
    const sub = r() < 0.38;
    const p = r();
    return {
      id: `C${String(i + 1).padStart(3, "0")}`,
      name: `株式会社${n[0]}`,
      industry: n[1],
      pref: n[2],
      dc: n[3],
      headcount,
      sites: Math.max(1, Math.round(headcount / 110) + (r() < 0.4 ? 1 : 0)),
      contract: sub ? "預託サブスク" : "売切り",
      since: `${2019 + Math.floor(r() * 7)}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}`,
      perHead: sub ? [250, 260, 280, 280, 300, 320][Math.floor(r() * 6)] : null,
      priority: sub ? r() < 0.72 : r() < 0.18,
      owner: OWNERS[Math.floor(r() * OWNERS.length)],
      status: p > 0.93 ? "商談中" : p > 0.78 ? "更新期近" : "稼働",
    };
  });
}

export const CUSTOMERS: Customer[] = buildCustomers();
export const customerById = (id: string) => CUSTOMERS.find((c) => c.id === id)!;

/* ---------------- 顧客側の満了予定（＝卸から見た確定受注見込み） ---------------- */

export type DemandLot = {
  id: string;
  customerId: string;
  itemId: string;
  qty: number;
  expiresAt: string;
};

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** 1人あたりの標準数量（3日分・条例基準を荷姿に落としたもの） */
const KIT: Record<string, number> = {
  W01: 6, // 保存水500ml（3L/日×3日のうち一部）
  W02: 3, // 長期保存水2L
  F01: 4, // アルファ化米
  F02: 3, // パンの缶詰
  F03: 2, // レトルト惣菜
  T01: 15, // 簡易トイレ
  B01: 0.6,
  B02: 0.4,
  H01: 3,
  H02: 0.12,
  L01: 0.05,
  M01: 0.02,
  K01: 1,
};

function buildDemand(): DemandLot[] {
  const r = m32(9001);
  const out: DemandLot[] = [];
  let seq = 1;
  for (const c of CUSTOMERS) {
    if (c.status === "商談中") continue;
    for (const [itemId, per] of Object.entries(KIT)) {
      const item = itemById(itemId);
      const total = Math.max(1, Math.round(c.headcount * per * (0.85 + r() * 0.3)));
      // 保存年数ぶんに分散して満了が来る（ローリング調達の実態）
      const nLots = total < 30 ? 1 : total < 200 ? 2 : 3;
      for (let k = 0; k < nLots; k++) {
        const horizon = item.shelfLifeYears * 365;
        const days = Math.round(-120 + r() * (horizon + 120));
        out.push({
          id: `D${String(seq).padStart(5, "0")}`,
          customerId: c.id,
          itemId,
          qty: Math.max(1, Math.round(total / nLots)),
          expiresAt: fmt(addDays(TODAY, days)),
        });
        seq++;
      }
    }
  }
  return out;
}

export const DEMAND: DemandLot[] = buildDemand();

/* ---------------- 自社（卸）在庫 ---------------- */

export type WhLot = {
  id: string;
  dc: string;
  itemId: string;
  qty: number;
  /** 仕入単価 */
  cost: number;
  expiresAt: string | null;
  /** 引当済み数量 */
  allocated: number;
  maker: string;
};

const MAKERS: Record<string, string> = {
  W01: "サンライズ飲料",
  W02: "サンライズ飲料",
  F01: "尾張食品工業",
  F02: "コーワ製菓",
  F03: "コーワ食品",
  F04: "コーワ食品",
  T01: "日新サニタリー",
  T02: "日新サニタリー",
  B01: "三河テキスタイル",
  B02: "三河テキスタイル",
  H01: "日新サニタリー",
  H02: "日新サニタリー",
  L01: "テクノライト",
  L02: "テクノライト",
  L03: "テクノライト",
  M01: "日新メディカル",
  K01: "泉州安全産業",
};

function buildWhStock(): WhLot[] {
  const r = m32(5150);
  const out: WhLot[] = [];
  let seq = 1;
  for (const dc of DCS) {
    const scale = dc.id === "dc-e" ? 1 : dc.id === "dc-w" ? 0.62 : 0.28;
    for (const item of ITEMS) {
      const nLots = 1 + Math.floor(r() * 3);
      for (let k = 0; k < nLots; k++) {
        const base = (KIT[item.id] ?? 0.1) * 190 * scale;
        const qty = Math.max(4, Math.round((base / nLots) * (0.5 + r())));
        const days = Math.round(item.shelfLifeYears * 365 * (0.06 + r() * 0.88));
        out.push({
          id: `W${String(seq).padStart(4, "0")}`,
          dc: dc.id,
          itemId: item.id,
          qty,
          cost: Math.round(item.unitCost * OPERATOR.cogsRate * (0.94 + r() * 0.12)),
          expiresAt: item.shelfLifeYears >= 15 ? null : fmt(addDays(TODAY, days)),
          allocated: Math.round(qty * r() * 0.55),
          maker: MAKERS[item.id] ?? "—",
        });
        seq++;
      }
    }
  }
  return out;
}

export const WH_STOCK: WhLot[] = buildWhStock();

/* ---------------- 更新受注ワークフロー ---------------- */

export type OrderStage = "アラート" | "見積提示" | "承認待ち" | "出荷準備" | "出荷済" | "失注";

export type Order = {
  id: string;
  customerId: string;
  createdAt: string;
  dueAt: string;
  lines: number;
  amount: number;
  stage: OrderStage;
  auto: boolean;
  lostReason?: string;
};

const LOST = ["他社が下代を提示（△12%）", "今期予算の見送り", "本社一括購買へ移管", "自社倉庫の在庫を先に消化"];

function buildOrders(): Order[] {
  const r = m32(3311);
  const out: Order[] = [];
  const stages: OrderStage[] = ["アラート", "見積提示", "承認待ち", "出荷準備", "出荷済", "失注"];
  const weights = [0.24, 0.17, 0.12, 0.08, 0.27, 0.12];
  let seq = 1;
  for (const c of CUSTOMERS) {
    if (c.status === "商談中") continue;
    const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      let acc = 0;
      const p = r();
      let stage: OrderStage = "アラート";
      for (let i = 0; i < stages.length; i++) {
        acc += weights[i];
        if (p <= acc) {
          stage = stages[i];
          break;
        }
      }
      const amount = Math.round((c.headcount * OPERATOR.kitPricePerHead * (0.06 + r() * 0.26)) / 100) * 100;
      const created = Math.round(-90 + r() * 80);
      out.push({
        id: `O-2026-${String(1000 + seq)}`,
        customerId: c.id,
        createdAt: fmt(addDays(TODAY, created)),
        dueAt: fmt(addDays(TODAY, created + 40 + Math.round(r() * 70))),
        lines: 2 + Math.floor(r() * 7),
        amount,
        stage,
        auto: r() < 0.78,
        lostReason: stage === "失注" ? LOST[Math.floor(r() * LOST.length)] : undefined,
      });
      seq++;
    }
  }
  return out.sort((a, b) => (a.dueAt < b.dueAt ? -1 : 1));
}

export const ORDERS: Order[] = buildOrders();

/* ---------------- 引取り・逆物流 ---------------- */

export type Pickup = {
  id: string;
  customerId: string;
  date: string;
  route: "フードバンク寄贈" | "産業廃棄物" | "訓練配布" | "社内配布";
  qty: number;
  fee: number;
  cert: boolean;
};

function buildPickups(): Pickup[] {
  const r = m32(717);
  const routes: Pickup["route"][] = ["フードバンク寄贈", "産業廃棄物", "訓練配布", "社内配布"];
  return CUSTOMERS.filter(() => r() < 0.55)
    .slice(0, 14)
    .map((c, i) => {
      const route = routes[Math.floor(r() * routes.length)];
      return {
        id: `RL-${String(2001 + i)}`,
        customerId: c.id,
        date: fmt(addDays(TODAY, -Math.round(r() * 150))),
        route,
        qty: Math.round(c.headcount * (1 + r() * 5)),
        fee: OPERATOR.pickupBase + Math.round((c.headcount * (12 + r() * 20)) / 100) * 100,
        cert: route === "フードバンク寄贈",
      };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export const PICKUPS: Pickup[] = buildPickups();

/* ---------------- 集計ヘルパー ---------------- */

export type PipelineBucket = {
  key: string;
  year: number;
  month: number;
  revenue: number;
  cost: number;
  qty: number;
  byCategory: Record<string, number>;
};

/** 顧客の満了予定を月別に集計した「確定受注見込み」 */
export function pipeline(months = 36, filter?: (c: Customer) => boolean): PipelineBucket[] {
  const base = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const buckets: PipelineBucket[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      revenue: 0,
      cost: 0,
      qty: 0,
      byCategory: {},
    });
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]));
  for (const d of DEMAND) {
    const c = customerById(d.customerId);
    if (filter && !filter(c)) continue;
    const dt = new Date(d.expiresAt + "T00:00:00+09:00");
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const i = idx.get(key);
    if (i === undefined) continue;
    const item = itemById(d.itemId);
    const rev = d.qty * item.unitCost;
    buckets[i].revenue += rev;
    buckets[i].cost += rev * OPERATOR.cogsRate;
    buckets[i].qty += d.qty;
    buckets[i].byCategory[item.category] = (buckets[i].byCategory[item.category] ?? 0) + rev;
  }
  return buckets;
}

/** 品目別の満了予定数量（仕入計画の入力） */
export function procurementPlan(months = 12) {
  const base = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const m = new Map<string, { qty: number; revenue: number; customers: Set<string> }>();
  for (const d of DEMAND) {
    const dt = new Date(d.expiresAt + "T00:00:00+09:00");
    if (dt < base || dt >= end) continue;
    const e = m.get(d.itemId) ?? { qty: 0, revenue: 0, customers: new Set<string>() };
    e.qty += d.qty;
    e.revenue += d.qty * itemById(d.itemId).unitCost;
    e.customers.add(d.customerId);
    m.set(d.itemId, e);
  }
  return [...m.entries()]
    .map(([itemId, v]) => ({ itemId, qty: v.qty, revenue: v.revenue, customers: v.customers.size }))
    .sort((a, b) => b.revenue - a.revenue);
}

/** 月次経常収益（預託サブスク分） */
export function mrr() {
  return CUSTOMERS.filter((c) => c.contract === "預託サブスク" && c.status !== "商談中").reduce(
    (a, c) => a + c.headcount * (c.perHead ?? 0),
    0,
  );
}

/** 顧客拠点に置いてある預託在庫の簿価（卸の資産） */
export function consignedAssets() {
  return CUSTOMERS.filter((c) => c.contract === "預託サブスク" && c.status !== "商談中").reduce(
    (a, c) => a + c.headcount * OPERATOR.kitPricePerHead * OPERATOR.cogsRate,
    0,
  );
}

export function daysTo(dateStr: string | null) {
  if (!dateStr) return null;
  return Math.round((new Date(dateStr + "T00:00:00+09:00").getTime() - TODAY.getTime()) / 86400000);
}
