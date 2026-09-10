import { PageHead } from "@/components/Shell";
import { Badge, Card, DemoNote, Td, Th } from "@/components/ui";
import { coverage, pct, siteCoverageScore } from "@/lib/calc";
import { DRILLS, DRILL_CURVE, SITES, STANDARDS } from "@/lib/data";

export default function DrillsPage() {
  const cells = coverage(STANDARDS[0]);
  const max = 100;

  return (
    <>
      <PageHead
        title="訓練・監査記録"
        desc="訓練の実施記録、回答率の推移、棚卸履歴、充足率の証跡を一括で保管します。BCP監査・親会社報告・取引先アンケートへの回答資料としてそのまま出力できます。"
        right={
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-700">監査用PDFを出力</button>
            <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white">訓練を計画</button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="訓練実施記録">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr><Th>実施日</Th><Th>訓練名</Th><Th align="right">対象</Th><Th align="right">回答率</Th><Th align="right">中央値</Th><Th align="right">30分以内</Th></tr>
            </thead>
            <tbody>
              {DRILLS.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <Td className="num text-slate-500">{d.date}</Td>
                  <Td>
                    <span className="font-medium text-slate-900">{d.name}</span>
                    {d.note !== "—" && <div className="text-[10.5px] text-slate-500">{d.note}</div>}
                  </Td>
                  <Td align="right">{d.targets}名</Td>
                  <Td align="right" className={d.rate >= 90 ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>{d.rate}%</Td>
                  <Td align="right">{d.medianMin}分</Td>
                  <Td align="right">{d.within30}%</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="回答率の立ち上がり" desc="2026年9月訓練（実線）と 2025年9月訓練（点線）の比較">
          <div className="relative h-48">
            <svg viewBox="0 0 320 180" className="h-full w-full" role="img" aria-label="回答率の時系列推移">
              {[0, 25, 50, 75, 100].map((g) => (
                <g key={g}>
                  <line x1="34" x2="316" y1={160 - (g / max) * 150} y2={160 - (g / max) * 150} stroke="#e2e8f0" strokeWidth="1" />
                  <text x="28" y={164 - (g / max) * 150} textAnchor="end" fontSize="9" fill="#94a3b8">{g}</text>
                </g>
              ))}
              {(["prev", "cur"] as const).map((k) => (
                <polyline
                  key={k}
                  fill="none"
                  stroke={k === "cur" ? "#f97316" : "#94a3b8"}
                  strokeWidth={k === "cur" ? 2.2 : 1.5}
                  strokeDasharray={k === "cur" ? undefined : "4 3"}
                  points={DRILL_CURVE.map((p, i) => `${34 + (i / (DRILL_CURVE.length - 1)) * 282},${160 - (p[k] / max) * 150}`).join(" ")}
                />
              ))}
              {DRILL_CURVE.map((p, i) => (
                <circle key={p.min} cx={34 + (i / (DRILL_CURVE.length - 1)) * 282} cy={160 - (p.cur / max) * 150} r="2.5" fill="#f97316" />
              ))}
              {DRILL_CURVE.map((p, i) => (
                <text key={p.min} x={34 + (i / (DRILL_CURVE.length - 1)) * 282} y="174" textAnchor="middle" fontSize="8" fill="#94a3b8">
                  {p.min >= 1440 ? "24h" : p.min >= 60 ? `${p.min / 60}h` : `${p.min}分`}
                </text>
              ))}
            </svg>
          </div>
          <div className="mt-2 flex gap-4 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 bg-orange-500" />2026年9月（91.5%）</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 border-t border-dashed border-slate-400" />2025年9月（86.1%）</span>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="BCP証跡サマリ" desc="監査・取引先アンケートで問われる項目に、台帳から直接回答します。">
          <table className="w-full">
            <thead><tr><Th>確認項目</Th><Th>状態</Th><Th>根拠</Th></tr></thead>
            <tbody>
              {[
                ["3日分の備蓄を確保しているか", "一部未達", "amber", "5拠点中2拠点が基準未達（充足率100%未満）"],
                ["備蓄品の期限管理を実施しているか", "実施", "green", "ロット単位で満了日を管理・アラート運用中"],
                ["年2回以上の安否確認訓練", "実施", "green", "2026年度：6月・9月に実施済（11月予定）"],
                ["現物棚卸の実施", "進行中", "amber", "2026年度上期：3/5拠点完了"],
                ["連絡先の定期確認", "実施", "green", "2026年6月に到達性チェック実施・7件更新"],
                ["対策本部の設置・運営手順", "整備済", "green", "社内BCP規程 第4章／対策本部ビューで運用"],
              ].map(([k, v, tone, src]) => (
                <tr key={k} className="hover:bg-slate-50">
                  <Td className="font-medium text-slate-800">{k}</Td>
                  <Td><Badge tone={tone as "green" | "amber"}>{v}</Badge></Td>
                  <Td className="max-w-[280px] whitespace-normal text-[11.5px] text-slate-500">{src}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="拠点別 充足率の推移（証跡）" desc="監査で問われるのは「今」ではなく「継続的に管理してきたか」です。">
          <table className="w-full">
            <thead><tr><Th>拠点</Th><Th align="right">2025/09</Th><Th align="right">2026/03</Th><Th align="right">2026/09</Th><Th align="right">増減</Th></tr></thead>
            <tbody>
              {SITES.map((s, i) => {
                const now = siteCoverageScore(cells, s.id);
                const past = [now - 0.06, now - 0.11, now + 0.04, now - 0.28, now - 0.02][i];
                const mid = (now + past) / 2;
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <Td className="font-medium text-slate-800">{s.name}</Td>
                    <Td align="right" className="text-slate-500">{pct(past, 0)}</Td>
                    <Td align="right" className="text-slate-500">{pct(mid, 0)}</Td>
                    <Td align="right" className="font-semibold">{pct(now, 0)}</Td>
                    <Td align="right" className={now - past >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {now - past >= 0 ? "+" : ""}{pct(now - past, 0)}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-4">
            <DemoNote>
              大阪支店の低下は、期限切れロットが実効在庫から外れたことによるものです。帳簿だけを見ていた期間は「充足」と報告されていました。
            </DemoNote>
          </div>
        </Card>
      </div>
    </>
  );
}
