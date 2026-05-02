import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { generateAudienceProfile, TV_CHANNELS, DAYS_OF_WEEK, type DayOfWeek } from "@/lib/mockData";
import { Users } from "lucide-react";

const AGE_COLORS = ["oklch(0.62 0.22 25)", "oklch(0.65 0.18 250)", "oklch(0.72 0.18 145)", "oklch(0.78 0.16 75)"];
const SEX_COLORS = ["oklch(0.62 0.22 25)", "oklch(0.65 0.18 250)"];
const INC_COLORS = ["oklch(0.4 0.05 25)", "oklch(0.62 0.22 25)", "oklch(0.78 0.16 75)"];

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
              formatter={(v: number) => `${v}%`}
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

export function AudienceProfile() {
  const [channel, setChannel] = useState(TV_CHANNELS[0]);
  const [day, setDay] = useState<DayOfWeek>("Mon");
  const [hour, setHour] = useState(20);
  const [profile, setProfile] = useState(() => generateAudienceProfile(channel, hour, day));

  useEffect(() => {
    setProfile(generateAudienceProfile(channel, hour, day));
  }, [channel, hour, day]);

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
            {TV_CHANNELS.map((c) => (
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
            onChange={(e) => setDay(e.target.value as DayOfWeek)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {DAYS_OF_WEEK.map((d) => (
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
            min={6}
            max={24}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="audience-slider w-full"
            style={{
              ["--pct" as any]: `${((hour - 6) / 18) * 100}%`,
            }}
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>6h</span>
            <span>15h</span>
            <span>24h</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MiniPie title="By age" data={profile.age} colors={AGE_COLORS} />
        <MiniPie title="By gender" data={profile.sex} colors={SEX_COLORS} />
        <MiniPie title="By income" data={profile.income} colors={INC_COLORS} />
      </div>
    </div>
  );
}
