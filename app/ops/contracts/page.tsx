"use client";

import { useMemo, useState } from "react";
import { PageHead } from "@/components/Shell";
import { Badge, Card, DemoNote, Td, Th } from "@/components/ui";
import { pct, yen, yenMan } from "@/lib/calc";
import { CUSTOMERS, OPERATOR, consignedAssets, mrr } from "@/lib/ops-data";

export default function ContractsPage() {
  const [sort, setSort] = useState<"mrr" | "head" | "name">("mrr");
  const [only, setOnly] = useState<"all" | "預託サブスク" | "売切り">("all");

  const active = CUSTOMERS.filter((c) => c.status !== "商談中");

  const rows = useMemo(() => {
    let r = only === "all" ? active : active.filter((c) => c.contract === only);
    r = r.slice().sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ja");
      if (sort === "head") return b.headcount - a.headcount;
      return b.headcount * (b.perHead ?? 0) - a.headcount * (a.perHead ?? 0);
    });
    return r;
  }, [only, sort, active]);

  const subs = active.filter((c) => c.contract === "預託サブスク");
  const subHeads = subs.reduce((a, c) => a + c.headcount, 0);
  const allHeads = active.reduce((a, c) => a + c.headcount, 0);
  const monthly = mrr();
  const assets = consignedAssets();

  // 売切り顧客を預託に転換した場合の増分
  const convertible = active.filter((c) => c.contract === "売切り");
  const upsideMrr = convertible.reduce((a, c) => a + c.headcount * OPERATOR.subMonthly, 0);
  const upsideAssets = convertible.reduce((a, c) => a + c.headcount * OPERATOR.kitPricePerHead * OPERATOR.cogsRate, 0);

  return (
    <>
      <PageHead
        title="契約・預託資産"
        desc="預託サブスクは、顧客拠点に置いた在庫の所有権を自社に残したまま月額で課金する形態。顧客は資産計上と期限管理と廃棄責任から解放され、卸は継続収益と高い解約障壁を得る。"
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "月次経常収益（MRR）", v: yenMan(monthly), s: `年換算 ${yenMan(monthly * 12)}`, t: "text-teal-700" },
          { l: "預託カバー率", v: pct(subHeads / allHeads, 0), s: `${subHeads.toLocaleString()}名 / 全${allHeads.toLocaleString()}名`, t: "text-slate-900" },
          { l: "預託在庫（自社資産）", v: yenMan(assets), s: "顧客拠点にある在庫の簿価。B/Sに残る", t: "text-slate-900" },
          { l: "平均単価", v: yen(subHeads ? monthly / subHeads : 0) + "/人月", s: "標準 ¥280。規模と品目構成で調整", t: "text-slate-900" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="text-[11.5px] font-medium text-slate-500">{k.l}</div>
            <div className={`num mt-1 text-2xl font-semibold ${k.t}`}>{k.v}</div>
            <div className="mt-1 text-[11px] leading-snug text-slate-500">{k.s}</div>
          </div>
        ))}
      </div>

      <Card
        title="売切りと預託の比較（1人・5年あたり）"
        desc="顧客・自社の双方から見た損得。数字は保存年数5年・3日分の標準セットを前提にした試算。"
        className="mb-5"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr>
                <Th>項目</Th>
                <Th align="right">売切り</Th>
                <Th align="right">預託サブスク</Th>
                <Th>差が生まれる理由</Th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">顧客の支払（5年累計）</Td>
                <Td align="right">{yen(OPERATOR.kitPricePerHead)}</Td>
                <Td align="right">{yen(OPERATOR.subMonthly * 60)}</Td>
                <Td className="text-[11.5px] text-slate-500">月{yen(OPERATOR.subMonthly)}×60ヶ月。額面では預託が高い</Td>
              </tr>
              <tr className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">顧客の管理工数・廃棄費</Td>
                <Td align="right" className="text-rose-600">別途発生</Td>
                <Td align="right" className="text-emerald-600">込み</Td>
                <Td className="text-[11.5px] text-slate-500">期限管理・入替手配・産廃処理・寄贈手続をこちらが持つ</Td>
              </tr>
              <tr className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">顧客の会計処理</Td>
                <Td align="right">資産計上／一括費用</Td>
                <Td align="right" className="text-emerald-600">月次費用</Td>
                <Td className="text-[11.5px] text-slate-500">capexがopexになる。稟議の通し方が変わる</Td>
              </tr>
              <tr className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">自社の商品原価</Td>
                <Td align="right">{yen(OPERATOR.kitPricePerHead * OPERATOR.cogsRate)}</Td>
                <Td align="right">{yen(OPERATOR.kitPricePerHead * OPERATOR.cogsRate)}</Td>
                <Td className="text-[11.5px] text-slate-500">仕入れる物は同じ</Td>
              </tr>
              <tr className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">自社の付帯費（物流・引取り・システム）</Td>
                <Td align="right" className="text-slate-400">—</Td>
                <Td align="right">{yen(1800)}</Td>
                <Td className="text-[11.5px] text-slate-500">預託は入替・回収まで負う</Td>
              </tr>
              <tr className="bg-teal-50/60">
                <Td className="font-semibold text-slate-900">自社の5年粗利</Td>
                <Td align="right" className="font-semibold">{yen(OPERATOR.kitPricePerHead * (1 - OPERATOR.cogsRate))}</Td>
                <Td align="right" className="font-semibold text-teal-700">
                  {yen(OPERATOR.subMonthly * 60 - OPERATOR.kitPricePerHead * OPERATOR.cogsRate - 1800)}
                </Td>
                <Td className="text-[11.5px] text-slate-600">
                  粗利率 {pct(1 - OPERATOR.cogsRate, 0)} →{" "}
                  {pct((OPERATOR.subMonthly * 60 - OPERATOR.kitPricePerHead * OPERATOR.cogsRate - 1800) / (OPERATOR.subMonthly * 60), 0)}
                </Td>
              </tr>
              <tr className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">次回更新の受注</Td>
                <Td align="right" className="text-amber-600">再度の営業が必要</Td>
                <Td align="right" className="text-emerald-600">契約上自動</Td>
                <Td className="text-[11.5px] text-slate-500">預託は入替がこちらの義務なので、失注という概念がなくなる</Td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <DemoNote>
            <b className="text-slate-700">預託の本質は分割払いではない。</b>
            顧客が本当に嫌がっているのは支出額ではなく、<strong>期限を見張り続ける仕事と、期限切れを出したときの責任</strong>です。
            そこを引き受ける対価として月額の上乗せを取り、同時に更新受注を契約上確定させる。
            市場には既に月額500〜780円／人のレンタル型防災セットの先例があり、価格の受容性は検証済みと見てよい。
          </DemoNote>
        </div>
      </Card>

      <Card
        title="預託転換の余地"
        desc="現在の売切り顧客をすべて預託に切り替えた場合の増分。実際は段階的に、更新のタイミングで提案する。"
        className="mb-5"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3.5">
            <div className="text-[11.5px] font-medium text-teal-800">MRR 増分</div>
            <div className="num mt-1 text-2xl font-semibold text-teal-800">+{yenMan(upsideMrr)}</div>
            <div className="mt-1 text-[11px] text-teal-700">現在 {yenMan(monthly)} → {yenMan(monthly + upsideMrr)}／月</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5">
            <div className="text-[11.5px] font-medium text-amber-900">必要な在庫投資</div>
            <div className="num mt-1 text-2xl font-semibold text-amber-900">{yenMan(upsideAssets)}</div>
            <div className="mt-1 text-[11px] text-amber-800">所有権を自社に残すぶん、先にキャッシュが出る</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <div className="text-[11.5px] font-medium text-slate-600">投資回収期間</div>
            <div className="num mt-1 text-2xl font-semibold text-slate-900">
              {(upsideAssets / upsideMrr).toFixed(1)}ヶ月
            </div>
            <div className="mt-1 text-[11px] text-slate-500">月額収入だけで在庫投資を回収するまで</div>
          </div>
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-slate-600">
          回収期間が約{(upsideAssets / upsideMrr).toFixed(0)}ヶ月ということは、
          <strong>全顧客を一度に転換すると2年以上キャッシュが沈む</strong>ということでもあります。
          リース会社との組み合わせ（在庫を金融機関に持たせて自社は運用のみ担う）か、
          年間の転換社数に上限を置く運用が現実的です。詳細は
          <a href="/ops/economics" className="ml-1 text-teal-700 underline">収支シミュレータ</a>で。
        </p>
      </Card>

      <Card
        title={`契約一覧（${rows.length}社）`}
        right={
          <div className="flex gap-1.5">
            <select value={only} onChange={(e) => setOnly(e.target.value as typeof only)} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11.5px]">
              <option value="all">全契約</option>
              <option value="預託サブスク">預託サブスク</option>
              <option value="売切り">売切り</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11.5px]">
              <option value="mrr">月額が大きい順</option>
              <option value="head">人数が多い順</option>
              <option value="name">社名順</option>
            </select>
          </div>
        }
      >
        <div className="max-h-[520px] overflow-auto rounded-lg border border-slate-100">
          <table className="w-full min-w-[860px]">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                <Th>顧客</Th>
                <Th>業種</Th>
                <Th align="right">人数</Th>
                <Th align="right">拠点</Th>
                <Th>契約</Th>
                <Th align="right">単価</Th>
                <Th align="right">月額</Th>
                <Th align="center">優先供給</Th>
                <Th>取引開始</Th>
                <Th>状態</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <Td>
                    <span className="font-medium text-slate-900">{c.name}</span>
                    <div className="text-[10.5px] text-slate-400">{c.pref}・{c.owner}</div>
                  </Td>
                  <Td className="text-slate-500">{c.industry}</Td>
                  <Td align="right">{c.headcount.toLocaleString()}</Td>
                  <Td align="right" className="text-slate-500">{c.sites}</Td>
                  <Td>{c.contract === "預託サブスク" ? <Badge tone="green">預託</Badge> : <Badge tone="slate">売切り</Badge>}</Td>
                  <Td align="right" className="text-slate-500">{c.perHead ? `¥${c.perHead}/人月` : "—"}</Td>
                  <Td align="right" className={c.perHead ? "font-medium text-teal-700" : "text-slate-300"}>
                    {c.perHead ? yen(c.headcount * c.perHead) : "—"}
                  </Td>
                  <Td align="center">{c.priority ? <Badge tone="sky">あり</Badge> : <span className="text-slate-300">—</span>}</Td>
                  <Td className="num text-slate-500">{c.since}</Td>
                  <Td>
                    <Badge tone={c.status === "更新期近" ? "amber" : "slate"}>{c.status}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
