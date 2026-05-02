import { useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, Activity, Minus } from "lucide-react";

type HitSource = {
  name: string;
  granularity: string;
  growth_pct: number;
  spike_ratio: number;
  trend_direction: "rising" | "declining" | "stable";
  before_avg: number;
  after_avg: number;
  sample_size: number;
};

type HitResult = {
  hit_detected: "Yes" | "No" | "Unclear";
  strength: "High" | "Medium" | "Low";
  evidence: string[];
  sources: HitSource[];
};

export function RealCampaignHitChecker({ medium }: { medium: "TV" | "Radio" }) {
  const [product, setProduct] = useState("");
  const [date, setDate]       = useState("");
  const [time, setTime]       = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<HitResult | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !date) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/campaign-hit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: product, date, airTime: time }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResult(data as HitResult);
    } catch (err: any) {
      setError(err?.message ?? "Failed to check campaign hit.");
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = (hit: HitResult["hit_detected"]) =>
    hit === "Yes"
      ? "text-[oklch(0.78_0.18_145)]"
      : hit === "No"
      ? "text-primary"
      : "text-[oklch(0.78_0.18_60)]";

  const verdictBg = (hit: HitResult["hit_detected"]) =>
    hit === "Yes"
      ? "bg-[oklch(0.7_0.18_145)]/15 text-[oklch(0.78_0.18_145)]"
      : hit === "No"
      ? "bg-primary/15 text-primary"
      : "bg-[oklch(0.7_0.18_60)]/15 text-[oklch(0.78_0.18_60)]";

  const verdictLabel = (hit: HitResult["hit_detected"]) =>
    hit === "Yes" ? "🎉 HIT" : hit === "No" ? "💤 MISS" : "❓ UNCLEAR";

  const src0 = result?.sources?.[0];
  const TrendIcon = src0?.trend_direction === "rising"
    ? TrendingUp
    : src0?.trend_direction === "declining"
    ? TrendingDown
    : Minus;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold">📊 Campaign Hit Checker</h3>
          <p className="text-xs text-muted-foreground">
            Was your {medium} campaign a hit? Enter the product, date and exact air time.
          </p>
        </div>
      </div>

      <form onSubmit={run} className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Product / Campaign name
          </label>
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="e.g. Délice Yogurt"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Air time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gradient-to-r from-primary to-[oklch(0.55_0.2_30)] px-5 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Analyzing…" : "Check Campaign Performance"}
          </button>
        </div>
      </form>

      <div className="mt-5">
        {!result && !loading && !error && (
          <div className="rounded-md border border-dashed border-border bg-background/40 p-6 text-center text-xs text-muted-foreground">
            Fill the fields above to evaluate your campaign.
          </div>
        )}
        {loading && (
          <div className="rounded-md border border-border bg-background/40 p-6 text-center text-xs text-muted-foreground">
            <Activity className="mx-auto mb-2 h-5 w-5 animate-pulse text-primary" />
            Querying Google Trends data…
          </div>
        )}
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            ⚠ {error}
          </div>
        )}
        {result && (
          <div className="animate-fade-in rounded-lg border border-border bg-background/50 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${verdictBg(result.hit_detected)}`}>
                  {result.hit_detected === "Yes" ? (
                    <TrendingUp className="h-6 w-6" />
                  ) : result.hit_detected === "No" ? (
                    <TrendingDown className="h-6 w-6" />
                  ) : (
                    <Minus className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Verdict
                  </div>
                  <div className={`text-2xl font-bold ${verdictColor(result.hit_detected)}`}>
                    {verdictLabel(result.hit_detected)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Search growth
                </div>
                <div className="font-mono text-3xl font-bold text-foreground">
                  {(src0?.growth_pct ?? 0) > 0 ? "+" : ""}{src0?.growth_pct ?? 0}%
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Spike ratio
                </div>
                <div className="font-mono text-lg font-semibold">{src0?.spike_ratio ?? "—"}×</div>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Strength
                </div>
                <div className="font-mono text-lg font-semibold">{result.strength}</div>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Trend
                </div>
                <div className="flex items-center gap-1 font-mono text-lg font-semibold">
                  <TrendIcon className="h-4 w-4" />
                  {src0?.trend_direction ?? "stable"}
                </div>
              </div>
            </div>

            <ul className="mt-4 space-y-1">
              {result.evidence.map((line, i) => (
                <li key={i} className="text-[12px] leading-relaxed text-muted-foreground">
                  • {line}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
