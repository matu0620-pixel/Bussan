"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHead } from "@/components/Shell";
import { Badge, Card, DemoNote, Td, Th } from "@/components/ui";
import { coverage, pct, stayingAt, survival, yenMan } from "@/lib/calc";
import { DISPATCHES, LOTS, RESPONSES, SITES, STANDARDS, itemById, siteById } from "@/lib/data";

const TARGET_SITES = ["hq", "yok"];

export default function CommandPage() {
  const live = DISPATCHES.find((d) => d.status === "対応中")!;
  const [site, setSite] = useState("hq");
  const [hours, setHours] = useState(0);
  const [extra, setExtra] = useState(0); // 受け入れる帰宅困難者

  const staying = stayingAt(site);
  const persons = staying.total + extra;
  const rows = survival(site, persons);

  const consumed = hours / 24;
  const withElapsed = rows.map((r) => {
    if (r.days === null) return { ...r, remaining: r.stock, remainingDays: null as number | null };
    const used = r.perDay * consumed;
    const remaining = Math.max(0, r.stock - used);
    return { ...r, remaining, remainingDays: r.perDay ? remaining / r.perDay : null };
  });

  const critical = withElapsed
    .filter((r) => r.remainingDays !== null)
    .sort((a, b) => (a.remainingDays ?? 0) - (b.remainingDays ?? 0))[0];

  // 他拠点の余剰（融通候補）
  const cells = useMemo(() => coverage(STANDARDS[0]), []);
  const surplus = useMemo(() => {
    if (!critical) return [];
    return SITES.filter((s) => s.id !== site)
      .map((s) => {
        const c = cells.find((x) => x.siteId === s.id && x.line.key === critical.line.key)!;
        return { site: s, surplus: Math.max(0, c.effective - c.required), ratio: c.ratio };
      })
      .filter((x) => x.surplus > 0)
      .sort((a, b) => b.surplus - a.surplus);
  }, [cells, critical, site]);

  const answeredRate = (() => {
    const pool = RESPONSES.filter((r) => TARGET_SITES.includes(r.siteId));
    return pool.filter((r) => r.safety !== "未回答").length / pool.length;
  })();

  const injured = RESPONSES.filter((r) => TARGET_SITES.includes(r.siteId) && (r.safety === "軽傷" || r.safety === "重傷")).length;

  return (
    <>
      <PageHead
        title="災害対策本部"
        desc="安否確認の回答（誰がどこにいるか）と備蓄台帳（どこに何がいくつあるか）を掛け合わせ、拠点ごとの「あと何日もつか」をリアルタイムに算出します。両者を別々のツールで持っていると、この数字は出せません。"
        right={
          <Link href={`/safety/${live.id}`} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-700">
            回答集計 →
          </Link>
        }
      />

      <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" />
          <span className="text-[14px] font-semibold text-rose-900">{live.title}</span>
          <Badge tone="rose">発災から {Math.floor(hours / 24)}日{hours % 24}時間</Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["安否回答率", pct(answeredRate, 1)],
            ["負傷者", `${injured}名`],
            ["未回答", `${RESPONSES.filter((r) => TARGET_SITES.includes(r.siteId) && r.safety === "未回答").length}名`],
            ["対象拠点", live.targetSites.map((s) => siteById(s).short).join("・")],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-[11px] text-rose-800/70">{k}</div>
              <div className="num text-lg font-semibold text-rose-900">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {SITES.filter((s) => TARGET_SITES.includes(s.id)).map((s) => (
          <button
            key={s.id}
            onClick={() => setSite(s.id)}
            className={`rounded-lg px-3.5 py-1.5 text-[12.5px] ${site === s.id ? "bg-slate-900 font-medium text-white" : "border border-slate-300 bg-white text-slate-700"}`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="滞留人数の推計" desc="回答実績に、未回答者の滞留率按分と来客・協力会社分を加えた値です。">
          <ul className="space-y-2.5 text-[12.5px]">
            {[
              ["社内と回答（確定）", staying.confirmed, "text-slate-900"],
              ["未回答者からの推計", staying.estimated, "text-amber-600"],
              ["来客・協力会社（係数）", staying.visitors, "text-slate-500"],
              ["受入れ帰宅困難者", extra, "text-sky-600"],
            ].map(([l, n, c]) => (
              <li key={l as string} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-600">{l}</span>
                <span className={`num font-semibold ${c}`}>{n as number} 名</span>
              </li>
            ))}
            <li className="flex items-center justify-between pt-1">
              <span className="font-semibold text-slate-900">配給対象合計</span>
              <span className="num text-xl font-bold text-slate-900">{persons} 名</span>
            </li>
          </ul>

          <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-medium text-slate-600">
                発災からの経過時間：<span className="num font-semibold text-slate-900">{hours}時間</span>
              </span>
              <input type="range" min={0} max={96} step={6} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full accent-rose-500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-medium text-slate-600">
                帰宅困難者の受入れ：<span className="num font-semibold text-slate-900">{extra}名</span>
              </span>
              <input type="range" min={0} max={200} step={10} value={extra} onChange={(e) => setExtra(Number(e.target.value))} className="w-full accent-sky-500" />
              <span className="mt-1 block text-[10.5px] text-slate-400">条例上、企業は一時滞在施設としての協力を求められる場合があります</span>
            </label>
          </div>
        </Card>

        <Card
          className="lg:col-span-2"
          title="残存日数（この拠点で、あと何日もつか）"
          desc="期限切れロットを除いた実効在庫のみで計算しています。"
          right={critical && <span>最初に枯渇：<b className="text-rose-600">{critical.line.label}</b></span>}
        >
          <table className="w-full">
            <thead>
              <tr>
                <Th>品目</Th>
                <Th align="right">1日消費</Th>
                <Th align="right">実効在庫</Th>
                <Th align="right">残量</Th>
                <Th className="w-[190px]">残存日数（3日基準）</Th>
              </tr>
            </thead>
            <tbody>
              {withElapsed.map((r) => {
                const days = r.remainingDays;
                const w = days === null ? 0 : Math.min(days / 5, 1) * 100;
                const tone = days === null ? "" : days < 1 ? "bg-rose-500" : days < 3 ? "bg-amber-400" : "bg-emerald-500";
                return (
                  <tr key={r.line.key} className={days !== null && days < 1 ? "bg-rose-50" : "hover:bg-slate-50"}>
                    <Td>
                      <span className="font-medium text-slate-900">{r.line.label}</span>
                      {r.line.critical === 3 && <span className="ml-1.5"><Badge tone="rose">最重要</Badge></span>}
                    </Td>
                    <Td align="right" className="text-slate-500">
                      {r.perDay ? `${Math.round(r.perDay).toLocaleString()} ${r.line.unit}` : "—"}
                    </Td>
                    <Td align="right" className="text-slate-500">{Math.round(r.stock).toLocaleString()}</Td>
                    <Td align="right" className="font-medium">{Math.round(r.remaining).toLocaleString()}<span className="text-[10px] text-slate-400"> {r.line.unit}</span></Td>
                    <Td>
                      {days === null ? (
                        <span className={`text-[11.5px] ${(r.coveredPersons ?? 0) >= persons ? "text-emerald-600" : "text-amber-600"}`}>
                          {r.coveredPersons?.toLocaleString()}名分 / 必要 {persons}名（
                          {pct(Math.min(1, (r.coveredPersons ?? 0) / persons), 0)}）
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-slate-100">
                            <div className={`h-2 rounded-full ${tone}`} style={{ width: `${w}%` }} />
                          </div>
                          <span className={`num w-14 shrink-0 text-right text-[12px] font-semibold ${days < 1 ? "text-rose-600" : days < 3 ? "text-amber-600" : "text-emerald-600"}`}>
                            {days.toFixed(1)}日
                          </span>
                        </div>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4">
            <DemoNote>
              <b className="text-slate-700">これが統合の価値です。</b>
              スライダーで受入れ人数や経過時間を動かすと、枯渇する品目と時期が入れ替わります。
              安否確認ツールと備蓄管理台帳が別々だと、対策本部は「何人残っているか」と「何が何個あるか」を人力で突き合わせることになり、
              初動の数時間をそこに費やします。
            </DemoNote>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="拠点間の融通候補" desc={critical ? `不足している「${critical.line.label}」に余剰のある拠点` : ""}>
          {surplus.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-slate-400">余剰のある拠点はありません。外部調達が必要です。</p>
          ) : (
            <table className="w-full">
              <thead><tr><Th>拠点</Th><Th align="right">充足率</Th><Th align="right">余剰量</Th><Th align="right">操作</Th></tr></thead>
              <tbody>
                {surplus.map((x) => (
                  <tr key={x.site.id} className="hover:bg-slate-50">
                    <Td>
                      <span className="font-medium text-slate-800">{x.site.name}</span>
                      <div className="text-[10.5px] text-slate-400">{x.site.pref}</div>
                    </Td>
                    <Td align="right" className="text-emerald-600">{pct(x.ratio, 0)}</Td>
                    <Td align="right">{Math.round(x.surplus).toLocaleString()} {critical?.line.unit}</Td>
                    <Td align="right">
                      <button className="rounded-md border border-slate-300 px-2 py-1 text-[11.5px] text-slate-700 hover:bg-slate-50">移送を起票</button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="配給ログ" desc="配給を記録すると台帳から自動で払い出され、復旧後はそのまま補充発注リストになります。">
          <table className="w-full">
            <thead><tr><Th>時刻</Th><Th>品目</Th><Th align="right">数量</Th><Th>担当</Th></tr></thead>
            <tbody>
              {[
                ["13:05", "保存水 500ml", "-174 本", "施設管理"],
                ["13:05", "アルファ化米（白飯）", "-87 食", "施設管理"],
                ["12:40", "アルミブランケット", "-87 枚", "総務人事部"],
                ["12:20", "救急セット（法定準拠）", "-1 式", "救護班"],
              ].map((r) => (
                <tr key={r[0] + r[1]} className="hover:bg-slate-50">
                  <Td className="num text-slate-500">{r[0]}</Td>
                  <Td className="font-medium text-slate-800">{r[1]}</Td>
                  <Td align="right" className="text-rose-600">{r[2]}</Td>
                  <Td className="text-slate-500">{r[3]}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white">配給を記録</button>
            <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-[12px] text-slate-700">補充発注リストを出力</button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            現在の在庫評価額（この拠点）：
            <b className="num text-slate-700">
              {yenMan(LOTS.filter((l) => l.siteId === site && l.status === "in_stock").reduce((a, l) => a + l.qty * itemById(l.itemId).unitCost, 0))}
            </b>
          </p>
        </Card>
      </div>
    </>
  );
}
