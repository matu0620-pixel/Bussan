"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHead } from "@/components/Shell";
import { Badge, Card, DemoNote, Td, Th } from "@/components/ui";
import { pct, yen, yenMan } from "@/lib/calc";
import { itemById } from "@/lib/data";
import {
  CUSTOMERS,
  DEMAND,
  OPERATOR,
  ORDERS,
  consignedAssets,
  customerById,
  daysTo,
  mrr,
  pipeline,
} from "@/lib/ops-data";

const CAT_LABEL: Record<string, string> = {
  water: "飲料水", food: "食料", toilet: "簡易トイレ", blanket: "毛布・保温",
  hygiene: "衛生用品", light: "照明・電源", medical: "医療・救急", helmet: "ヘルメット",
};
const CAT_COLOR: Record<string, string> = {
  water: "#0369a1", food: "#15803d", toilet: "#b45309", blanket: "#7e22ce",
  hygiene: "#0d9488", light: "#ca8a04", medical: "#be123c", helmet: "#64748b",
};

export default function OpsDashboard() {
  const [scope, setScope] = useState<"all" | "預託サブスク" | "売切り">("all");

  const filter = useMemo(
    () => (scope === "all" ? undefined : (c: (typeof CUSTOMERS)[number]) => c.contract === scope),
    [scope],
  );
  const p = useMemo(() => pipeline(36, filter), [filter]);

  const active = CUSTOMERS.filter((c) => c.status !== "商談中");
  const heads = active.reduce((a, c) => a + c.headcount, 0);
  const y1 = p.slice(0, 12).reduce((a, b) => a + b.revenue, 0);
  const y1gp = p.slice(0, 12).reduce((a, b) => a + b.revenue - b.cost, 0);
  const total = p.reduce((a, b) => a + b.revenue, 0);
  const max = Math.max(...p.map((b) => b.revenue), 1);

  const won = ORDERS.filter((o) => o.stage === "出荷済").length;
  const closed = ORDERS.filter((o) => o.stage === "出荷済" || o.stage === "失注").length;
  const winRate = closed ? won / closed : 0;
  const openAmount = ORDERS.filter((o) => !["出荷済", "失注"].includes(o.stage)).reduce((a, o) => a + o.amount, 0);

  // 90日以内に満了する顧客ロット（＝いま営業すべき先）
  const hot = useMemo(() => {
    const m = new Map<string, { qty: number; revenue: number; earliest: number }>();
    for (const d of DEMAND) {
      const days = daysTo(d.expiresAt)!;
      if (days < -30 || days > 90) continue;
      const e = m.get(d.customerId) ?? { qty: 0, revenue: 0, earliest: 9999 };
      e.qty += d.qty;
      e.revenue += d.qty * itemById(d.itemId).unitCost;
      e.earliest = Math.min(e.earliest, days);
      m.set(d.customerId, e);
    }
    return [...m.entries()]
      .map(([id, v]) => ({ c: customerById(id), ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, []);

  return (
    <>
      <PageHead
        title="需要パイプライン"
        desc="顧客の備蓄台帳を横断して満了日を集計したもの。予測ではなく、すでに顧客の棚に置かれているロットの期限なので、確度は受注残に近い。仕入計画と営業計画の両方がここから出る。"
        right={
          <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
            {(["all", "預託サブスク", "売切り"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded-md px-2.5 py-1 text-[12px] ${scope === s ? "bg-teal-700 font-medium text-white" : "text-slate-600"}`}
              >
                {s === "all" ? "全顧客" : s}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { l: "可視化された需要（36ヶ月）", v: yenMan(total), s: `${active.length}社・${heads.toLocaleString()}名分の台帳から算出`, t: "text-teal-700" },
          { l: "向こう12ヶ月の売上見込", v: yenMan(y1), s: `粗利 ${yenMan(y1gp)}（${pct(y1gp / y1, 0)}）`, t: "text-slate-900" },
          { l: "月次経常収益（預託）", v: yenMan(mrr()), s: `預託契約 ${CUSTOMERS.filter((c) => c.contract === "預託サブスク" && c.status !== "商談中").length}社`, t: "text-teal-700" },
          { l: "更新受注率", v: pct(winRate, 0), s: `確定 ${closed}件中 ${won}件受注。進行中 ${yenMan(openAmount)}`, t: winRate >= 0.8 ? "text-emerald-600" : "text-amber-600" },
          { l: "預託在庫（自社資産）", v: yenMan(consignedAssets()), s: "顧客拠点に置いてある自社在庫の簿価", t: "text-slate-900" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="text-[11.5px] font-medium text-slate-500">{k.l}</div>
            <div className={`num mt-1 text-2xl font-semibold ${k.t}`}>{k.v}</div>
            <div className="mt-1 text-[11px] leading-snug text-slate-500">{k.s}</div>
          </div>
        ))}
      </div>

      <Card
        title="満了予定（今後36ヶ月・品目カテゴリ別）"
        desc="バーの高さが、その月に顧客の棚で期限が切れる商品の売価合計。ここが自社の受注機会であり、同時に仕入計画の入力になる。"
        right={<span>月平均 <b className="num text-slate-800">{yenMan(total / 36)}</b></span>}
        className="mb-5"
      >
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-[880px] items-end gap-[3px]" style={{ height: 190 }}>
            {p.map((b) => {
              const h = (b.revenue / max) * 170;
              const cats = Object.entries(b.byCategory).sort((x, y) => y[1] - x[1]);
              return (
                <div key={b.key} className="group relative flex flex-1 flex-col items-center justify-end">
                  {b.revenue > 0 && (
                    <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-white group-hover:block">
                      <b>{b.year}年{b.month}月：{yenMan(b.revenue)}</b>
                      <br />
                      {cats.slice(0, 3).map(([k, v]) => `${CAT_LABEL[k]} ${yenMan(v)}`).join(" / ")}
                    </div>
                  )}
                  <div className="flex w-full flex-col-reverse" style={{ height: Math.max(b.revenue > 0 ? 3 : 1, h) }}>
                    {cats.map(([k, v]) => (
                      <div key={k} style={{ height: `${(v / b.revenue) * 100}%`, background: CAT_COLOR[k] }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex min-w-[880px] gap-[3px]">
            {p.map((b) => (
              <div key={b.key} className="num flex-1 text-center text-[8.5px] text-slate-400">
                {[1, 4, 7, 10].includes(b.month) ? `${String(b.year).slice(2)}/${b.month}` : ""}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
          {Object.entries(CAT_LABEL).map(([k, l]) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-3 rounded-sm" style={{ background: CAT_COLOR[k] }} />
              {l}
            </span>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card
          className="lg:col-span-3"
          title="いま当たるべき顧客（90日以内に満了）"
          desc="営業リストを作る必要がない。台帳の期限がそのまま優先順位になる。"
          right={<Link href="/ops/orders" className="text-teal-700 hover:underline">受注管理 →</Link>}
        >
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                <Th>顧客</Th>
                <Th>契約</Th>
                <Th align="right">満了数量</Th>
                <Th align="right">売価見込</Th>
                <Th align="right">粗利見込</Th>
                <Th align="right">最短</Th>
              </tr>
            </thead>
            <tbody>
              {hot.map((h) => (
                <tr key={h.c.id} className="hover:bg-slate-50">
                  <Td>
                    <span className="font-medium text-slate-900">{h.c.name}</span>
                    <div className="text-[10.5px] text-slate-400">{h.c.industry}・{h.c.headcount}名・{h.c.owner}</div>
                  </Td>
                  <Td>
                    {h.c.contract === "預託サブスク" ? <Badge tone="green">預託</Badge> : <Badge tone="slate">売切り</Badge>}
                  </Td>
                  <Td align="right" className="text-slate-500">{h.qty.toLocaleString()}</Td>
                  <Td align="right" className="font-medium">{yen(h.revenue)}</Td>
                  <Td align="right" className="text-teal-700">{yen(h.revenue * (1 - OPERATOR.cogsRate))}</Td>
                  <Td align="right" className={h.earliest < 0 ? "font-semibold text-rose-600" : "text-amber-600"}>
                    {h.earliest < 0 ? `${-h.earliest}日超過` : `${h.earliest}日`}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4">
            <DemoNote>
              預託契約の顧客は、満了が来ても<strong>受注活動が要らない</strong>。契約上こちらが入れ替える義務を負っているので、
              出荷指示が自動で立つだけ。売切り顧客だけが営業対象になる。
            </DemoNote>
          </div>
        </Card>

        <Card className="lg:col-span-2" title="顧客ポートフォリオ" desc="契約形態別の構成">
          <div className="space-y-4">
            {(["預託サブスク", "売切り"] as const).map((t) => {
              const rows = active.filter((c) => c.contract === t);
              const h = rows.reduce((a, c) => a + c.headcount, 0);
              return (
                <div key={t}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12.5px] font-medium text-slate-800">{t}</span>
                    <span className="num text-[12.5px] text-slate-600">
                      {rows.length}社 / {h.toLocaleString()}名
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${t === "預託サブスク" ? "bg-teal-600" : "bg-slate-400"}`}
                      style={{ width: `${(h / heads) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {t === "預託サブスク"
                      ? `年間経常 ${yenMan(mrr() * 12)}／解約されるまで毎月立つ`
                      : `5年で1周する一括発注。次の更新まで接点が切れやすい`}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="mb-2 text-[11.5px] font-semibold text-slate-700">優先供給契約</div>
            <p className="text-[11.5px] leading-relaxed text-slate-600">
              発災後は防災用品が瞬時に品切れる。優先供給契約の顧客には、DCの在庫を先に引き当てる。
              一見客の投機的な大量発注を断ってでも既存顧客に回す運用は、契約と在庫引当がシステム上でつながっていないと回らない。
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="num text-2xl font-semibold text-teal-700">
                {active.filter((c) => c.priority).length}
              </span>
              <span className="text-[12px] text-slate-500">
                社が契約中（{pct(active.filter((c) => c.priority).length / active.length, 0)}）
              </span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
