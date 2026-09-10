"use client";

import { useMemo, useState } from "react";
import { PageHead } from "@/components/Shell";
import { Badge, Card, DemoNote, Td, Th } from "@/components/ui";
import { annualizedCost, bookValue, expiredValue, fiscalRenewal, renewalTimeline, yen, yenMan } from "@/lib/calc";
import { COMPANY, LOTS, SITES, itemById, siteById } from "@/lib/data";

export default function RenewalPage() {
  const [site, setSite] = useState("all");
  const [level, setLevel] = useState(false);

  const scope = site === "all" ? undefined : site;
  const timeline = useMemo(() => renewalTimeline(36, scope), [scope]);
  const fiscal = useMemo(() => fiscalRenewal(84, scope), [scope]);

  const annual = annualizedCost(scope);
  const book = bookValue(scope);
  const expired = expiredValue(scope);
  const headcount = site === "all" ? COMPANY.headcount : siteById(site).headcount;

  const max = Math.max(...timeline.map((b) => b.cost), 1);
  const peak = fiscal.reduce((a, f) => Math.max(a, f.cost), 0);
  const evened = fiscal.reduce((a, f) => a + f.cost, 0) / fiscal.length;

  // カテゴリ別の年間換算コスト
  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of LOTS) {
      if (l.status !== "in_stock") continue;
      if (scope && l.siteId !== scope) continue;
      const it = itemById(l.itemId);
      m.set(it.category, (m.get(it.category) ?? 0) + (l.qty * l.unitCost) / Math.max(1, it.shelfLifeYears));
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [scope]);
  const CAT_LABEL: Record<string, string> = {
    water: "飲料水", food: "食料", toilet: "簡易トイレ", blanket: "毛布・保温",
    hygiene: "衛生用品", light: "照明・電源", medical: "医療・救急", helmet: "ヘルメット",
  };
  const catTotal = byCat.reduce((a, [, v]) => a + v, 0);

  return (
    <>
      <PageHead
        title="更新計画・コスト"
        desc="ロットの満了日から36ヶ月の更新スケジュールを自動生成し、年度予算と「防災原価（年間換算コスト）」を算定します。リース資産の減価償却と更新設備投資計画にあたる部分です。"
        right={
          <select value={site} onChange={(e) => setSite(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px]">
            <option value="all">全拠点</option>
            {SITES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "備蓄資産 取得額", v: yenMan(book), s: "台帳上の在庫の取得価額合計" },
          { l: "年間換算コスト", v: yenMan(annual), s: "取得額 ÷ 保存年数 の合計（防災原価）" },
          { l: "1人あたり年間", v: yen(annual / headcount), s: `対象 ${headcount}名で按分` },
          { l: "期限切れ滞留額", v: yenMan(expired), s: "実効ゼロのまま資産計上されている額" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="text-[11.5px] font-medium text-slate-500">{k.l}</div>
            <div className="num mt-1 text-2xl font-semibold text-slate-900">{k.v}</div>
            <div className="mt-1 text-[11px] leading-snug text-slate-500">{k.s}</div>
          </div>
        ))}
      </div>

      <Card
        title="更新スケジュール（今後36ヶ月）"
        desc="各月に満了するロットを現行単価で再調達した場合の必要額。山が立っている月が「更新の崖」です。"
        right={<span>36ヶ月合計 <b className="num text-slate-800">{yenMan(timeline.reduce((a, b) => a + b.cost, 0))}</b></span>}
        className="mb-5"
      >
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-[860px] items-end gap-[3px]" style={{ height: 180 }}>
            {timeline.map((b) => {
              const h = (b.cost / max) * 160;
              const isPeak = b.cost > max * 0.62;
              return (
                <div key={b.key} className="group relative flex flex-1 flex-col items-center justify-end">
                  {b.cost > 0 && (
                    <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10.5px] text-white group-hover:block">
                      {b.year}年{b.month}月：{yenMan(b.cost)}／{b.lots}ロット
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t-[2px] transition ${isPeak ? "bg-rose-500" : b.cost > 0 ? "bg-sky-500" : "bg-slate-100"}`}
                    style={{ height: Math.max(b.cost > 0 ? 3 : 1, h) }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex min-w-[860px] gap-[3px]">
            {timeline.map((b) => (
              <div key={b.key} className="num flex-1 text-center text-[8.5px] text-slate-400">
                {b.month === 1 || b.month === 4 || b.month === 7 || b.month === 10 ? `${String(b.year).slice(2)}/${b.month}` : ""}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-3 rounded-sm bg-sky-500" />通常月</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-3 rounded-sm bg-rose-500" />ピーク月（要平準化）</span>
          <span className="text-slate-400">バーにカーソルを合わせると内訳が表示されます</span>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card
          className="lg:col-span-3"
          title="年度別 更新必要額（4月始まり）"
          desc="一括購入した備蓄は満了も一斉に来ます。分割購入で平準化すると、単年度の予算要求額を抑えられます。"
          right={
            <button
              onClick={() => setLevel((v) => !v)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium ${level ? "bg-orange-500 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
            >
              {level ? "平準化シミュレーション ON" : "平準化シミュレーション"}
            </button>
          }
        >
          <table className="w-full">
            <thead>
              <tr>
                <Th>年度</Th>
                <Th className="w-1/2">更新必要額</Th>
                <Th align="right">現状</Th>
                {level && <Th align="right">平準化後</Th>}
                {level && <Th align="right">差</Th>}
              </tr>
            </thead>
            <tbody>
              {fiscal.map((f) => {
                const w = (f.cost / peak) * 100;
                const wl = (evened / peak) * 100;
                return (
                  <tr key={f.fy} className="hover:bg-slate-50">
                    <Td className="num font-medium">FY{f.fy}</Td>
                    <Td>
                      <div className="relative h-4 w-full rounded bg-slate-100">
                        <div className={`absolute left-0 top-0 h-4 rounded ${f.cost > evened * 1.35 ? "bg-rose-400" : "bg-sky-400"}`} style={{ width: `${w}%` }} />
                        {level && <div className="absolute top-[-3px] h-[22px] w-0.5 bg-orange-500" style={{ left: `${wl}%` }} />}
                      </div>
                    </Td>
                    <Td align="right" className={f.cost > evened * 1.35 ? "font-semibold text-rose-600" : ""}>{yenMan(f.cost)}</Td>
                    {level && <Td align="right" className="text-orange-600">{yenMan(evened)}</Td>}
                    {level && (
                      <Td align="right" className={f.cost > evened ? "text-emerald-600" : "text-slate-400"}>
                        {f.cost > evened ? `▲${yenMan(f.cost - evened)}` : `+${yenMan(evened - f.cost)}`}
                      </Td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {level && (
            <div className="mt-4">
              <DemoNote>
                更新ロットを複数年度に分割発注し、毎年 <b className="text-orange-600">{yenMan(evened)}</b> ずつの定常支出に置き換えた場合。
                ピーク年度 <b className="num">{yenMan(peak)}</b> を <b className="num">{yenMan(evened)}</b> まで圧縮でき、
                稟議も単年度予算の枠内で処理できます。実務上は「1/3ずつ3年で入れ替える」ローリング調達に相当します。
              </DemoNote>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2" title="年間換算コストの内訳" desc="どのカテゴリが防災原価を押し上げているか">
          <ul className="space-y-2.5">
            {byCat.map(([k, v]) => (
              <li key={k}>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="text-slate-700">{CAT_LABEL[k] ?? k}</span>
                  <span className="num font-medium text-slate-900">
                    {yenMan(v)} <span className="text-[10.5px] font-normal text-slate-400">{Math.round((v / catTotal) * 100)}%</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-slate-700" style={{ width: `${(v / byCat[0][1]) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="mb-2 text-[11.5px] font-semibold text-slate-700">更新方式の選択</div>
            <ul className="space-y-2 text-[11.5px] leading-relaxed text-slate-600">
              <li className="flex gap-2"><Badge tone="sky">買替</Badge><span>期限前に廃棄し新規購入。最も単純だが廃棄コストと食品ロスが出る。</span></li>
              <li className="flex gap-2"><Badge tone="green">ローリング</Badge><span>訓練・社内配布で消費してから補充。廃棄ゼロ。訓練実施記録にも紐づく。</span></li>
              <li className="flex gap-2"><Badge tone="violet">寄贈</Badge><span>期限6ヶ月前にフードバンクへ。CSR報告に転用可能。</span></li>
              <li className="flex gap-2"><Badge tone="amber">移送</Badge><span>回転の速い拠点へ移し、満了前に使い切る。</span></li>
            </ul>
          </div>
        </Card>
      </div>

      <Card
        className="mt-5"
        title="更新調達キュー"
        desc="90日以内に満了するロットから自動生成される発注候補。提携ベンダーへワンクリックで相見積を依頼できます（構想）。"
        right={<button className="rounded-lg bg-orange-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-orange-600">一括で相見積を依頼</button>}
      >
        <table className="w-full min-w-[640px]">
          <thead>
            <tr>
              <Th>品目</Th>
              <Th>拠点</Th>
              <Th align="right">更新数量</Th>
              <Th align="right">概算金額</Th>
              <Th>推奨方式</Th>
              <Th>期限</Th>
            </tr>
          </thead>
          <tbody>
            {LOTS.filter((l) => {
              if (scope && l.siteId !== scope) return false;
              if (!l.expiresAt) return false;
              const d = (new Date(l.expiresAt).getTime() - new Date("2026-09-10").getTime()) / 86400000;
              return d >= 0 && d <= 180;
            })
              .sort((a, b) => (a.expiresAt! < b.expiresAt! ? -1 : 1))
              .slice(0, 10)
              .map((l) => {
                const it = itemById(l.itemId);
                const rolling = ["food", "water"].includes(it.category);
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <Td><span className="font-medium text-slate-800">{it.name}</span><span className="ml-1.5 text-[10.5px] text-slate-400">{l.id}</span></Td>
                    <Td>{siteById(l.siteId).short}</Td>
                    <Td align="right">{l.qty.toLocaleString()}{it.pack}</Td>
                    <Td align="right">{yen(l.qty * it.unitCost)}</Td>
                    <Td>{rolling ? <Badge tone="green">ローリング</Badge> : <Badge tone="sky">買替</Badge>}</Td>
                    <Td className="num text-slate-500">{l.expiresAt}</Td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
