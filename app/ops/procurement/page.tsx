"use client";

import { useMemo, useState } from "react";
import { PageHead } from "@/components/Shell";
import { Badge, Card, DemoNote, Td, Th } from "@/components/ui";
import { pct, yen, yenMan } from "@/lib/calc";
import { ITEMS, itemById } from "@/lib/data";
import { DCS, OPERATOR, WH_STOCK, daysTo, procurementPlan } from "@/lib/ops-data";

export default function ProcurementPage() {
  const [horizon, setHorizon] = useState(12);
  const [dc, setDc] = useState("all");

  const plan = useMemo(() => procurementPlan(horizon), [horizon]);

  const stock = useMemo(() => {
    const rows = dc === "all" ? WH_STOCK : WH_STOCK.filter((l) => l.dc === dc);
    const m = new Map<string, { qty: number; free: number; value: number; risk: number }>();
    for (const l of rows) {
      const e = m.get(l.itemId) ?? { qty: 0, free: 0, value: 0, risk: 0 };
      e.qty += l.qty;
      e.free += l.qty - l.allocated;
      e.value += l.qty * l.cost;
      const d = daysTo(l.expiresAt);
      // 自社在庫のうち、残存期間が短く顧客に出しにくいもの＝滞留リスク
      if (d !== null && d < 365) e.risk += l.qty * l.cost;
      m.set(l.itemId, e);
    }
    return m;
  }, [dc]);

  const planTotal = plan.reduce((a, p) => a + p.revenue, 0);
  const stockValue = [...stock.values()].reduce((a, v) => a + v.value, 0);
  const riskValue = [...stock.values()].reduce((a, v) => a + v.risk, 0);
  const cogs = planTotal * OPERATOR.cogsRate;
  const monthsOfStock = cogs > 0 ? stockValue / (cogs / horizon) : 0;

  const shortRows = WH_STOCK.filter((l) => {
    const d = daysTo(l.expiresAt);
    return d !== null && d < 400;
  })
    .sort((a, b) => (daysTo(a.expiresAt) ?? 0) - (daysTo(b.expiresAt) ?? 0))
    .slice(0, 8);

  return (
    <>
      <PageHead
        title="仕入計画・自社在庫"
        desc="顧客の満了予定が仕入の必要数量になる。従来は「去年これだけ売れたから今年も」という推計だったものが、期限という事実から積み上がるので、メーカーへの発注ロットを先に固められる。"
        right={
          <div className="flex items-center gap-2">
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px]"
            >
              {[6, 12, 24].map((h) => (
                <option key={h} value={h}>今後{h}ヶ月</option>
              ))}
            </select>
            <select
              value={dc}
              onChange={(e) => setDc(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px]"
            >
              <option value="all">全DC</option>
              {DCS.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: `必要仕入額（${horizon}ヶ月）`, v: yenMan(cogs), s: `売価ベース ${yenMan(planTotal)}・原価率 ${pct(OPERATOR.cogsRate, 0)}` },
          { l: "自社在庫 簿価", v: yenMan(stockValue), s: `${dc === "all" ? "全DC" : DCS.find((d) => d.id === dc)?.name}` },
          {
            l: "在庫月数",
            v: monthsOfStock.toFixed(1) + "ヶ月",
            s: monthsOfStock > 6 ? "過剰。期限のある商材では滞留に直結する" : monthsOfStock > 3.5 ? "やや厚い。満了予定に合わせて絞れる" : "適正圏",
          },
          { l: "滞留リスク在庫", v: yenMan(riskValue), s: "残存1年未満。顧客に出しにくく、自社の廃棄候補" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="text-[11.5px] font-medium text-slate-500">{k.l}</div>
            <div className="num mt-1 text-2xl font-semibold text-slate-900">{k.v}</div>
            <div className="mt-1 text-[11px] leading-snug text-slate-500">{k.s}</div>
          </div>
        ))}
      </div>

      <Card
        title={`品目別 仕入計画（今後${horizon}ヶ月）`}
        desc="満了予定数量から必要数を出し、自社在庫の引当可能分を差し引いて発注数量を決める。"
        className="mb-5"
        right={<button className="rounded-lg bg-teal-700 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-teal-800">発注書を一括作成</button>}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead>
              <tr>
                <Th>品目 / メーカー</Th>
                <Th align="right">満了数量</Th>
                <Th align="right">対象社数</Th>
                <Th align="right">売価見込</Th>
                <Th align="right">在庫（引当可）</Th>
                <Th align="right">発注必要数</Th>
                <Th align="right">仕入額</Th>
                <Th>判定</Th>
              </tr>
            </thead>
            <tbody>
              {plan.map((p) => {
                const item = itemById(p.itemId);
                const s = stock.get(p.itemId) ?? { qty: 0, free: 0, value: 0, risk: 0 };
                const need = Math.max(0, p.qty - s.free);
                const cover = p.qty ? s.free / p.qty : 1;
                return (
                  <tr key={p.itemId} className="hover:bg-slate-50">
                    <Td>
                      <span className="font-medium text-slate-900">{item.name}</span>
                      <div className="text-[10.5px] text-slate-400">{item.id}・{item.vendor}</div>
                    </Td>
                    <Td align="right">{p.qty.toLocaleString()}<span className="text-[10px] text-slate-400"> {item.pack}</span></Td>
                    <Td align="right" className="text-slate-500">{p.customers}</Td>
                    <Td align="right">{yen(p.revenue)}</Td>
                    <Td align="right" className="text-slate-500">{s.free.toLocaleString()}</Td>
                    <Td align="right" className={need > 0 ? "font-semibold text-teal-700" : "text-slate-300"}>
                      {need > 0 ? need.toLocaleString() : "—"}
                    </Td>
                    <Td align="right">{need > 0 ? yen(need * item.unitCost * OPERATOR.cogsRate) : "—"}</Td>
                    <Td>
                      {cover >= 1 ? (
                        <Badge tone="green">在庫で充当</Badge>
                      ) : cover >= 0.5 ? (
                        <Badge tone="amber">一部発注</Badge>
                      ) : (
                        <Badge tone="rose">要発注</Badge>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <DemoNote>
            <b className="text-slate-700">交渉材料になる。</b>
            「今後12ヶ月でアルファ化米が11社・6,890食ぶん満了する」という事実を持ってメーカーと年間契約を結べば、
            スポット仕入より確実に下代が下がる。台帳を持つことの効果は、売る側だけでなく<strong>買う側にも出る</strong>。
          </DemoNote>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card
          className="lg:col-span-3"
          title="自社在庫の期限リスク"
          desc="卸自身の在庫にも期限がある。残存期間が短いロットは、満了が近い顧客に優先的に引き当てて回す。"
        >
          <table className="w-full min-w-[520px]">
            <thead>
              <tr><Th>ロット</Th><Th>品目</Th><Th>DC</Th><Th align="right">数量</Th><Th align="right">簿価</Th><Th align="right">残存</Th></tr>
            </thead>
            <tbody>
              {shortRows.map((l) => {
                const d = daysTo(l.expiresAt)!;
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <Td className="num text-slate-400">{l.id}</Td>
                    <Td className="font-medium text-slate-800">{itemById(l.itemId).name}</Td>
                    <Td className="text-slate-500">{DCS.find((x) => x.id === l.dc)?.name.replace(/（.*/, "")}</Td>
                    <Td align="right">{l.qty.toLocaleString()}</Td>
                    <Td align="right">{yen(l.qty * l.cost)}</Td>
                    <Td align="right" className={d < 180 ? "font-semibold text-rose-600" : "text-amber-600"}>
                      {Math.round(d / 30)}ヶ月
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-50">満了間近の顧客に優先引当</button>
            <button className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-50">訓練用サンプルに転用</button>
          </div>
        </Card>

        <Card className="lg:col-span-2" title="DC別の在庫配置" desc="需要の発生地とDCの担当エリアを突き合わせる">
          <ul className="space-y-3">
            {DCS.map((d) => {
              const rows = WH_STOCK.filter((l) => l.dc === d.id);
              const v = rows.reduce((a, l) => a + l.qty * l.cost, 0);
              const all = WH_STOCK.reduce((a, l) => a + l.qty * l.cost, 0);
              return (
                <li key={d.id}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12.5px] font-medium text-slate-800">{d.name}</span>
                    <span className="num text-[12.5px] text-slate-700">{yenMan(v)}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-teal-600" style={{ width: `${(v / all) * 100}%` }} />
                  </div>
                  <div className="mt-1 text-[10.5px] text-slate-400">{d.covers.join("・")}／{rows.length}ロット</div>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="mb-2 text-[11.5px] font-semibold text-slate-700">発災時の引当ルール</div>
            <ol className="space-y-1.5 text-[11.5px] leading-relaxed text-slate-600">
              <li>1. 優先供給契約の顧客（被災地域）</li>
              <li>2. 預託契約の顧客（自社資産の補充義務）</li>
              <li>3. 既存の売切り顧客</li>
              <li>4. 新規・スポット</li>
            </ol>
            <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500">
              発災直後の需要スパイクで一見客に在庫を吐き出すと、既存顧客への供給責任を果たせなくなる。
              引当順位を先に決めて契約に書いておくことが、平時の受注理由になる。
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
