import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Users } from "lucide-react";
import { getChaines, getAudience, type AudienceData } from "@/lib/api";

const AGE_COLORS = ["oklch(0.62 0.22 25)", "oklch(0.65 0.18 250)", "oklch(0.72 0.18 145)", "oklch(0.78 0.16 75)"];
const SEX_COLORS = ["oklch(0.62 0.22 25)", "oklch(0.65 0.18 250)"];
const INC_COLORS = ["oklch(0.4 0.05 25)", "oklch(0.62 0.22 25)", "oklch(0.78 0.16 75)"];

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

function MiniPie({ title, data, colors }: { title: string; data: { name: string; value: number }[]; colors: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={68}
              paddingAngle={2}
              stroke="oklch(0.09 0 0)"
              strokeWidth={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "oklch(0.11 0 0)",
                border: "1px solid oklch(0.2 0 0)",
                borderRadius: 6,
                fontSize: 12,
              }}
              formatter={(v: number) => v.toLocaleString()}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
              formatter={(v) => <span style={{ color: "oklch(0.85 0 0)" }}>{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SkeletonPie() {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-background/40 p-4">
      <div className="mb-2 mx-auto h-3 w-20 rounded bg-muted/40" />
      <div className="flex h-[180px] items-center justify-center">
        <div className="h-28 w-28 rounded-full bg-muted/30" />
      </div>
    </div>
  );
}

function mapAudienceToCharts(data: AudienceData) {
  const age = ["18-24", "25-34", "35-44", "45+"].map((k) => ({
    name: k,
    value: data.par_age[k] ?? 0,
  }));
  const sex = [
    { name: "Femmes", value: data.par_sexe["F"] ?? 0 },
    { name: "Hommes", value: data.par_sexe["H"] ?? 0 },
  ];
  const income = [
    { name: "Faible", value: data.par_revenu["faible"] ?? 0 },
    { name: "Moyen", value: data.par_revenu["moyen"] ?? 0 },
    { name: "Élevé", value: data.par_revenu["eleve"] ?? 0 },
  ];
  return { age, sex, income };
}

export function RealAudienceProfile() {
  const [channels, setChannels] = useState<string[]>([]);
  const [channel, setChannel] = useState("");
  const [day, setDay] = useState("Lundi");
  const [hour, setHour] = useState(20);
  const [audienceData, setAudienceData] = useState<AudienceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Fetching chaines...");
    getChaines()
      .then((chaines) => {
        console.log("Result:", chaines);
        setChannels(chaines);
        if (chaines.length > 0) setChannel(chaines[0]);
      })
      .catch((err) => {
        console.error("Error:", err);
        setError(`Failed to load channels from API — ${err.message}`);
      });
  }, []);

  useEffect(() => {
    if (!channel) return;
    console.log("Fetching audience for:", channel, hour, day);
    setLoading(true);
    setError(null);
    getAudience(channel, hour, day)
      .then((data) => {
        console.log("Audience data:", data);
        setAudienceData(data);
      })
      .catch((err) => {
        console.error("Error:", err);
        setError(`Failed to load audience data — ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, [channel, hour, day]);

  const charts = audienceData ? mapAudienceToCharts(audienceData) : null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Audience Profile</h3>
            <p className="text-xs text-muted-foreground">Demographic breakdown by channel, day & hour</p>
          </div>
        </div>
        {audienceData && (
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Total households</div>
            <div className="text-lg font-bold text-primary">
              {audienceData.total_foyers.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Channel
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {channels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Day
          </label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>Hour</span>
            <span className="font-mono text-primary">{hour}:00</span>
          </label>
          <input
            type="range"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="audience-slider w-full"
            style={{ ["--pct" as any]: `${(hour / 23) * 100}%` }}
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>0h</span>
            <span>12h</span>
            <span>23h</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {loading || !charts ? (
          <>
            <SkeletonPie />
            <SkeletonPie />
            <SkeletonPie />
          </>
        ) : (
          <>
            <MiniPie title="By age" data={charts.age} colors={AGE_COLORS} />
            <MiniPie title="By gender" data={charts.sex} colors={SEX_COLORS} />
            <MiniPie title="By income" data={charts.income} colors={INC_COLORS} />
          </>
        )}
      </div>
    </div>
  );
}
