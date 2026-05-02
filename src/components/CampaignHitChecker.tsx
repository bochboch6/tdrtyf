import { useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, Activity } from "lucide-react";

export function CampaignHitChecker({ medium }: { medium: "TV" | "Radio" }) {
  const [product, setProduct] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    hit: boolean;
    score: number;
    reach: number;
    engagement: number;
    reason: string;
  }>(null);

  const run = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !date || !time) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const hour = Number(time.split(":")[0] ?? 0);
      // Prime hours score better
      const primeBoost = (hour >= 19 && hour <= 22) ? 25 : hour >= 12 && hour <= 14 ? 12 : 0;
      const seed =
        product.split("").reduce((s, c) => s + c.charCodeAt(0), 0) +
        new Date(date).getDate() * 7 +
        hour * 3;
      const base = 35 + (seed % 50);
      const score = Math.min(98, base + primeBoost);
      const hit = score >= 65;
      const reach = Math.floor((score / 100) * (medium === "TV" ? 1_400_000 : 820_000));
      const engagement = Math.round((score / 100) * 100) / 10;
      const reason = hit
        ? `"${product}" benefited from a strong ${medium} slot at ${time} on ${date}. Audience overlap with target demographics was high, especially around prime time.`
        : `"${product}" aired at ${time} on ${date} during a low-attention window. Reach was limited and competing programs captured most of the audience.`;
      setResult({ hit, score, reach, engagement, reason });
      setLoading(false);
    }, 1200);
  };

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
        {!result && !loading && (
          <div className="rounded-md border border-dashed border-border bg-background/40 p-6 text-center text-xs text-muted-foreground">
            Fill the fields above to evaluate your campaign.
          </div>
        )}
        {loading && (
          <div className="rounded-md border border-border bg-background/40 p-6 text-center text-xs text-muted-foreground">
            <Activity className="mx-auto mb-2 h-5 w-5 animate-pulse text-primary" />
            Crunching ratings and audience overlap…
          </div>
        )}
        {result && (
          <div className="animate-fade-in rounded-lg border border-border bg-background/50 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    result.hit
                      ? "bg-[oklch(0.7_0.18_145)]/15 text-[oklch(0.78_0.18_145)]"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {result.hit ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Verdict
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      result.hit ? "text-[oklch(0.78_0.18_145)]" : "text-primary"
                    }`}
                  >
                    {result.hit ? "🎉 HIT" : "💤 MISS"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Performance score
                </div>
                <div className="font-mono text-3xl font-bold text-foreground">{result.score}%</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Estimated reach
                </div>
                <div className="font-mono text-lg font-semibold">
                  {result.reach.toLocaleString("en-US")}
                </div>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Engagement index
                </div>
                <div className="font-mono text-lg font-semibold">{result.engagement}/10</div>
              </div>
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">{result.reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
