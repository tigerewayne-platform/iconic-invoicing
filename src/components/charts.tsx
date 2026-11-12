import type { ReactNode } from "react";
import { formatZAR } from "@/lib/money";

/** Whole rands, no cents: "R 12 400". */
export function rands(cents: number) {
  return formatZAR(cents).replace(/\.\d\d$/, "");
}

/** Compact axis label: R 0, R 950, R 12K, R 1.2M. */
function compact(cents: number) {
  const r = Math.round(cents / 100);
  if (r >= 1_000_000) return `R ${+(r / 1_000_000).toFixed(1)}M`;
  if (r >= 10_000) return `R ${Math.round(r / 1000)}K`;
  if (r >= 1_000) return `R ${+(r / 1000).toFixed(1)}K`;
  return `R ${r}`;
}

/** Round the axis top up to a clean number and split it into 4 even steps. */
function niceTicks(max: number) {
  if (max <= 0) return [0, 25_000, 50_000, 75_000, 100_000]; // empty chart: R0 to R1K axis
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  return [0, 1, 2, 3, 4].map((i) => i * step);
}

export function ChartCard({
  title,
  sub,
  aside,
  children,
  className = "",
}: {
  title: string;
  sub?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-serif text-xl font-semibold text-ink">{title}</h2>
          {sub ? <p className="mt-0.5 text-xs text-mute">{sub}</p> : null}
        </div>
        {aside}
      </div>
      <div className="px-5 pb-4 pt-7">{children}</div>
    </section>
  );
}

export type Column = {
  key: string;
  label: string;
  value: number;
  /** Lines shown in the hover tooltip under the value. */
  tip?: string[];
  /** Tooltip heading, e.g. "Apr 2026". Defaults to the axis label. */
  title?: string;
  /** Label the value on top of this column. */
  callout?: boolean;
};

/**
 * Single-series column chart in brand red. Plain HTML/CSS, so it renders on the server
 * with no chart library. Hovering anywhere in a column's slot shows its tooltip.
 */
export function ColumnChart({ columns, tableCaption }: { columns: Column[]; tableCaption: string }) {
  const ticks = niceTicks(Math.max(...columns.map((c) => c.value), 0));
  const top = ticks[ticks.length - 1] || 1;
  return (
    <div>
      <div className="flex gap-2">
        {/* y-axis */}
        <div className="relative h-44 w-12 shrink-0 text-right text-[10px] text-mute" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
              {compact(t)}
            </span>
          ))}
        </div>
        <div className="relative h-44 flex-1">
          {/* gridlines */}
          {ticks.map((t) => (
            <div
              key={t}
              aria-hidden
              className={`absolute inset-x-0 h-px ${t === 0 ? "bg-line" : "bg-line/50"}`}
              style={{ bottom: `${(t / top) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex gap-0.5">
            {columns.map((c, i) => {
              const pct = (c.value / top) * 100;
              // Keep tooltips at the chart edges from spilling off the card.
              const align =
                i < 2 ? "left-0" : i >= columns.length - 2 ? "right-0" : "left-1/2 -translate-x-1/2";
              return (
                <div key={c.key} className="group relative flex h-full flex-1 items-end justify-center" tabIndex={0}>
                  {c.value > 0 ? (
                    <div
                      className="w-full max-w-6 rounded-t bg-brand transition-opacity group-hover:opacity-80"
                      style={{ height: `max(${pct}%, 3px)` }}
                    />
                  ) : null}
                  {c.callout && c.value > 0 ? (
                    <span
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap pb-1 text-[10px] font-medium text-ink"
                      style={{ bottom: `${pct}%` }}
                    >
                      {compact(c.value)}
                    </span>
                  ) : null}
                  {/* tooltip */}
                  <div
                    role="tooltip"
                    className={`pointer-events-none absolute z-10 hidden w-max max-w-48 rounded-md bg-ink px-3 py-2 text-left text-xs text-cream shadow-lg group-hover:block group-focus:block ${align}`}
                    style={{ bottom: `calc(${pct}% + ${c.callout ? 22 : 8}px)` }}
                  >
                    <p className="text-[10px] uppercase tracking-widest text-sand">{c.title ?? c.label}</p>
                    <p className="font-medium">{rands(c.value)}</p>
                    {c.tip?.map((t) => (
                      <p key={t} className="text-sand">
                        {t}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* x-axis */}
      <div className="ml-14 mt-2 flex text-[10px] text-mute" aria-hidden>
        {columns.map((c) => (
          <span key={c.key} className="flex-1 text-center">
            {c.label}
          </span>
        ))}
      </div>
      <DataTable
        caption={tableCaption}
        rows={columns.map((c) => [c.label, rands(c.value), ...(c.tip ?? [])])}
      />
    </div>
  );
}

export type Bar = { key: string; label: string; value: number; note?: string; tone?: "strong" | "soft" };

/** Horizontal bars, each labelled with its value at the tip. */
export function BarList({ bars, tableCaption }: { bars: Bar[]; tableCaption: string }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div>
      <ul className="space-y-3.5">
        {bars.map((b) => (
          <li key={b.key}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
              <span className="text-body">{b.label}</span>
              <span className="text-mute">{b.note}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 flex-1 rounded-r bg-paper">
                {b.value > 0 ? (
                  <div
                    className={`h-full rounded-r ${b.tone === "soft" ? "bg-sand" : "bg-brand"}`}
                    style={{ width: `max(${(b.value / max) * 100}%, 3px)` }}
                  />
                ) : null}
              </div>
              <span className="w-20 shrink-0 text-right text-sm font-medium text-ink">{rands(b.value)}</span>
            </div>
          </li>
        ))}
      </ul>
      <DataTable caption={tableCaption} rows={bars.map((b) => [b.label, rands(b.value), b.note ?? ""])} />
    </div>
  );
}

function DataTable({ caption, rows }: { caption: string; rows: string[][] }) {
  return (
    <details className="mt-3 text-xs text-mute">
      <summary className="cursor-pointer select-none hover:text-ink">View as table</summary>
      <table className="mt-2 w-full">
        <caption className="sr-only">{caption}</caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-line/60 last:border-0">
              {r.map((cell, i) => (
                <td key={i} className={`py-1.5 ${i === 1 ? "text-right font-medium text-ink" : ""} ${i > 1 ? "pl-3 text-right" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
