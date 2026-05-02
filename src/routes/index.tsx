import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Cell,
} from "recharts";
import { Eye, Tv, Zap, Download } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/Skeleton";
import { RealAudienceProfile } from "@/components/tv/RealAudienceProfile";
import { RealAdRecommendationPanel } from "@/components/tv/RealAdRecommendationPanel";
import { RealAIAdvisorChat } from "@/components/tv/RealAIAdvisorChat";
import { RealCampaignHitChecker } from "@/components/tv/RealCampaignHitChecker";
import {
  generateChannelViewers, generateZappingData, exportToCSV,
} from "@/lib/mockData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TV Monitoring — MediaPulse" },
      { name: "description", content: "Real-time TV audience analytics for Tunisia." },
      { property: "og:title", content: "TV Monitoring — MediaPulse" },
      { property: "og:description", content: "Real-time TV audience analytics for Tunisia." },
    ],
  }),
  component: TvPage,
});

function TvPage() {
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<ReturnType<typeof generateChannelViewers>>([]);
  const [zaps, setZaps] = useState<ReturnType<typeof generateZappingData>>([]);
  const [currentHour, setCurrentHour] = useState(20);

  useEffect(() => {
    setChannels(generateChannelViewers());
    setZaps(generateZappingData());
    setCurrentHour(new Date().getHours());
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setChannels(generateChannelViewers()), 3500);
    return () => clearInterval(id);
  }, []);

  const total = channels.reduce((s, c) => s + c.viewers, 0);
  const top = [...channels].sort((a, b) => b.viewers - a.viewers)[0];
  const peakZap = [...zaps].sort((a, b) => b.zaps - a.zaps)[0];
  const maxViewers = Math.max(...channels.map((c) => c.viewers));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Television Live</h1>
            <p className="text-sm text-muted-foreground">
              Real-time audience metrics across Tunisian channels
            </p>
          </div>
          <button
            onClick={() => exportToCSV("tv-viewers.csv", channels)}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[112px]" />
              ))}
            </>
          ) : (
            <>
              <KpiCard label="Total viewers live" value={total.toLocaleString("en-US")} trend={2.4} icon={Eye} />
              <KpiCard label="Most watched now" value={top.name} sub={`${top.viewers.toLocaleString("en-US")} viewers`} icon={Tv} />
              <KpiCard label="Peak zapping hour" value={peakZap.hour} sub={`${peakZap.zaps.toLocaleString("en-US")} zaps`} icon={Zap} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Live viewers per channel</h3>
                <p className="text-xs text-muted-foreground">Updated every 3.5 seconds</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                LIVE
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channels} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0 0)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "oklch(0.62 0 0)", fontSize: 11 }} axisLine={{ stroke: "oklch(0.18 0 0)" }} tickLine={false} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: "oklch(0.62 0 0)", fontSize: 11 }} axisLine={{ stroke: "oklch(0.18 0 0)" }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip cursor={{ fill: "oklch(0.14 0 0)" }} contentStyle={{ background: "oklch(0.11 0 0)", border: "1px solid oklch(0.2 0 0)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [v.toLocaleString("en-US"), "Viewers"]} />
                  <Bar dataKey="viewers" radius={[6, 6, 0, 0]} animationDuration={800}>
                    {channels.map((c, i) => (
                      <Cell key={i} fill={c.viewers === maxViewers ? "oklch(0.62 0.22 25)" : "oklch(0.42 0.14 25)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Zapping volume</h3>
                <p className="text-xs text-muted-foreground">Channel switches per hour</p>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Now: <span className="font-mono text-primary">{currentHour}:00</span>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={zaps} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="zapGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.62 0.22 25)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.62 0.22 25)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0 0)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: "oklch(0.62 0 0)", fontSize: 11 }} axisLine={{ stroke: "oklch(0.18 0 0)" }} tickLine={false} />
                  <YAxis tick={{ fill: "oklch(0.62 0 0)", fontSize: 11 }} axisLine={{ stroke: "oklch(0.18 0 0)" }} tickLine={false} />
                  <Tooltip cursor={{ stroke: "oklch(0.3 0 0)", strokeDasharray: "3 3" }} contentStyle={{ background: "oklch(0.11 0 0)", border: "1px solid oklch(0.2 0 0)", borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine x={`${currentHour}h`} stroke="oklch(0.62 0.22 25)" strokeWidth={2} strokeDasharray="4 4" label={{ value: "NOW", fill: "oklch(0.62 0.22 25)", fontSize: 10, position: "top" }} />
                  <Line type="monotone" dataKey="zaps" stroke="oklch(0.62 0.22 25)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "oklch(0.62 0.22 25)" }} fill="url(#zapGrad)" animationDuration={900} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Audience profile (now first) */}
        <RealAudienceProfile />

        {/* AI recommendation panel (now second) */}
        <RealAdRecommendationPanel />

        {/* Campaign hit checker */}
        <RealCampaignHitChecker medium="TV" />
      </main>

      {/* Floating AI assistant chatbot */}
      <RealAIAdvisorChat />
    </div>
  );
}
