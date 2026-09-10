"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { href: string; label: string; icon: string; live?: boolean };
type NavGroup = { group: string; ops?: boolean; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    group: "平時（Readiness）",
    items: [
      { href: "/", label: "ダッシュボード", icon: "▦" },
      { href: "/coverage", label: "充足率・基準管理", icon: "◎" },
      { href: "/stock", label: "備蓄ロット台帳", icon: "▤" },
      { href: "/renewal", label: "更新計画・コスト", icon: "◷" },
    ],
  },
  {
    group: "有事（Response）",
    items: [
      { href: "/command", label: "災害対策本部", icon: "◈", live: true },
      { href: "/safety", label: "安否確認", icon: "✆" },
      { href: "/drills", label: "訓練・監査記録", icon: "✓" },
    ],
  },
  {
    group: "卸オペレーション（自社）",
    ops: true,
    items: [
      { href: "/ops", label: "需要パイプライン", icon: "◆" },
      { href: "/ops/procurement", label: "仕入計画・自社在庫", icon: "▥" },
      { href: "/ops/orders", label: "更新受注・引取り", icon: "⇄" },
      { href: "/ops/contracts", label: "契約・預託資産", icon: "◱" },
      { href: "/ops/economics", label: "収支シミュレータ", icon: "∿" },
    ],
  },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isOps = path.startsWith("/ops");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar */}
      <aside
        className={`${open ? "block" : "hidden"} shrink-0 border-b border-slate-200 bg-slate-900 lg:block lg:w-60 lg:border-b-0`}
      >
        <div className="sticky top-0 flex h-full flex-col px-3 py-4">
          <Link href="/" className="mb-5 flex items-center gap-2.5 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-[15px] font-bold text-white">
              S
            </span>
            <span>
              <span className="block text-[14px] font-semibold leading-none text-white">SONAE</span>
              <span className="mt-1 block text-[10px] leading-none text-slate-400">備蓄台帳 × 安否確認</span>
            </span>
          </Link>

          <nav className="flex-1 space-y-5">
            {NAV.map((g) => (
              <div key={g.group} className={g.ops ? "border-t border-slate-700/60 pt-4" : undefined}>
                <div
                  className={`flex items-center gap-1.5 px-2 pb-1.5 text-[10px] font-semibold tracking-wider ${
                    g.ops ? "text-teal-300/80" : "text-slate-500"
                  }`}
                >
                  {g.ops && <span className="h-1.5 w-1.5 rounded-sm bg-teal-400" />}
                  {g.group}
                </div>
                <ul className="space-y-0.5">
                  {g.items.map((it) => {
                    const active =
                      path === it.href || (it.href !== "/" && it.href !== "/ops" && path.startsWith(it.href));
                    return (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] transition ${
                            active
                              ? g.ops
                                ? "bg-teal-600/25 font-medium text-teal-50 ring-1 ring-inset ring-teal-500/40"
                                : "bg-slate-700/80 font-medium text-white"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <span className={`w-3.5 text-center text-[11px] ${active && g.ops ? "text-teal-300" : "text-slate-400"}`}>
                            {it.icon}
                          </span>
                          <span className="flex-1">{it.label}</span>
                          {it.live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div
            className={`mt-6 rounded-lg px-3 py-2.5 ${
              isOps ? "bg-teal-900/40 ring-1 ring-inset ring-teal-700/50" : "bg-slate-800/70"
            }`}
          >
            <div className="text-[10px] tracking-wider text-slate-400">{isOps ? "事業者ビュー" : "顧客ビュー"}</div>
            <div className="mt-1 text-[11px] font-medium text-slate-100">
              {isOps ? "みなと防災サプライ株式会社" : "株式会社ミナトテック"}
            </div>
            <div className="mt-0.5 text-[10.5px] text-slate-400">
              {isOps ? "営業企画部 / 管理者権限" : "総務人事部 / 管理者権限"}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-md border border-slate-300 px-2 py-1 text-[12px] text-slate-600"
          >
            メニュー
          </button>
          <span className="text-[13px] font-semibold">SONAE</span>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
        <footer className="border-t border-slate-200 px-6 py-4 text-[11px] text-slate-400">
          SONAE — 構想検証用モックアップ。表示されているデータはすべて架空です。
        </footer>
      </div>
    </div>
  );
}

export function PageHead({
  title,
  desc,
  right,
}: {
  title: string;
  desc?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[19px] font-semibold tracking-tight text-slate-900">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-slate-500">{desc}</p>}
      </div>
      {right}
    </div>
  );
}
