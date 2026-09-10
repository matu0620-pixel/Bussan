import Link from "next/link";
import { PageHead } from "@/components/Shell";
import { Badge, Card, RatioBar, Stat, Td, Th } from "@/components/ui";
import {
  BAND_META,
  annualizedCost,
  bottleneck,
  coverage,
  daysUntil,
  expiredValue,
  expiryBand,
  pct,
  siteCoverageScore,
  yen,
  yenMan,
} from "@/lib/calc";
import { COMPANY, DISPATCHES, DRILLS, LOTS, MOVEMENTS, SITES, STANDARDS, itemById, siteById } from "@/lib/data";

export default function Dashboard() {
  const std = STANDARDS[0];
  const cells = coverage(std);

  const totalRequired = cells.reduce((a, c) => a + c.required, 0);
  const totalEffective = cells.reduce((a, c) => a + Math.min(c.effective, c.required), 0);
  const overall = totalEffective / totalRequired;

  const shortfallCost = cells.reduce((a, c) => a + c.refillCost, 0);
  const expired = expiredValue();
  const annual = annualizedCost();

  const soon = LOTS.filter((l) => {
    const d = daysUntil(l.expiresAt);
    return d !== null && d >= 0 && d <= 90;
  });
  const soonValue = soon.reduce((a, l) => a + l.qty * itemById(l.itemId).unitCost, 0);

  const live = DISPATCHES.find((d) => d.status === "対応中")!;
  const lastDrill = DRILLS[0];

  const alerts = LOTS.filter((l) => {
    const d = daysUntil(l.expiresAt);
    return d !== null && d <= 90;
  })
    .sort((a, b) => (daysUntil(a.expiresAt) ?? 0) - (daysUntil(b.expiresAt) ?? 0))
    .slice(0, 8);

  return (
    <>
      <PageHead
        title="ダッシュボード"
        desc={`${COMPANY.name}｜全${SITES.length}拠点 / 在籍${COMPANY.headcount}名　適用基準：${std.name}`}
        right={
          <div className="text-right text-[11.5px] text-slate-500">
            <div>基準日 2026年9月10日（木）</div>
            <div className="mt-0.5">最終同期 09:00 JST</div>
          </div>
        }
      />

      {/* 進行中インシデント */}
      <Link
        href="/command"
        className="mb-5 block rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white px-5 py-4 transition hover:border-rose-300"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-rose-500" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-rose-900">{live.title}</span>
              <Badge tone="rose">対応中</Badge>
              <Badge tone="slate">{live.kind}</Badge>
            </div>
            <p className="mt-1 text-[11.5px] text-slate-600">
              {live.sentAt} 発報 ／ 対象 {live.targets}名・回答 {live.answered}名（{pct(live.answered / live.targets, 1)}）
              ／ 対象拠点 {live.targetSites.map((s) => siteById(s).short).join("・")}
            </p>
          </div>
          <span className="rounded-lg bg-rose-600 px-3 py-1.5 text-[12px] font-medium text-white">対策本部を開く →</span>
        </div>
      </Link>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat
          label="実効充足率（全社）"
          value={pct(overall, 1)}
          tone={overall >= 1 ? "good" : overall >= 0.8 ? "warn" : "bad"}
          sub={`期限切れを除外した実力値。帳簿上は ${pct(
            cells.reduce((a, c) => a + Math.min(c.book, c.required), 0) / totalRequired,
            1,
          )}`}
          href="/coverage"
        />
        <Stat
          label="不足解消に必要な追加投資"
          value={yenMan(shortfallCost)}
          tone="warn"
          sub="全拠点・全品目の不足量を現行単価で補充した場合"
          href="/coverage"
        />
        <Stat
          label="期限切れ在庫（滞留）"
          value={yenMan(expired)}
          tone="bad"
          sub={`${LOTS.filter((l) => expiryBand(l) === "expired").length} ロット。台帳上は在庫だが実効ゼロ`}
          href="/stock?band=expired"
        />
        <Stat
          label="90日以内に満了"
          value={yenMan(soonValue)}
          tone="warn"
          sub={`${soon.length} ロット。更新見積の起票対象`}
          href="/renewal"
        />
        <Stat
          label="年間換算コスト（防災原価）"
          value={yenMan(annual)}
          sub={`1人あたり 年 ${yen(annual / COMPANY.headcount)}`}
          href="/renewal"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="拠点別 実効充足率"
          desc="重要度で加重したスコア。最も弱い品目（ボトルネック）が拠点の実力を決めます。"
          right={<Link href="/coverage" className="text-sky-600 hover:underline">詳細 →</Link>}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr>
                  <Th>拠点</Th>
                  <Th align="right">想定滞留</Th>
                  <Th className="w-[190px]">実効充足率</Th>
                  <Th>ボトルネック品目</Th>
                  <Th align="right">不足解消額</Th>
                </tr>
              </thead>
              <tbody>
                {SITES.map((s) => {
                  const score = siteCoverageScore(cells, s.id);
                  const bn = bottleneck(cells, s.id);
                  const cost = cells.filter((c) => c.siteId === s.id).reduce((a, c) => a + c.refillCost, 0);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <Td>
                        <Link href={`/coverage?site=${s.id}`} className="font-medium text-slate-900 hover:text-sky-600">
                          {s.name}
                        </Link>
                        <div className="text-[11px] text-slate-400">{s.pref}・{s.seismic}</div>
                      </Td>
                      <Td align="right">
                        {Math.round(s.headcount * s.visitorFactor)}
                        <span className="text-[10.5px] text-slate-400"> 名</span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <RatioBar ratio={score} />
                          <span className="num w-11 shrink-0 text-right text-[12px] font-medium">{pct(score, 0)}</span>
                        </div>
                      </Td>
                      <Td>
                        <span className="text-slate-600">{bn.line.label}</span>{" "}
                        <span className={`num text-[11.5px] font-medium ${bn.ratio < 0.6 ? "text-rose-600" : "text-amber-600"}`}>
                          {pct(bn.ratio, 0)}
                        </span>
                      </Td>
                      <Td align="right" className={cost > 300000 ? "text-rose-600" : ""}>
                        {cost > 0 ? yenMan(cost) : "—"}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="期限アラート" desc="90日以内に満了、または既に満了しているロット" right={<Link href="/stock" className="text-sky-600 hover:underline">台帳 →</Link>}>
          <ul className="-my-1 divide-y divide-slate-100">
            {alerts.map((l) => {
              const d = daysUntil(l.expiresAt)!;
              const band = expiryBand(l);
              const item = itemById(l.itemId);
              return (
                <li key={l.id} className="flex items-start gap-2.5 py-2">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${BAND_META[band].dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium text-slate-800">{item.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {siteById(l.siteId).short}・{l.location}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`num text-[12px] font-semibold ${d < 0 ? "text-rose-600" : "text-amber-600"}`}>
                      {d < 0 ? `${-d}日超過` : `残${d}日`}
                    </div>
                    <div className="num text-[10.5px] text-slate-400">
                      {l.qty.toLocaleString()}
                      {item.pack}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title="直近の入出庫" desc="受入・払出・廃棄・訓練消費・寄贈を1本の履歴で追跡" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr>
                  <Th>日付</Th>
                  <Th>区分</Th>
                  <Th>拠点</Th>
                  <Th>品目</Th>
                  <Th align="right">数量</Th>
                  <Th>摘要</Th>
                </tr>
              </thead>
              <tbody>
                {MOVEMENTS.map((m) => {
                  const tone =
                    m.kind === "廃棄" || m.kind === "棚卸差異" ? "rose" : m.kind === "受入" ? "green" : m.kind === "寄贈" ? "violet" : "slate";
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <Td className="num text-slate-500">{m.date}</Td>
                      <Td>
                        <Badge tone={tone as "rose" | "green" | "violet" | "slate"}>{m.kind}</Badge>
                      </Td>
                      <Td>{siteById(m.siteId).short}</Td>
                      <Td>{itemById(m.itemId).name}</Td>
                      <Td align="right" className={m.qty < 0 ? "text-rose-600" : "text-emerald-600"}>
                        {m.qty > 0 ? "+" : ""}
                        {m.qty.toLocaleString()}
                      </Td>
                      <Td className="max-w-[280px] truncate text-slate-500">{m.memo}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="直近の訓練" desc={lastDrill.name} right={<Link href="/drills" className="text-sky-600 hover:underline">記録 →</Link>}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[11px] text-slate-500">最終回答率</div>
              <div className="num text-xl font-semibold text-emerald-600">{lastDrill.rate}%</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">回答中央値</div>
              <div className="num text-xl font-semibold text-slate-900">{lastDrill.medianMin}分</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">30分以内</div>
              <div className="num text-xl font-semibold text-slate-900">{lastDrill.within30}%</div>
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-200">
            {lastDrill.note}
          </p>
          <div className="mt-4 border-t border-slate-100 pt-3 text-[11.5px] text-slate-500">
            次回訓練：<span className="font-medium text-slate-700">2026年11月5日（全国一斉訓練・津波想定）</span>
          </div>
        </Card>
      </div>
    </>
  );
}
