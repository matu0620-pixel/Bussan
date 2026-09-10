"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { PageHead } from "@/components/Shell";
import { Badge, Card, Empty, Td, Th } from "@/components/ui";
import { pct, tally } from "@/lib/calc";
import { BOARD, DISPATCHES, RESPONSES, siteById } from "@/lib/data";

const SAFETY_TONE = { 無事: "bg-emerald-500", 軽傷: "bg-amber-400", 重傷: "bg-rose-500", 未回答: "bg-slate-300" } as const;

export default function DispatchDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const d = DISPATCHES.find((x) => x.id === id);
  const [filter, setFilter] = useState<"all" | "unanswered" | "injured" | "family">("all");
  const [site, setSite] = useState("all");

  const rows = useMemo(() => {
    if (!d || d.id !== "D2026-014") return [];
    let r = RESPONSES;
    if (site !== "all") r = r.filter((x) => x.siteId === site);
    if (filter === "unanswered") r = r.filter((x) => x.safety === "未回答");
    if (filter === "injured") r = r.filter((x) => x.safety === "軽傷" || x.safety === "重傷");
    if (filter === "family") r = r.filter((x) => x.family !== "全員無事");
    return r;
  }, [d, filter, site]);

  if (!d) return <Empty>指定された発報が見つかりません。</Empty>;

  const isLive = d.id === "D2026-014";
  const pool = site === "all" ? RESPONSES : RESPONSES.filter((r) => r.siteId === site);
  const safetyCount = tally(pool, (r) => r.safety);
  const workCount = tally(pool, (r) => r.work);
  const placeCount = tally(pool, (r) => r.place);
  const deptCount = useMemo(() => {
    const m = new Map<string, { total: number; answered: number }>();
    for (const r of pool) {
      const e = m.get(r.dept) ?? { total: 0, answered: 0 };
      e.total++;
      if (r.safety !== "未回答") e.answered++;
      m.set(r.dept, e);
    }
    return [...m.entries()].sort((a, b) => a[1].answered / a[1].total - b[1].answered / b[1].total);
  }, [pool]);

  return (
    <>
      <PageHead
        title={d.title}
        desc={`${d.id}｜${d.kind}｜${d.sentAt} 送信｜トリガー：${d.trigger}`}
        right={
          <div className="flex items-center gap-2">
            <Link href="/safety" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-700">← 一覧</Link>
            {isLive && <Link href="/command" className="rounded-lg bg-rose-600 px-3 py-1.5 text-[12px] font-medium text-white">対策本部 →</Link>}
          </div>
        }
      />

      {!isLive ? (
        <Card title="集計サマリ">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["対象人数", `${d.targets}名`],
              ["回答数", `${d.answered}名`],
              ["回答率", pct(d.answered / d.targets, 1)],
              ["通知チャネル", d.channels.join(" / ")],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[11.5px] text-slate-500">{k}</div>
                <div className="num mt-0.5 text-lg font-semibold text-slate-900">{v}</div>
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-lg bg-slate-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-slate-600">
            この発報は完了済みです。個票レベルの集計デモは進行中の発報「D2026-014」でご覧いただけます。
          </p>
        </Card>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              { l: "回答率", v: pct((pool.length - (safetyCount.未回答 ?? 0)) / pool.length, 1), t: "text-slate-900" },
              { l: "無事", v: `${safetyCount.無事 ?? 0}名`, t: "text-emerald-600" },
              { l: "軽傷", v: `${safetyCount.軽傷 ?? 0}名`, t: "text-amber-600" },
              { l: "重傷", v: `${safetyCount.重傷 ?? 0}名`, t: "text-rose-600" },
              { l: "未回答", v: `${safetyCount.未回答 ?? 0}名`, t: "text-slate-400" },
            ].map((k) => (
              <div key={k.l} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="text-[11.5px] font-medium text-slate-500">{k.l}</div>
                <div className={`num mt-0.5 text-2xl font-semibold ${k.t}`}>{k.v}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2" title="回答内訳" desc="安否・出社可否・現在地。出社可否と現在地が対策本部の要員計画に直結します。">
              <div className="space-y-5">
                {[
                  { title: "安否", data: safetyCount as Record<string, number>, order: ["無事", "軽傷", "重傷", "未回答"] },
                  { title: "出社可否", data: workCount as Record<string, number>, order: ["出社済・社内", "出社可", "在宅対応可", "対応不可"] },
                  { title: "現在地", data: placeCount as Record<string, number>, order: ["社内", "自宅", "外出先", "移動中"] },
                ].map((g) => (
                  <div key={g.title}>
                    <div className="mb-1.5 text-[11.5px] font-semibold text-slate-700">{g.title}</div>
                    <div className="flex h-7 w-full overflow-hidden rounded-lg">
                      {g.order.map((k, i) => {
                        const n = g.data[k] ?? 0;
                        if (!n) return null;
                        const colors = ["bg-slate-800", "bg-slate-600", "bg-slate-400", "bg-slate-300"];
                        const cls = g.title === "安否" ? SAFETY_TONE[k as keyof typeof SAFETY_TONE] : colors[i];
                        return (
                          <div key={k} className={`${cls} flex items-center justify-center`} style={{ width: `${(n / pool.length) * 100}%` }} title={`${k} ${n}名`}>
                            {n / pool.length > 0.09 && <span className="num px-1 text-[10.5px] font-medium text-white">{n}</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      {g.order.map((k, i) => {
                        const n = g.data[k] ?? 0;
                        if (!n) return null;
                        const colors = ["bg-slate-800", "bg-slate-600", "bg-slate-400", "bg-slate-300"];
                        const cls = g.title === "安否" ? SAFETY_TONE[k as keyof typeof SAFETY_TONE] : colors[i];
                        return (
                          <span key={k} className="inline-flex items-center gap-1.5">
                            <span className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
                            {k} <span className="num">{n}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="掲示板" desc="対策本部からの指示を全員に共有">
              <ul className="space-y-3">
                {BOARD.map((b, i) => (
                  <li key={i} className="rounded-lg border border-slate-200 px-3 py-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11.5px] font-semibold text-slate-800">{b.by}</span>
                      <span className="num text-[10.5px] text-slate-400">{b.at}</span>
                    </div>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">{b.text}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <input placeholder="全員へ指示を投稿…" className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[12px]" />
                <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white">投稿</button>
              </div>
            </Card>
          </div>

          <Card
            className="mt-5"
            title="部署別 回答状況"
            desc="回答率の低い部署から表示。部門長へのエスカレーション対象です。"
          >
            <table className="w-full">
              <thead>
                <tr><Th>部署</Th><Th className="w-1/2">回答率</Th><Th align="right">回答 / 対象</Th><Th align="right">未回答</Th></tr>
              </thead>
              <tbody>
                {deptCount.map(([dept, v]) => {
                  const r = v.answered / v.total;
                  return (
                    <tr key={dept} className="hover:bg-slate-50">
                      <Td className="font-medium text-slate-800">{dept}</Td>
                      <Td>
                        <div className="h-1.5 w-full rounded-full bg-slate-100">
                          <div className={`h-1.5 rounded-full ${r >= 0.9 ? "bg-emerald-500" : r >= 0.8 ? "bg-amber-400" : "bg-rose-500"}`} style={{ width: `${r * 100}%` }} />
                        </div>
                      </Td>
                      <Td align="right">{v.answered} / {v.total}</Td>
                      <Td align="right" className={v.total - v.answered > 0 ? "font-medium text-rose-600" : "text-slate-300"}>
                        {v.total - v.answered || "—"}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <Card
            className="mt-5"
            title={`個票（${rows.length}件）`}
            desc="未回答者・負傷者・家族に被害がある社員をフィルタして、優先的にフォローします。"
            right={
              <div className="flex flex-wrap gap-1.5">
                <select value={site} onChange={(e) => setSite(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11.5px]">
                  <option value="all">全拠点</option>
                  <option value="hq">東京本社</option>
                  <option value="yok">横浜テクノセンター</option>
                </select>
                {([["all", "すべて"], ["unanswered", "未回答"], ["injured", "負傷"], ["family", "家族に懸念"]] as const).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`rounded-lg px-2.5 py-1 text-[11.5px] ${filter === k ? "bg-slate-900 font-medium text-white" : "border border-slate-300 bg-white text-slate-600"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            }
          >
            <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-100">
              <table className="w-full min-w-[720px]">
                <thead className="sticky top-0 bg-slate-50">
                  <tr><Th>氏名</Th><Th>拠点 / 部署</Th><Th>安否</Th><Th>現在地</Th><Th>出社可否</Th><Th>家族</Th><Th>自宅被害</Th><Th>回答時刻</Th></tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((r) => (
                    <tr key={r.id} className={r.safety === "重傷" ? "bg-rose-50" : "hover:bg-slate-50"}>
                      <Td>
                        <span className="font-medium text-slate-800">{r.name}</span>
                        {r.comment && <div className="text-[10.5px] text-rose-600">{r.comment}</div>}
                      </Td>
                      <Td className="text-slate-500">{siteById(r.siteId).short} / {r.dept}</Td>
                      <Td>
                        <Badge tone={r.safety === "無事" ? "green" : r.safety === "軽傷" ? "amber" : r.safety === "重傷" ? "rose" : "slate"}>{r.safety}</Badge>
                      </Td>
                      <Td className="text-slate-600">{r.safety === "未回答" ? "—" : r.place}</Td>
                      <Td className="text-slate-600">{r.safety === "未回答" ? "—" : r.work}</Td>
                      <Td className={r.family !== "全員無事" ? "text-amber-700" : "text-slate-500"}>{r.safety === "未回答" ? "—" : r.family}</Td>
                      <Td className="text-slate-500">{r.safety === "未回答" ? "—" : r.home}</Td>
                      <Td className="num text-slate-400">{r.answeredAt ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && <Empty>該当者はいません。</Empty>}
            </div>
            {rows.length > 200 && <p className="mt-2 text-[11px] text-slate-400">先頭200件を表示しています。</p>}
          </Card>
        </>
      )}
    </>
  );
}
