import type { generateZappingSources } from "@/lib/mockData";

type Hour = ReturnType<typeof generateZappingSources>[number];

const COLORS = ["oklch(0.62 0.22 25)", "oklch(0.55 0 0)", "oklch(0.85 0 0)"];

export function ZappingSourceBars({ data }: { data: Hour[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Zapping source by hour</h3>
          <p className="text-xs text-muted-foreground">
            Top 3 channels viewers zapped FROM at each hour
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          {["#1 source", "#2 source", "#3 source"].map((l, i) => (
            <span key={l} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: COLORS[i] }} />
              {l}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        {data.map((row) => (
          <div key={row.hour} className="group flex items-center gap-3">
            <span className="w-10 text-right font-mono text-[11px] text-muted-foreground">
              {row.hour}
            </span>
            <div className="flex h-6 flex-1 overflow-hidden rounded-md bg-secondary/40">
              {row.sources.map((s, i) => (
                <div
                  key={s.channel}
                  title={`${s.channel} · ${s.share}%`}
                  className="flex items-center justify-center overflow-hidden text-[10px] font-semibold text-background transition-all duration-500 hover:brightness-125"
                  style={{ width: `${s.share}%`, background: COLORS[i] }}
                >
                  <span className="truncate px-2">
                    {s.share >= 12 ? `${s.channel} ${s.share}%` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
