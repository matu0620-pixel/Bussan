import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  title,
  desc,
  right,
  children,
  className = "",
}: {
  title?: ReactNode;
  desc?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {(title || right) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div>
            {title && <h2 className="text-[13px] font-semibold tracking-wide text-slate-900">{title}</h2>}
            {desc && <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">{desc}</p>}
          </div>
          {right && <div className="shrink-0 text-[11.5px] text-slate-500">{right}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  unit,
  sub,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
  href?: string;
}) {
  const tones = {
    default: "text-slate-900",
    good: "text-emerald-600",
    warn: "text-amber-600",
    bad: "text-rose-600",
  } as const;
  const inner = (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300">
      <div className="text-[11.5px] font-medium text-slate-500">{label}</div>
      <div className={`num mt-1 flex items-baseline gap-1 text-2xl font-semibold ${tones[tone]}`}>
        {value}
        {unit && <span className="text-[12px] font-medium text-slate-400">{unit}</span>}
      </div>
      {sub && <div className="mt-1 text-[11.5px] leading-snug text-slate-500">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "amber" | "rose" | "sky" | "violet";
}) {
  const map = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    sky: "bg-sky-50 text-sky-700 ring-sky-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${map[tone]}`}>
      {children}
    </span>
  );
}

/** 充足率バー（100%を基準線として超過分も見せる） */
export function RatioBar({ ratio, height = 8 }: { ratio: number; height?: number }) {
  const clamped = Math.min(ratio, 1.4);
  const w = (clamped / 1.4) * 100;
  const color = ratio >= 1 ? "bg-emerald-500" : ratio >= 0.8 ? "bg-amber-400" : ratio >= 0.5 ? "bg-orange-500" : "bg-rose-500";
  return (
    <div className="relative w-full rounded-full bg-slate-100" style={{ height }}>
      <div className={`absolute left-0 top-0 rounded-full ${color}`} style={{ width: `${w}%`, height }} />
      <div className="absolute top-[-2px] h-[calc(100%+4px)] w-px bg-slate-400/70" style={{ left: `${(1 / 1.4) * 100}%` }} />
    </div>
  );
}

export function Th({ children, className = "", align = "left" }: { children?: ReactNode; className?: string; align?: "left" | "right" | "center" }) {
  return (
    <th
      className={`whitespace-nowrap border-b border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-500 ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "", align = "left" }: { children?: ReactNode; className?: string; align?: "left" | "right" | "center" }) {
  return (
    <td
      className={`whitespace-nowrap border-b border-slate-100 px-3 py-2 text-[12.5px] text-slate-700 ${
        align === "right" ? "num text-right" : align === "center" ? "text-center" : ""
      } ${className}`}
    >
      {children}
    </td>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="py-10 text-center text-[12.5px] text-slate-400">{children}</div>;
}

export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11.5px] leading-relaxed text-slate-500">
      {children}
    </p>
  );
}
