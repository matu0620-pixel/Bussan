"use client";

import { useMemo, useState } from "react";
import { PageHead } from "@/components/Shell";
import { Badge, Card, Empty, Td, Th } from "@/components/ui";
import { BAND_META, daysUntil, expiryBand, yen, yenMan, type ExpiryBand } from "@/lib/calc";
import { ITEMS, LOTS, SITES, STANDARDS, itemById, siteById } from "@/lib/data";

const CATS = STANDARDS[0].lines;

export default function StockPage() {
  const [site, setSite] = useState("all");
  const [cat, setCat] = useState("all");
  const [band, setBand] = useState<"all" | ExpiryBand>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"expiry" | "value" | "qty">("expiry");
  const [selected, setSelected] = useState<string | null>(null);

  const rows = useMemo(() => {
    let r = LOTS.filter((l) => l.status === "in_stock");
    if (site !== "all") r = r.filter((l) => l.siteId === site);
    if (cat !== "all") r = r.filter((l) => itemById(l.itemId).category === cat);
    if (band !== "all") r = r.filter((l) => expiryBand(l) === band);
    if (q.trim()) {
      const k = q.trim().toLowerCase();
      r = r.filter(
        (l) =>
          itemById(l.itemId).name.toLowerCase().includes(k) ||
          l.id.toLowerCase().includes(k) ||
          l.po.toLowerCase().includes(k) ||
          l.location.toLowerCase().includes(k),
      );
    }
    return r.slice().sort((a, b) => {
      if (sort === "value") return b.qty * b.unitCost - a.qty * a.unitCost;
      if (sort === "qty") return b.qty - a.qty;
      const da = daysUntil(a.expiresAt);
      const db = daysUntil(b.expiresAt);
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
  }, [site, cat, band, q, sort]);

  const value = rows.reduce((a, l) => a + l.qty * l.unitCost, 0);
  const counts = (b: ExpiryBand) => LOTS.filter((l) => l.status === "in_stock" && expiryBand(l) === b).length;
  const lot = selected ? LOTS.find((l) => l.id === selected)! : null;

  return (
    <>
      <PageHead
        title="備蓄ロット台帳"
        desc="品目 × 拠点 × 保管場所 × ロット（期限・数量・取得単価・発注番号）で管理します。リース資産台帳と同じ粒度で、1つひとつの「満了日」を持たせるのが要です。"
        right={
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50">
              CSV出力
            </button>
            <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-slate-800">
              QR棚卸を開始
            </button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(["expired", "d90", "d365", "ok", "none"] as ExpiryBand[]).map((b) => (
          <button
            key={b}
            onClick={() => setBand(band === b ? "all" : b)}
            className={`rounded-xl border px-3 py-2.5 text-left transition ${
              band === b ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-80">
              <span className={`h-1.5 w-1.5 rounded-full ${BAND_META[b].dot}`} />
              {BAND_META[b].label}
            </div>
            <div className="num mt-0.5 text-lg font-semibold">{counts(b)}</div>
          </button>
        ))}
      </div>

      <Card
        title={`ロット一覧（${rows.length}件）`}
        right={<span>取得額合計 <b className="num text-slate-800">{yenMan(value)}</b></span>}
        desc="行をクリックすると明細と推奨アクションが開きます。"
      >
        <div className="mb-3 flex flex-wrap gap-2">
          <select value={site} onChange={(e) => setSite(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px]">
            <option value="all">全拠点</option>
            {SITES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px]">
            <option value="all">全カテゴリ</option>
            {CATS.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px]">
            <option value="expiry">期限が近い順</option>
            <option value="value">取得額が大きい順</option>
            <option value="qty">数量が多い順</option>
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="品目名・ロットID・発注番号・保管場所で検索"
            className="min-w-[220px] flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px]"
          />
          {(site !== "all" || cat !== "all" || band !== "all" || q) && (
            <button
              onClick={() => { setSite("all"); setCat("all"); setBand("all"); setQ(""); }}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[12px] text-slate-600 hover:bg-slate-50"
            >
              条件クリア
            </button>
          )}
        </div>

        <div className="max-h-[560px] overflow-auto rounded-lg border border-slate-100">
          <table className="w-full min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr>
                <Th>ロット</Th>
                <Th>品目</Th>
                <Th>拠点 / 保管場所</Th>
                <Th align="right">数量</Th>
                <Th align="right">取得単価</Th>
                <Th align="right">取得額</Th>
                <Th>取得日</Th>
                <Th>満了日</Th>
                <Th align="right">残日数</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const item = itemById(l.itemId);
                const b = expiryBand(l);
                const d = daysUntil(l.expiresAt);
                return (
                  <tr
                    key={l.id}
                    onClick={() => setSelected(l.id === selected ? null : l.id)}
                    className={`cursor-pointer ${selected === l.id ? "bg-sky-50" : "hover:bg-slate-50"}`}
                  >
                    <Td className="num text-slate-400">{l.id}</Td>
                    <Td>
                      <span className="font-medium text-slate-900">{item.name}</span>
                      <div className="text-[10.5px] text-slate-400">{item.id}・{CATS.find((c) => c.key === item.category)?.label}</div>
                    </Td>
                    <Td>
                      {siteById(l.siteId).short}
                      <span className="text-[11px] text-slate-400"> / {l.location}</span>
                    </Td>
                    <Td align="right">
                      {l.qty.toLocaleString()}
                      <span className="text-[10px] text-slate-400"> {item.pack}</span>
                    </Td>
                    <Td align="right" className="text-slate-500">{yen(l.unitCost)}</Td>
                    <Td align="right">{yen(l.qty * l.unitCost)}</Td>
                    <Td className="num text-slate-500">{l.purchasedAt}</Td>
                    <Td className="num">
                      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ring-1 ring-inset ${BAND_META[b].cls}`}>
                        {l.expiresAt ?? "—"}
                      </span>
                    </Td>
                    <Td align="right" className={d === null ? "text-slate-300" : d < 0 ? "font-semibold text-rose-600" : d <= 90 ? "font-semibold text-amber-600" : "text-slate-500"}>
                      {d === null ? "—" : d < 0 ? `${-d}日超過` : `${d}日`}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <Empty>条件に一致するロットがありません。</Empty>}
        </div>

        {lot && (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[13.5px] font-semibold text-slate-900">{itemById(lot.itemId).name}</h3>
                  <Badge tone="sky">{lot.id}</Badge>
                  <Badge tone={expiryBand(lot) === "expired" ? "rose" : expiryBand(lot) === "d90" ? "amber" : "green"}>
                    {BAND_META[expiryBand(lot)].label}
                  </Badge>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1.5 text-[12px] sm:grid-cols-4">
                  {[
                    ["拠点", siteById(lot.siteId).name],
                    ["保管場所", lot.location],
                    ["数量", `${lot.qty.toLocaleString()} ${itemById(lot.itemId).pack}`],
                    ["仕入先", itemById(lot.itemId).vendor],
                    ["発注番号", lot.po],
                    ["取得日", lot.purchasedAt],
                    ["満了日", lot.expiresAt ?? "期限なし"],
                    ["取得額", yen(lot.qty * lot.unitCost)],
                    ["保存年数", `${itemById(lot.itemId).shelfLifeYears} 年`],
                    ["年間換算コスト", yen((lot.qty * lot.unitCost) / itemById(lot.itemId).shelfLifeYears)],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[10.5px] text-slate-500">{k}</dt>
                      <dd className="num font-medium text-slate-800">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="mt-4 border-t border-sky-200 pt-3">
              <div className="mb-2 text-[11.5px] font-semibold text-slate-700">推奨アクション</div>
              <div className="flex flex-wrap gap-2">
                {(expiryBand(lot) === "expired"
                  ? ["廃棄を起票", "同等品を再調達（相見積）", "差異を棚卸に反映"]
                  : expiryBand(lot) === "d90"
                    ? ["更新見積を依頼", "訓練で消費（ローリングストック）", "フードバンクへ寄贈", "余剰拠点へ移送"]
                    : ["拠点間で移送", "更新予定に登録"]
                ).map((a) => (
                  <button key={a} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-50">
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="品目マスタ" desc="標準保存年数と単価が、年間換算コストと更新計画の元になります。">
          <div className="max-h-[320px] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr>
                  <Th>品目</Th>
                  <Th>カテゴリ</Th>
                  <Th align="right">換算</Th>
                  <Th align="right">保存年数</Th>
                  <Th align="right">単価</Th>
                </tr>
              </thead>
              <tbody>
                {ITEMS.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <Td>
                      <span className="font-medium text-slate-800">{i.name}</span>
                      <div className="text-[10.5px] text-slate-400">{i.vendor}</div>
                    </Td>
                    <Td className="text-slate-500">{CATS.find((c) => c.key === i.category)?.label}</Td>
                    <Td align="right" className="text-slate-500">
                      {i.factor > 0 ? `1${i.pack} = ${i.factor}${CATS.find((c) => c.key === i.category)?.unit}` : "資機材"}
                    </Td>
                    <Td align="right">{i.shelfLifeYears}年</Td>
                    <Td align="right">{yen(i.unitCost)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="現物棚卸（QRモード）" desc="スマートフォンで棚のQRを読み、数量と期限をその場で照合します。">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between text-[12px]">
              <span className="font-medium text-slate-700">2026年度 上期棚卸</span>
              <Badge tone="amber">進行中 3/5拠点</Badge>
            </div>
            <ul className="space-y-2">
              {SITES.map((s, i) => {
                const done = i < 3;
                return (
                  <li key={s.id} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-[12px] text-slate-700">{s.name}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                      <div className={`h-1.5 rounded-full ${done ? "bg-emerald-500" : "bg-slate-300"}`} style={{ width: done ? "100%" : "0%" }} />
                    </div>
                    <span className={`num w-24 shrink-0 text-right text-[11px] ${done ? "text-emerald-600" : "text-slate-400"}`}>
                      {done ? `完了 ${["08-14", "08-21", "09-02"][i]}` : "未実施"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-[11.5px] leading-relaxed text-rose-800 ring-1 ring-inset ring-rose-200">
              大阪支店：棚卸で <b>8枚</b> の数量差異を検出（L0xxx アルミブランケット）。原因調査中のため台帳から控除済みです。
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
