"use client";

import { useMemo, useState } from "react";
import { PageHead } from "@/components/Shell";
import { Badge, Card, DemoNote, RatioBar, Td, Th } from "@/components/ui";
import { coverage, pct, personsAt, yenMan, yen } from "@/lib/calc";
import { SITES, STANDARDS, type Standard } from "@/lib/data";

function cellColor(r: number) {
  if (r >= 1) return "bg-emerald-500 text-white";
  if (r >= 0.85) return "bg-emerald-200 text-emerald-900";
  if (r >= 0.6) return "bg-amber-200 text-amber-900";
  if (r >= 0.3) return "bg-orange-300 text-orange-950";
  return "bg-rose-400 text-white";
}

export default function CoveragePage() {
  const [stdId, setStdId] = useState("tokyo3");
  const [days, setDays] = useState<number | null>(null);
  const [visitors, setVisitors] = useState(true);
  const [site, setSite] = useState<string>("osk");
  const [mode, setMode] = useState<"effective" | "book">("effective");

  const base = STANDARDS.find((s) => s.id === stdId)!;
  const std: Standard = useMemo(() => ({ ...base, days: days ?? base.days }), [base, days]);

  const cells = useMemo(() => coverage(std), [std]);
  const lines = std.lines;

  const get = (siteId: string, key: string) => cells.find((c) => c.siteId === siteId && c.line.key === key)!;
  const ratioOf = (siteId: string, key: string) => {
    const c = get(siteId, key);
    return mode === "effective" ? c.ratio : c.bookRatio;
  };

  const totalShortCost = cells.reduce((a, c) => a + c.refillCost, 0);
  const detail = cells.filter((c) => c.siteId === site);
  const s = SITES.find((x) => x.id === site)!;
  const persons = visitors ? personsAt(site) : s.headcount;

  return (
    <>
      <PageHead
        title="充足率・基準管理"
        desc="「必要量 = 対象人数 × 原単位 × 備蓄日数」を基準セットとして持ち、拠点×品目で過不足を可視化します。リース資産管理でいう稼働率にあたる指標です。"
      />

      <Card
        title="算定条件"
        desc="基準セットを切り替えると、必要量・不足額・追加投資がその場で再計算されます。"
        className="mb-5"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-medium text-slate-600">基準セット</span>
            <select
              value={stdId}
              onChange={(e) => {
                setStdId(e.target.value);
                setDays(null);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12.5px] text-slate-800"
            >
              {STANDARDS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[10.5px] text-slate-400">出典：{base.source}</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11.5px] font-medium text-slate-600">
              備蓄日数 <span className="num font-semibold text-slate-900">{std.days}日</span>
            </span>
            <input
              type="range"
              min={1}
              max={10}
              value={std.days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
            <span className="mt-1 block text-[10.5px] text-slate-400">
              基準値 {base.days}日{days !== null && days !== base.days ? "（上書き中）" : ""}
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11.5px] font-medium text-slate-600">対象人数</span>
            <button
              onClick={() => setVisitors((v) => !v)}
              className={`w-full rounded-lg border px-2.5 py-1.5 text-left text-[12.5px] ${
                visitors ? "border-orange-300 bg-orange-50 text-orange-900" : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {visitors ? "在籍 × 来客係数（推奨）" : "在籍のみ"}
            </button>
            <span className="mt-1 block text-[10.5px] text-slate-400">来客・協力会社常駐分を 5〜15% 上乗せ</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11.5px] font-medium text-slate-600">在庫の見方</span>
            <div className="flex rounded-lg border border-slate-300 p-0.5">
              {(["effective", "book"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-md px-2 py-1 text-[12px] ${
                    mode === m ? "bg-slate-900 font-medium text-white" : "text-slate-600"
                  }`}
                >
                  {m === "effective" ? "実効（期限内）" : "帳簿"}
                </button>
              ))}
            </div>
            <span className="mt-1 block text-[10.5px] text-slate-400">実効＝期限切れロットを除外</span>
          </label>
        </div>
      </Card>

      <Card
        title={`充足率ヒートマップ（${mode === "effective" ? "実効在庫" : "帳簿在庫"} / ${std.days}日基準）`}
        desc="セルをクリックすると下部に内訳が表示されます。100%を下回るセルが計画の対象です。"
        right={<span>不足解消に必要な追加投資 <b className="num text-rose-600">{yenMan(totalShortCost)}</b></span>}
        className="mb-5"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-separate border-spacing-0.5">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-2 py-1.5 text-left text-[11px] font-semibold text-slate-500">拠点</th>
                {lines.map((l) => (
                  <th key={l.key} className="px-1 py-1.5 text-center text-[10.5px] font-semibold text-slate-500">
                    <div>{l.label}</div>
                    <div className="font-normal text-slate-400">
                      {l.basis === "perPersonDay"
                        ? `${l.value}${l.unit}/人日`
                        : l.basis === "perPerson"
                          ? `${l.value}${l.unit}/人`
                          : `1/${l.n}人`}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SITES.map((x) => (
                <tr key={x.id}>
                  <th className="sticky left-0 z-10 bg-white px-2 py-1 text-left text-[12px] font-medium text-slate-800">
                    <button onClick={() => setSite(x.id)} className={site === x.id ? "text-orange-600 underline" : "hover:text-sky-600"}>
                      {x.name}
                    </button>
                    <div className="num text-[10px] font-normal text-slate-400">
                      想定 {visitors ? personsAt(x.id) : x.headcount}名
                    </div>
                  </th>
                  {lines.map((l) => {
                    const r = ratioOf(x.id, l.key);
                    return (
                      <td key={l.key} className="p-0">
                        <button
                          onClick={() => setSite(x.id)}
                          className={`num h-11 w-full rounded text-[12px] font-semibold transition hover:opacity-80 ${cellColor(r)}`}
                          title={`${x.name} / ${l.label}：${pct(r, 1)}`}
                        >
                          {Math.round(r * 100)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <span className="font-medium">凡例</span>
          {[
            ["100%以上", "bg-emerald-500"],
            ["85〜99%", "bg-emerald-200"],
            ["60〜84%", "bg-amber-200"],
            ["30〜59%", "bg-orange-300"],
            ["30%未満", "bg-rose-400"],
          ].map(([label, c]) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <span className={`h-3 w-4 rounded-sm ${c}`} />
              {label}
            </span>
          ))}
        </div>
      </Card>

      <Card
        title={`${s.name} の内訳`}
        desc={`在籍 ${s.headcount}名・想定滞留 ${persons}名（来客係数 ${s.visitorFactor}）／ 保管：${s.warehouse}`}
        right={
          <span>
            不足解消額 <b className="num text-rose-600">{yenMan(detail.reduce((a, c) => a + c.refillCost, 0))}</b>
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr>
                <Th>品目カテゴリ</Th>
                <Th>原単位</Th>
                <Th align="right">必要量</Th>
                <Th align="right">帳簿在庫</Th>
                <Th align="right">実効在庫</Th>
                <Th className="w-[150px]">実効充足率</Th>
                <Th align="right">不足量</Th>
                <Th align="right">補充概算</Th>
              </tr>
            </thead>
            <tbody>
              {detail.map((c) => {
                const gap = c.book - c.effective;
                return (
                  <tr key={c.line.key} className="hover:bg-slate-50">
                    <Td>
                      <span className="font-medium text-slate-900">{c.line.label}</span>
                      {c.line.critical === 3 && <span className="ml-1.5"><Badge tone="rose">最重要</Badge></span>}
                    </Td>
                    <Td className="text-[11.5px] text-slate-500">
                      {c.line.basis === "perPersonDay"
                        ? `${c.line.value}${c.line.unit} / 人・日 × ${std.days}日`
                        : c.line.basis === "perPerson"
                          ? `${c.line.value}${c.line.unit} / 人`
                          : `1${c.line.unit} / ${c.line.n}人`}
                    </Td>
                    <Td align="right">{Math.round(c.required).toLocaleString()}<span className="text-[10px] text-slate-400"> {c.line.unit}</span></Td>
                    <Td align="right" className="text-slate-500">{Math.round(c.book).toLocaleString()}</Td>
                    <Td align="right" className={gap > 0 ? "font-medium text-rose-600" : ""}>
                      {Math.round(c.effective).toLocaleString()}
                      {gap > 0 && <span className="ml-1 text-[10px] font-normal text-rose-400">▲{Math.round(gap).toLocaleString()}</span>}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <RatioBar ratio={c.ratio} />
                        <span className="num w-10 shrink-0 text-right text-[12px] font-medium">{pct(c.ratio, 0)}</span>
                      </div>
                    </Td>
                    <Td align="right" className={c.shortfall > 0 ? "text-rose-600" : "text-slate-300"}>
                      {c.shortfall > 0 ? Math.round(c.shortfall).toLocaleString() : "—"}
                    </Td>
                    <Td align="right">{c.refillCost > 0 ? yen(c.refillCost) : "—"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <DemoNote>
            <b className="text-slate-700">読み方：</b>「帳簿在庫」と「実効在庫」の差が、期限切れのまま棚に残っている量です。
            従来のExcel管理では帳簿の数字しか見えないため、発災して初めて使えないと分かります。SONAEはロット単位で期限を持つため、
            この差を平時から常時可視化します。
          </DemoNote>
        </div>
      </Card>
    </>
  );
}
