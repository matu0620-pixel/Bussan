import {
  ITEMS,
  LOTS,
  RESPONSES,
  SITES,
  STANDARDS,
  TODAY,
  itemById,
  siteById,
  type CategoryStd,
  type Lot,
  type Standard,
} from "./data";

export const yen = (n: number) =>
  "¥" + Math.round(n).toLocaleString("ja-JP");

export const yenMan = (n: number) =>
  (n / 10000).toLocaleString("ja-JP", { maximumFractionDigits: 0 }) + "万円";

export const pct = (n: number, d = 0) =>
  (n * 100).toLocaleString("ja-JP", { maximumFractionDigits: d }) + "%";

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00+09:00");
  return Math.round((d.getTime() - TODAY.getTime()) / 86400000);
}

export type ExpiryBand = "expired" | "d90" | "d365" | "ok" | "none";

export function expiryBand(lot: Lot): ExpiryBand {
  const d = daysUntil(lot.expiresAt);
  if (d === null) return "none";
  if (d < 0) return "expired";
  if (d <= 90) return "d90";
  if (d <= 365) return "d365";
  return "ok";
}

export const BAND_META: Record<ExpiryBand, { label: string; cls: string; dot: string }> = {
  expired: { label: "期限切れ", cls: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
  d90: { label: "90日以内", cls: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  d365: { label: "1年以内", cls: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  ok: { label: "期限内", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  none: { label: "期限なし", cls: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400" },
};

/* ───────── 充足率エンジン ───────── */

export function requiredQty(line: CategoryStd, persons: number, days: number) {
  if (line.basis === "perPersonDay") return persons * line.value * days;
  if (line.basis === "perPerson") return persons * line.value;
  return Math.ceil(persons / (line.n ?? 1)) * line.value;
}

export function personsAt(siteId: string) {
  const s = siteById(siteId);
  return Math.round(s.headcount * s.visitorFactor);
}

export type CoverageCell = {
  siteId: string;
  line: CategoryStd;
  required: number;
  book: number; // 帳簿在庫（期限切れ含む）
  effective: number; // 実効在庫（期限内のみ）
  bookRatio: number;
  ratio: number; // 実効充足率
  shortfall: number; // 実効ベースの不足量
  refillCost: number;
};

export function coverage(standard: Standard, siteIds?: string[]): CoverageCell[] {
  const sites = siteIds ?? SITES.map((s) => s.id);
  const cells: CoverageCell[] = [];
  for (const siteId of sites) {
    const persons = personsAt(siteId);
    for (const line of standard.lines) {
      const required = requiredQty(line, persons, standard.days);
      let book = 0;
      let effective = 0;
      for (const lot of LOTS) {
        if (lot.siteId !== siteId || lot.status !== "in_stock") continue;
        const item = itemById(lot.itemId);
        if (item.category !== line.key || item.factor === 0) continue;
        const amount = lot.qty * item.factor;
        book += amount;
        if (expiryBand(lot) !== "expired") effective += amount;
      }
      const shortfall = Math.max(0, required - effective);
      // 補充単価はそのカテゴリの主力品目の単価から換算
      const main = ITEMS.filter((i) => i.category === line.key && i.factor > 0).sort(
        (a, b) => a.unitCost / a.factor - b.unitCost / b.factor,
      )[0];
      cells.push({
        siteId,
        line,
        required,
        book,
        effective,
        bookRatio: required ? book / required : 1,
        ratio: required ? effective / required : 1,
        shortfall,
        refillCost: main ? (shortfall / main.factor) * main.unitCost : 0,
      });
    }
  }
  return cells;
}

export function siteCoverageScore(cells: CoverageCell[], siteId: string) {
  const rows = cells.filter((c) => c.siteId === siteId);
  if (!rows.length) return 1;
  // 最も弱い品目に引きずられるのが備蓄の実態 → 加重平均ではなく「重要度加重の調和的評価」
  const weighted = rows.map((r) => Math.min(1, r.ratio) * r.line.critical);
  const w = rows.reduce((a, r) => a + r.line.critical, 0);
  return weighted.reduce((a, b) => a + b, 0) / w;
}

export function bottleneck(cells: CoverageCell[], siteId: string) {
  const rows = cells.filter((c) => c.siteId === siteId);
  return rows.slice().sort((a, b) => a.ratio - b.ratio)[0];
}

/* ───────── コスト / 更新計画 ───────── */

/** 年間換算コスト（＝「防災原価」）: 取得額 ÷ 保存年数 */
export function annualizedCost(siteId?: string) {
  let total = 0;
  for (const lot of LOTS) {
    if (lot.status !== "in_stock") continue;
    if (siteId && lot.siteId !== siteId) continue;
    const item = itemById(lot.itemId);
    const years = Math.max(1, item.shelfLifeYears);
    total += (lot.qty * lot.unitCost) / years;
  }
  return total;
}

export function bookValue(siteId?: string) {
  let total = 0;
  for (const lot of LOTS) {
    if (lot.status !== "in_stock") continue;
    if (siteId && lot.siteId !== siteId) continue;
    total += lot.qty * lot.unitCost;
  }
  return total;
}

export function expiredValue(siteId?: string) {
  let total = 0;
  for (const lot of LOTS) {
    if (lot.status !== "in_stock") continue;
    if (siteId && lot.siteId !== siteId) continue;
    if (expiryBand(lot) === "expired") total += lot.qty * lot.unitCost;
  }
  return total;
}

export type MonthBucket = { key: string; year: number; month: number; cost: number; lots: number; qty: number };

/** 今月から months ヶ月ぶんの満了スケジュール */
export function renewalTimeline(months = 36, siteId?: string): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const base = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  for (let i = 0; i < months; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      cost: 0,
      lots: 0,
      qty: 0,
    });
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const lot of LOTS) {
    if (lot.status !== "in_stock" || !lot.expiresAt) continue;
    if (siteId && lot.siteId !== siteId) continue;
    const d = new Date(lot.expiresAt + "T00:00:00+09:00");
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const idx = index.get(key);
    if (idx === undefined) continue;
    const item = itemById(lot.itemId);
    buckets[idx].cost += lot.qty * item.unitCost; // 再調達は現行単価で
    buckets[idx].lots += 1;
    buckets[idx].qty += lot.qty;
  }
  return buckets;
}

/** 年度（4月始まり）別の更新必要額 */
export function fiscalRenewal(months = 60, siteId?: string) {
  const t = renewalTimeline(months, siteId);
  const map = new Map<number, number>();
  for (const b of t) {
    const fy = b.month >= 4 ? b.year : b.year - 1;
    map.set(fy, (map.get(fy) ?? 0) + b.cost);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([fy, cost]) => ({ fy, cost }));
}

/* ───────── 対策本部：残存日数 ───────── */

export type SurvivalRow = {
  line: CategoryStd;
  perDay: number;
  stock: number;
  days: number | null; // perPerson系は null
  coveredPersons: number | null;
};

/** 発災時の拠点滞留人数（回答実績 + 未回答者の按分推計） */
export function stayingAt(siteId: string) {
  const rows = RESPONSES.filter((r) => r.siteId === siteId);
  const answered = rows.filter((r) => r.safety !== "未回答");
  const onSite = answered.filter((r) => r.place === "社内").length;
  const unanswered = rows.length - answered.length;
  const onSiteRate = answered.length ? onSite / answered.length : 0;
  const estimated = Math.round(unanswered * onSiteRate);
  const visitors = Math.round(siteById(siteId).headcount * (siteById(siteId).visitorFactor - 1));
  return { confirmed: onSite, estimated, visitors, total: onSite + estimated + visitors, unanswered };
}

export function survival(siteId: string, persons: number, standardId = "tokyo3"): SurvivalRow[] {
  const std = STANDARDS.find((s) => s.id === standardId)!;
  const out: SurvivalRow[] = [];
  for (const line of std.lines) {
    let stock = 0;
    for (const lot of LOTS) {
      if (lot.siteId !== siteId || lot.status !== "in_stock") continue;
      const item = itemById(lot.itemId);
      if (item.category !== line.key || item.factor === 0) continue;
      if (expiryBand(lot) === "expired") continue;
      stock += lot.qty * item.factor;
    }
    if (line.basis === "perPersonDay") {
      const perDay = persons * line.value;
      out.push({ line, perDay, stock, days: perDay ? stock / perDay : null, coveredPersons: null });
    } else if (line.basis === "perPerson") {
      out.push({ line, perDay: 0, stock, days: null, coveredPersons: Math.floor(stock / line.value) });
    } else {
      out.push({ line, perDay: 0, stock, days: null, coveredPersons: Math.floor(stock * (line.n ?? 1)) });
    }
  }
  return out;
}

/* ───────── 集計ヘルパー ───────── */

export function tally<T, K extends string>(rows: T[], key: (r: T) => K): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const r of rows) {
    const k = key(r);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}
