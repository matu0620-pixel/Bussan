"use client";

import { useMemo, useState } from "react";
import { PageHead } from "@/components/Shell";
import { Badge, Card, DemoNote, Empty, Td, Th } from "@/components/ui";
import { pct, yen, yenMan } from "@/lib/calc";
import { OPERATOR, ORDERS, PICKUPS, customerById, type OrderStage } from "@/lib/ops-data";

const STAGES: OrderStage[] = ["アラート", "見積提示", "承認待ち", "出荷準備", "出荷済", "失注"];

const STAGE_TONE: Record<OrderStage, "slate" | "sky" | "amber" | "violet" | "green" | "rose"> = {
  アラート: "slate",
  見積提示: "sky",
  承認待ち: "amber",
  出荷準備: "violet",
  出荷済: "green",
  失注: "rose",
};

export default function OrdersPage() {
  const [stage, setStage] = useState<"all" | OrderStage>("all");
  const [tab, setTab] = useState<"orders" | "reverse">("orders");

  const rows = useMemo(() => (stage === "all" ? ORDERS : ORDERS.filter((o) => o.stage === stage)), [stage]);

  const byStage = (s: OrderStage) => ORDERS.filter((o) => o.stage === s);
  const openAmt = ORDERS.filter((o) => !["出荷済", "失注"].includes(o.stage)).reduce((a, o) => a + o.amount, 0);
  const wonAmt = byStage("出荷済").reduce((a, o) => a + o.amount, 0);
  const lostAmt = byStage("失注").reduce((a, o) => a + o.amount, 0);
  const autoRate = ORDERS.filter((o) => o.auto).length / ORDERS.length;

  const lostReasons = useMemo(() => {
    const m = new Map<string, { n: number; amt: number }>();
    for (const o of byStage("失注")) {
      const k = o.lostReason ?? "—";
      const e = m.get(k) ?? { n: 0, amt: 0 };
      e.n++;
      e.amt += o.amount;
      m.set(k, e);
    }
    return [...m.entries()].sort((a, b) => b[1].amt - a[1].amt);
  }, []);

  const pickupFees = PICKUPS.reduce((a, p) => a + p.fee, 0);

  return (
    <>
      <PageHead
        title="更新受注・引取り"
        desc="期限アラートから見積・承認・出荷までを一本の流れにする。顧客側の台帳に新しいロットが自動で立つので、次の満了日もその場で確定する。"
        right={
          <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
            {(["orders", "reverse"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1 text-[12px] ${tab === t ? "bg-teal-700 font-medium text-white" : "text-slate-600"}`}
              >
                {t === "orders" ? "更新受注" : "引取り・逆物流"}
              </button>
            ))}
          </div>
        }
      />

      {tab === "orders" ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
            {STAGES.map((s) => {
              const list = byStage(s);
              const amt = list.reduce((a, o) => a + o.amount, 0);
              return (
                <button
                  key={s}
                  onClick={() => setStage(stage === s ? "all" : s)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    stage === s ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-[11px] font-medium opacity-80">{s}</div>
                  <div className="num mt-0.5 text-lg font-semibold">{list.length}</div>
                  <div className={`num text-[10.5px] ${stage === s ? "opacity-80" : "text-slate-400"}`}>{yenMan(amt)}</div>
                </button>
              );
            })}
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { l: "進行中の受注残", v: yenMan(openAmt), s: "アラート〜出荷準備の合計" },
              { l: "受注済（過去90日）", v: yenMan(wonAmt), s: `粗利 ${yenMan(wonAmt * (1 - OPERATOR.cogsRate))}` },
              { l: "失注", v: yenMan(lostAmt), s: `失注率 ${pct(lostAmt / (lostAmt + wonAmt), 0)}（金額ベース）` },
              { l: "自動起票率", v: pct(autoRate, 0), s: "期限アラートから人手を介さず起票された割合" },
            ].map((k) => (
              <div key={k.l} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
                <div className="text-[11.5px] font-medium text-slate-500">{k.l}</div>
                <div className="num mt-1 text-2xl font-semibold text-slate-900">{k.v}</div>
                <div className="mt-1 text-[11px] leading-snug text-slate-500">{k.s}</div>
              </div>
            ))}
          </div>

          <Card title={`受注一覧（${rows.length}件）`} desc="「自動」は期限アラートから人手を介さず起票されたもの。預託契約の顧客は承認プロセスそのものが不要になる。">
            <div className="max-h-[520px] overflow-auto rounded-lg border border-slate-100">
              <table className="w-full min-w-[840px]">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    <Th>受注番号</Th>
                    <Th>顧客</Th>
                    <Th>契約</Th>
                    <Th align="right">明細</Th>
                    <Th align="right">金額</Th>
                    <Th align="right">粗利</Th>
                    <Th>納期</Th>
                    <Th>ステージ</Th>
                    <Th>起票</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => {
                    const c = customerById(o.customerId);
                    return (
                      <tr key={o.id} className={o.stage === "失注" ? "bg-rose-50/50" : "hover:bg-slate-50"}>
                        <Td className="num text-slate-400">{o.id}</Td>
                        <Td>
                          <span className="font-medium text-slate-900">{c.name}</span>
                          <div className="text-[10.5px] text-slate-400">{c.owner}</div>
                          {o.lostReason && <div className="text-[10.5px] text-rose-600">{o.lostReason}</div>}
                        </Td>
                        <Td>{c.contract === "預託サブスク" ? <Badge tone="green">預託</Badge> : <Badge tone="slate">売切り</Badge>}</Td>
                        <Td align="right" className="text-slate-500">{o.lines}</Td>
                        <Td align="right" className="font-medium">{yen(o.amount)}</Td>
                        <Td align="right" className="text-teal-700">{yen(o.amount * (1 - OPERATOR.cogsRate))}</Td>
                        <Td className="num text-slate-500">{o.dueAt}</Td>
                        <Td><Badge tone={STAGE_TONE[o.stage]}>{o.stage}</Badge></Td>
                        <Td>{o.auto ? <span className="text-[11px] text-teal-700">自動</span> : <span className="text-[11px] text-slate-400">手動</span>}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length === 0 && <Empty>該当する受注はありません。</Empty>}
            </div>
          </Card>

          <Card className="mt-5" title="失注要因" desc="台帳を握っていても、価格で負ければ受注は取れない。何で負けているかを金額で押さえる。">
            <table className="w-full">
              <thead><tr><Th>要因</Th><Th className="w-1/2">金額構成</Th><Th align="right">件数</Th><Th align="right">金額</Th></tr></thead>
              <tbody>
                {lostReasons.map(([k, v]) => (
                  <tr key={k} className="hover:bg-slate-50">
                    <Td className="font-medium text-slate-800">{k}</Td>
                    <Td>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full bg-rose-400" style={{ width: `${(v.amt / lostReasons[0][1].amt) * 100}%` }} />
                      </div>
                    </Td>
                    <Td align="right">{v.n}</Td>
                    <Td align="right">{yen(v.amt)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4">
              <DemoNote>
                価格で負けた案件は、次の満了日が台帳に残っているので<strong>3〜5年後に必ずもう一度チャンスが来る</strong>。
                通常の卸取引では失注した時点で顧客との接点が切れるが、台帳を無償で提供している限り接点は残る。これが「システムを無料で配る」ことの回収経路になる。
              </DemoNote>
            </div>
          </Card>
        </>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { l: "引取り実績（過去5ヶ月）", v: `${PICKUPS.length}件`, s: "期限切れ・入替に伴う回収" },
              { l: "引取り手数料 収入", v: yenMan(pickupFees), s: `1件あたり平均 ${yen(pickupFees / PICKUPS.length)}` },
              { l: "フードバンク寄贈", v: `${PICKUPS.filter((p) => p.route === "フードバンク寄贈").length}件`, s: "寄贈証明書を発行。顧客のCSR報告に転用される" },
              { l: "産廃処理", v: `${PICKUPS.filter((p) => p.route === "産業廃棄物").length}件`, s: "マニフェスト管理まで代行" },
            ].map((k) => (
              <div key={k.l} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
                <div className="text-[11.5px] font-medium text-slate-500">{k.l}</div>
                <div className="num mt-1 text-2xl font-semibold text-slate-900">{k.v}</div>
                <div className="mt-1 text-[11px] leading-snug text-slate-500">{k.s}</div>
              </div>
            ))}
          </div>

          <Card
            title="引取り・逆物流の実績"
            desc="期限切れ品の処理は、顧客にとって面倒で、社内では誰もやりたがらない仕事。ここを引き受けると、更新受注が確実にセットで付いてくる。"
          >
            <table className="w-full min-w-[680px]">
              <thead>
                <tr><Th>受付番号</Th><Th>顧客</Th><Th>日付</Th><Th>処理経路</Th><Th align="right">数量</Th><Th align="right">手数料</Th><Th>証明書</Th></tr>
              </thead>
              <tbody>
                {PICKUPS.map((p) => {
                  const c = customerById(p.customerId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <Td className="num text-slate-400">{p.id}</Td>
                      <Td className="font-medium text-slate-900">{c.name}</Td>
                      <Td className="num text-slate-500">{p.date}</Td>
                      <Td>
                        <Badge tone={p.route === "フードバンク寄贈" ? "violet" : p.route === "産業廃棄物" ? "rose" : "green"}>
                          {p.route}
                        </Badge>
                      </Td>
                      <Td align="right">{p.qty.toLocaleString()}</Td>
                      <Td align="right">{yen(p.fee)}</Td>
                      <Td>{p.cert ? <span className="text-[11px] text-teal-700">発行済</span> : <span className="text-[11px] text-slate-400">—</span>}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-4">
              <DemoNote>
                <b className="text-slate-700">この機能の本当の狙いは手数料ではない。</b>
                期限切れ品を引き取りに行くタイミングは、顧客が更新を決める瞬間そのもの。
                トラックが着いた時点で入れ替え品も積んでいる、という運用にすれば、競合が見積を出す余地がなくなる。
                寄贈証明書は顧客のサステナビリティ報告に載るので、担当者が上司に説明しやすい理由も同時に渡せる。
              </DemoNote>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
