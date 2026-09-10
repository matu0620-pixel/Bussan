"use client";

import { useMemo, useState } from "react";
import { PageHead } from "@/components/Shell";
import { Card, DemoNote, Td, Th } from "@/components/ui";
import { pct, yenMan } from "@/lib/calc";
import { CUSTOMERS, OPERATOR } from "@/lib/ops-data";

const START = (() => {
  const active = CUSTOMERS.filter((c) => c.status !== "商談中");
  const subs = active.filter((c) => c.contract === "預託サブスク");
  return {
    customers: active.length,
    heads: active.reduce((a, c) => a + c.headcount, 0),
    subCustomers: subs.length,
    subHeads: subs.reduce((a, c) => a + c.headcount, 0),
  };
})();

/** 固定前提（画面下部に明示） */
const FIX = {
  devYear1: 20_000_000, // システム開発（初年度）
  runYear: 7_000_000, // システム運用・保守（年）
  salesCost: 8_000_000, // 営業・CS 1名あたり年間コスト
  pickupFee: 40_000, // 引取り1回あたり手数料
  pickupRate: 0.7, // 引取りの実施率
  attachPerHeadYear: 360, // 預託の付帯費（物流・回収・システム）円/人年
  initialBuyRatio: 0.4, // 新規顧客が初年度に発注する割合（既存備蓄があるため全量ではない）
};

type Row = {
  year: number;
  customers: number;
  heads: number;
  subHeads: number;
  revSell: number;
  revSub: number;
  revPickup: number;
  cogsSell: number;
  amort: number;
  attach: number;
  gp: number;
  opex: number;
  op: number;
  invest: number;
  cf: number;
  cumCf: number;
};

export default function EconomicsPage() {
  const [acq, setAcq] = useState(12); // 年間新規獲得（社）
  const [avgHead, setAvgHead] = useState(300); // 平均従業員数
  const [subRatio, setSubRatio] = useState(45); // 新規のうち預託の割合（%）
  const [perHead, setPerHead] = useState(OPERATOR.subMonthly); // 預託単価（円/人月）
  const [cogsRate, setCogsRate] = useState(70); // 仕入原価率（%）
  const [churn, setChurn] = useState(6); // 年間解約率（%）
  const [convert, setConvert] = useState(3); // 既存売切りからの預託転換（社/年）
  const [perRep, setPerRep] = useState(40); // 営業1名あたり担当社数
  const [withPickup, setWithPickup] = useState(true);

  const rows: Row[] = useMemo(() => {
    const cr = cogsRate / 100;
    const sr = subRatio / 100;
    const ch = churn / 100;
    const kit = OPERATOR.kitPricePerHead;

    let customers = START.customers;
    let heads = START.heads;
    let subHeads = START.subHeads;
    // 顧客拠点に配備済みの預託在庫（取得原価ベース）。5年で償却する自社資産として扱う。
    let deployedCost = START.subHeads * kit * cr;
    let cum = 0;
    const out: Row[] = [];

    for (let y = 1; y <= 5; y++) {
      // 解約
      customers = customers * (1 - ch);
      heads = heads * (1 - ch);
      const subChurn = ch * 0.4; // 預託は契約期間の縛りがあり解約されにくい
      subHeads = subHeads * (1 - subChurn);
      deployedCost = deployedCost * (1 - subChurn);

      // 新規
      const newHeads = acq * avgHead;
      const newSubHeads = newHeads * sr;
      customers += acq;
      heads += newHeads;
      subHeads += newSubHeads;

      // 既存の売切り顧客からの預託転換
      const convHeads = Math.min(convert * avgHead, Math.max(0, heads - subHeads));
      subHeads += convHeads;

      const sellHeads = Math.max(0, heads - subHeads);

      // 今年配備した預託在庫（キャッシュアウト）
      const invest = (newSubHeads + convHeads) * kit * cr;
      deployedCost += invest;

      // 収益
      const revSell = sellHeads * (kit / 5) + (newHeads - newSubHeads) * kit * FIX.initialBuyRatio;
      const revSub = subHeads * perHead * 12;
      const revPickup = withPickup ? customers * FIX.pickupFee * FIX.pickupRate : 0;

      // 原価：売切りは仕入原価、預託は配備済み在庫の減価償却（保存年数5年で按分）
      const cogsSell = revSell * cr;
      const amort = deployedCost / 5;
      const attach = subHeads * FIX.attachPerHeadYear;

      const gp = revSell + revSub + revPickup - cogsSell - amort - attach;

      // 販管費
      const reps = Math.ceil(customers / perRep);
      const opex = (y === 1 ? FIX.devYear1 : 0) + FIX.runYear + reps * FIX.salesCost;
      const op = gp - opex;

      const cf = op + amort - invest; // 償却は非資金費用なので戻す
      cum += cf;

      out.push({
        year: 2027 + y - 1,
        customers: Math.round(customers),
        heads: Math.round(heads),
        subHeads: Math.round(subHeads),
        revSell,
        revSub,
        revPickup,
        cogsSell,
        amort,
        attach,
        gp,
        opex,
        op,
        invest,
        cf,
        cumCf: cum,
      });
    }
    return out;
  }, [acq, avgHead, subRatio, perHead, cogsRate, churn, convert, withPickup, perRep]);

  const last = rows[rows.length - 1];
  const breakeven = rows.find((r) => r.cumCf >= 0);
  const trough = Math.min(...rows.map((r) => r.cumCf), 0);
  const hi = Math.max(...rows.map((r) => r.cumCf), 0);
  const lo = Math.min(...rows.map((r) => r.cumCf), 0);
  const span = hi - lo || 1;
  const zeroTop = (hi / span) * 100; // ゼロ線の位置（上からの%）

  const sliders = [
    { l: "年間新規獲得", v: acq, set: setAcq, min: 0, max: 40, step: 1, unit: "社/年" },
    { l: "平均従業員数", v: avgHead, set: setAvgHead, min: 80, max: 600, step: 10, unit: "名" },
    { l: "新規の預託比率", v: subRatio, set: setSubRatio, min: 0, max: 100, step: 5, unit: "%" },
    { l: "既存からの預託転換", v: convert, set: setConvert, min: 0, max: 12, step: 1, unit: "社/年" },
    { l: "預託単価", v: perHead, set: setPerHead, min: 180, max: 420, step: 10, unit: "円/人月" },
    { l: "仕入原価率", v: cogsRate, set: setCogsRate, min: 55, max: 85, step: 1, unit: "%" },
    { l: "年間解約率", v: churn, set: setChurn, min: 0, max: 25, step: 1, unit: "%" },
    { l: "営業1名あたり担当社数", v: perRep, set: setPerRep, min: 12, max: 70, step: 2, unit: "社" },
  ];

  return (
    <>
      <PageHead
        title="収支シミュレータ"
        desc="現在の22社・9,326名を起点に、5年間の売上・粗利・キャッシュフローを試算します。預託比率を上げると粗利率は伸びますが、在庫を自社で持つぶんキャッシュは先に沈みます。そのトレードオフを見るための画面です。"
      />

      <Card title="前提を動かす" desc="スライダーを動かすと下の表とキャッシュフローが即座に再計算されます。" className="mb-5">
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {sliders.map((s) => (
            <label key={s.l} className="block">
              <span className="mb-1 flex items-baseline justify-between text-[11.5px] font-medium text-slate-600">
                {s.l}
                <span className="num text-[13px] font-semibold text-teal-700">
                  {s.v}
                  <span className="ml-0.5 text-[10.5px] font-normal text-slate-400">{s.unit}</span>
                </span>
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={s.v}
                onChange={(e) => s.set(Number(e.target.value))}
                className="w-full accent-teal-700"
              />
            </label>
          ))}
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-medium text-slate-600">引取り・逆物流</span>
            <button
              onClick={() => setWithPickup((v) => !v)}
              className={`w-full rounded-lg border px-2.5 py-1.5 text-left text-[12.5px] ${
                withPickup ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-300 bg-white text-slate-600"
              }`}
            >
              {withPickup ? "手数料を取る" : "サービスとして無償"}
            </button>
          </label>
        </div>
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "5年目 売上", v: yenMan(last.revSell + last.revSub + last.revPickup), s: `顧客 ${last.customers}社 / ${last.heads.toLocaleString()}名`, t: "text-slate-900" },
          { l: "5年目 粗利率", v: pct(last.gp / (last.revSell + last.revSub + last.revPickup), 0), s: `粗利 ${yenMan(last.gp)}`, t: "text-teal-700" },
          { l: "5年目 営業利益", v: yenMan(last.op), s: last.op > 0 ? "黒字" : "赤字", t: last.op > 0 ? "text-emerald-600" : "text-rose-600" },
          {
            l: "必要運転資金（累積CFの谷）",
            v: yenMan(trough),
            s: breakeven ? `${breakeven.year}年に累積CFが黒字転換` : `5年内に黒字転換せず。5年目累積 ${yenMan(last.cumCf)}`,
            t: breakeven ? "text-amber-600" : "text-rose-600",
          },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="text-[11.5px] font-medium text-slate-500">{k.l}</div>
            <div className={`num mt-1 text-2xl font-semibold ${k.t}`}>{k.v}</div>
            <div className="mt-1 text-[11px] leading-snug text-slate-500">{k.s}</div>
          </div>
        ))}
      </div>

      <Card title="5年損益とキャッシュフロー" desc="単位：万円。預託の初期配備投資は粗利には出ず、キャッシュにだけ出る点に注意。" className="mb-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr>
                <Th>項目</Th>
                {rows.map((r) => (
                  <Th key={r.year} align="right">{r.year}年</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([
                ["顧客数（社）", (r: Row) => r.customers.toLocaleString(), ""],
                ["うち預託（名）", (r: Row) => r.subHeads.toLocaleString(), "text-teal-700"],
                ["売切り物販", (r: Row) => yenMan(r.revSell), ""],
                ["預託サブスク", (r: Row) => yenMan(r.revSub), "text-teal-700"],
                ["引取り手数料", (r: Row) => yenMan(r.revPickup), ""],
                ["売上原価（売切り）", (r: Row) => "△" + yenMan(r.cogsSell), "text-slate-500"],
                ["預託在庫の減価償却", (r: Row) => "△" + yenMan(r.amort), "text-slate-500"],
                ["預託の付帯費", (r: Row) => "△" + yenMan(r.attach), "text-slate-500"],
                ["売上総利益", (r: Row) => yenMan(r.gp), "font-semibold"],
                ["販管費", (r: Row) => "△" + yenMan(r.opex), "text-slate-500"],
                ["営業利益", (r: Row) => yenMan(r.op), "font-semibold"],
                ["預託在庫の新規配備（投資）", (r: Row) => "△" + yenMan(r.invest), "text-amber-700"],
                ["単年CF", (r: Row) => yenMan(r.cf), ""],
                ["累積CF", (r: Row) => yenMan(r.cumCf), "font-semibold"],
              ] as [string, (r: Row) => string, string][]).map(([label, fn, cls], i) => (
                <tr key={label} className={label === "累積CF" || label === "売上総利益" ? "bg-slate-50" : "hover:bg-slate-50"}>
                  <Td className={`font-medium ${i >= 8 ? "text-slate-900" : "text-slate-700"}`}>{label}</Td>
                  {rows.map((r) => {
                    const v = fn(r);
                    const neg = (label === "営業利益" || label === "単年CF" || label === "累積CF") && v.startsWith("-");
                    return (
                      <Td key={r.year} align="right" className={`${cls} ${neg ? "text-rose-600" : ""}`}>
                        {v}
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card
          className="lg:col-span-3"
          title="累積キャッシュフロー"
          desc="ゼロを上回るまでが、預託モデルの資金負担期間。谷の深さが、必要な運転資金の目安になる。"
          right={<span>最大の谷 <b className="num text-rose-600">{yenMan(trough)}</b></span>}
        >
          <div className="flex h-[210px] items-stretch gap-3">
            {rows.map((r) => {
              const positive = r.cumCf >= 0;
              const h = (Math.abs(r.cumCf) / span) * 100;
              return (
                <div key={r.year} className="flex flex-1 flex-col">
                  <div className="relative flex-1">
                    <div className="absolute left-0 right-0 h-px bg-slate-300" style={{ top: `${zeroTop}%` }} />
                    <div
                      className={`absolute left-1/4 right-1/4 ${positive ? "rounded-t bg-emerald-500" : "rounded-b bg-rose-400"}`}
                      style={
                        positive
                          ? { bottom: `${100 - zeroTop}%`, height: `${h}%` }
                          : { top: `${zeroTop}%`, height: `${h}%` }
                      }
                    />
                    <div
                      className={`num absolute left-0 right-0 text-center text-[11px] font-semibold ${positive ? "text-emerald-700" : "text-rose-600"}`}
                      style={
                        positive
                          ? { bottom: `calc(${100 - zeroTop}% + ${h}%)`, marginBottom: 2 }
                          : { top: `calc(${zeroTop}% + ${h}%)`, marginTop: 2 }
                      }
                    >
                      {yenMan(r.cumCf)}
                    </div>
                  </div>
                  <div className="num mt-1.5 text-center text-[10.5px] text-slate-400">{r.year}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="lg:col-span-2" title="この試算の読み方">
          <ul className="space-y-3 text-[12px] leading-relaxed text-slate-600">
            <li>
              <b className="text-slate-900">預託比率を上げると粗利率は上がる。</b>
              単価{perHead}円／人月なら5年で1人{(perHead * 60).toLocaleString()}円。売切りの{OPERATOR.kitPricePerHead.toLocaleString()}円より
              {Math.round(((perHead * 60) / OPERATOR.kitPricePerHead - 1) * 100)}%多く取れる。
            </li>
            <li>
              <b className="text-slate-900">同時にキャッシュは沈む。</b>
              預託在庫は配備した年に原価ぶんのキャッシュが出ますが、損益上は保存年数5年で償却されるため、
              P/Lが黒でもCFは赤という期間が生まれます。転換を急ぐほど谷が深くなります。
            </li>
            <li>
              <b className="text-slate-900">システムの投資対効果は「担当社数」に出る。</b>
              期限アラートが受注を自動起票するので、1名が見られる社数が増えます。
              このスライダーを{perRep}社から下げてみると、システムを入れない場合の人件費が分かります。
            </li>
            <li>
              <b className="text-slate-900">解約率が効くのは預託より売切り。</b>
              売切り顧客は次の更新まで接点が切れるため離れやすい。台帳を無償で持たせることが、この離脱を止める仕掛けになる。
            </li>
            <li>
              <b className="text-slate-900">システム投資は固定費。</b>
              初年度{yenMan(FIX.devYear1)}・以降年{yenMan(FIX.runYear)}を前提にしている。
              顧客数が少ないうちは重いので、まず自社の需要パイプラインだけを作って内製で回す判断もある。
            </li>
          </ul>
        </Card>
      </div>

      <Card className="mt-5" title="固定前提">
        <div className="grid gap-x-8 gap-y-2 text-[12px] sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["1人・5年ぶんの標準セット売価", `¥${OPERATOR.kitPricePerHead.toLocaleString()}`],
            ["システム開発（初年度）", yenMan(FIX.devYear1)],
            ["システム運用・保守（年）", yenMan(FIX.runYear)],
            ["営業・CS 1名あたり年間コスト", yenMan(FIX.salesCost)],
            ["預託在庫の償却年数", "5年（保存年数に合わせる）"],
            ["引取り手数料（1回）", `¥${FIX.pickupFee.toLocaleString()}・実施率${pct(FIX.pickupRate, 0)}`],
            ["預託の付帯費", `¥${FIX.attachPerHeadYear}/人・年（物流・回収・システム）`],
            ["新規顧客の初年度発注割合", pct(FIX.initialBuyRatio, 0)],
            ["預託の解約率", "売切りの4割（契約期間の縛りを想定）"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-slate-100 py-1.5">
              <span className="text-slate-500">{k}</span>
              <span className="num font-medium text-slate-800">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <DemoNote>
            これらは構想段階の仮置きです。特に <strong>1人・5年ぶんの標準セット売価</strong>と<strong>仕入原価率</strong>は
            実際の仕入表に置き換えると結論が変わります。まず自社の直近3年の販売実績から、この2つを埋めるところから始めるのが実務的です。
          </DemoNote>
        </div>
      </Card>
    </>
  );
}
