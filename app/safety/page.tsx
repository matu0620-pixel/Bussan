"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHead } from "@/components/Shell";
import { Badge, Card, DemoNote, Td, Th } from "@/components/ui";
import { pct } from "@/lib/calc";
import { DISPATCHES, SITES, siteById } from "@/lib/data";

const SEISMIC = ["震度4以上", "震度5弱以上", "震度5強以上", "震度6弱以上"];

export default function SafetyPage() {
  const [thresholds, setThresholds] = useState<Record<string, string>>({
    hq: "震度5弱以上", yok: "震度5弱以上", ngy: "震度5強以上", osk: "震度5強以上", sdi: "震度5弱以上",
  });
  const [channels, setChannels] = useState<Record<string, boolean>>({
    アプリPush: true, メール: true, LINE: true, SMS: true, "電話（自動音声）": false,
  });
  const [resend, setResend] = useState(2);
  const [composing, setComposing] = useState(false);

  return (
    <>
      <PageHead
        title="安否確認"
        desc="気象庁の災害情報と連動した自動一斉送信、多チャネル通知、未回答者への自動再送、リアルタイム集計。備蓄台帳と同じ人員マスタを使うため、二重管理が発生しません。"
        right={
          <button onClick={() => setComposing((v) => !v)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-slate-800">
            手動発報 / 訓練を作成
          </button>
        }
      />

      {composing && (
        <Card title="新規発報" desc="訓練として送る場合、集計は訓練レポートに記録され本番履歴とは分離されます。" className="mb-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block md:col-span-2">
              <span className="mb-1 block text-[11.5px] font-medium text-slate-600">件名</span>
              <input defaultValue="【訓練】11月 全国一斉防災訓練（津波想定）" className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[12.5px]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-medium text-slate-600">種別</span>
              <select className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12.5px]">
                <option>訓練</option>
                <option>手動発報（本番）</option>
              </select>
            </label>
            <div className="md:col-span-3">
              <span className="mb-1.5 block text-[11.5px] font-medium text-slate-600">対象拠点</span>
              <div className="flex flex-wrap gap-2">
                {SITES.map((s) => (
                  <label key={s.id} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[12px]">
                    <input type="checkbox" defaultChecked className="accent-orange-500" />
                    {s.name}
                    <span className="num text-slate-400">{s.headcount}名</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button className="rounded-lg bg-orange-500 px-4 py-1.5 text-[12.5px] font-medium text-white">送信予約</button>
              <button onClick={() => setComposing(false)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-[12.5px] text-slate-700">キャンセル</button>
            </div>
          </div>
        </Card>
      )}

      <Card title="発報履歴" desc="行をクリックすると回答集計を開きます。" className="mb-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr>
                <Th>発報ID</Th>
                <Th>種別</Th>
                <Th>件名 / トリガー</Th>
                <Th>送信日時</Th>
                <Th align="right">対象</Th>
                <Th className="w-[160px]">回答率</Th>
                <Th>状態</Th>
              </tr>
            </thead>
            <tbody>
              {DISPATCHES.map((d) => {
                const rate = d.answered / d.targets;
                return (
                  <tr key={d.id} className="cursor-pointer hover:bg-slate-50">
                    <Td className="num text-slate-400">
                      <Link href={`/safety/${d.id}`}>{d.id}</Link>
                    </Td>
                    <Td>
                      <Badge tone={d.kind === "訓練" ? "sky" : d.kind === "自動発報" ? "rose" : "amber"}>{d.kind}</Badge>
                    </Td>
                    <Td>
                      <Link href={`/safety/${d.id}`} className="font-medium text-slate-900 hover:text-sky-600">{d.title}</Link>
                      <div className="text-[10.5px] text-slate-400">{d.trigger}</div>
                      <div className="mt-0.5 text-[10.5px] text-slate-400">対象拠点：{d.targetSites.map((s) => siteById(s).short).join("・")}</div>
                    </Td>
                    <Td className="num text-slate-500">{d.sentAt}</Td>
                    <Td align="right">{d.targets}名</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                          <div className={`h-1.5 rounded-full ${rate >= 0.95 ? "bg-emerald-500" : rate >= 0.85 ? "bg-amber-400" : "bg-rose-500"}`} style={{ width: `${rate * 100}%` }} />
                        </div>
                        <span className="num w-11 shrink-0 text-right text-[11.5px] font-medium">{pct(rate, 1)}</span>
                      </div>
                    </Td>
                    <Td>
                      {d.status === "対応中" ? <Badge tone="rose">対応中</Badge> : <Badge tone="slate">完了</Badge>}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="自動発報ルール" desc="気象庁の震度速報・津波警報・特別警報を受信し、拠点の所在地としきい値が一致した場合に自動送信します。">
          <table className="w-full">
            <thead>
              <tr>
                <Th>拠点</Th>
                <Th>所在地</Th>
                <Th>地震しきい値</Th>
                <Th align="center">津波警報</Th>
                <Th align="center">特別警報</Th>
              </tr>
            </thead>
            <tbody>
              {SITES.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <Td className="font-medium text-slate-900">{s.name}</Td>
                  <Td className="text-slate-500">{s.address}</Td>
                  <Td>
                    <select
                      value={thresholds[s.id]}
                      onChange={(e) => setThresholds({ ...thresholds, [s.id]: e.target.value })}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[12px]"
                    >
                      {SEISMIC.map((v) => (<option key={v}>{v}</option>))}
                    </select>
                  </Td>
                  <Td align="center">
                    <input type="checkbox" defaultChecked={["yok", "osk", "sdi"].includes(s.id)} className="accent-orange-500" />
                  </Td>
                  <Td align="center"><input type="checkbox" defaultChecked className="accent-orange-500" /></Td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4">
            <DemoNote>
              発災直後は通信が輻輳します。しきい値を下げすぎると訓練疲れを招き、上げすぎると初動が遅れます。
              実運用では「震度5弱＝本社・営業所すべて」「震度5強＝支店のみ」のように、拠点の重要度と要員数で段階を分けるのが定石です。
            </DemoNote>
          </div>
        </Card>

        <div className="space-y-5">
          <Card title="通知チャネル" desc="到達性を上げるため複数経路へ同時送信します。">
            <ul className="space-y-2">
              {Object.entries(channels).map(([k, v]) => (
                <li key={k}>
                  <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-[12.5px]">
                    <span className={v ? "font-medium text-slate-800" : "text-slate-500"}>{k}</span>
                    <input type="checkbox" checked={v} onChange={() => setChannels({ ...channels, [k]: !v })} className="accent-orange-500" />
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <label className="block text-[11.5px] font-medium text-slate-600">
                未回答者への自動再送：<span className="num font-semibold text-slate-900">{resend}時間ごと・最大4回</span>
              </label>
              <input type="range" min={1} max={6} value={resend} onChange={(e) => setResend(Number(e.target.value))} className="mt-2 w-full accent-orange-500" />
            </div>
          </Card>

          <Card title="回答フォーム" desc="設問はカスタマイズ可能。既定は5問。">
            <ol className="space-y-2 text-[12px] text-slate-700">
              {[
                ["あなたの安否", "無事 / 軽傷 / 重傷"],
                ["現在地", "社内 / 自宅 / 外出先 / 移動中"],
                ["出社可否", "出社済 / 出社可 / 在宅対応可 / 対応不可"],
                ["ご家族の安否", "全員無事 / 確認中 / 被害あり"],
                ["自宅の被害", "被害なし / 軽微 / 大きい"],
              ].map(([q, a], i) => (
                <li key={q} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="font-medium text-slate-800">Q{i + 1}. {q}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{a}</div>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              Q2・Q3の回答が、そのまま「災害対策本部」の拠点滞留人数の推計に流れ込みます。
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
