import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { Camera, Car, Eye, Megaphone, Download, Trophy } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/Skeleton";
import { generateBillboards, exportToCSV, type Billboard } from "@/lib/mockData";

export const Route = createFileRoute("/panneaux")({
  head: () => ({
    meta: [
      { title: "Billboards Monitoring — MediaPulse" },
      { name: "description", content: "Computer vision metrics on outdoor billboards across Tunisia." },
      { property: "og:title", content: "Billboards Monitoring — MediaPulse" },
      { property: "og:description", content: "Computer vision metrics on outdoor billboards across Tunisia." },
    ],
  }),
  component: PanneauxPage,
});

function Sparkline({ data }: { data: number[] }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-[40px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke="oklch(0.62 0.22 25)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PanneauxPage() {
  const [loading, setLoading] = useState(true);
  const [billboards, setBillboards] = useState<Billboard[]>(() => generateBillboards());
  const [sortBy, setSortBy] = useState<"carFlow" | "pedestrians">("carFlow");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setBillboards((bbs) =>
        bbs.map((b) => ({
          ...b,
          carFlow: Math.max(1000, b.carFlow + Math.floor((Math.random() - 0.5) * 600)),
          pedestrians: Math.max(200, b.pedestrians + Math.floor((Math.random() - 0.5) * 200)),
          lastUpdated: new Date().toISOString(),
        })),
      );
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const totalActive = billboards.filter((b) => b.status === "Actif").length;
  const totalCars = billboards.reduce((s, b) => s + b.carFlow, 0);
  const totalPed = billboards.reduce((s, b) => s + b.pedestrians, 0);
  const top = useMemo(
    () => [...billboards].sort((a, b) => b.pedestrians - a.pedestrians)[0],
    [billboards],
  );

  const sorted = useMemo(
    () => [...billboards].sort((a, b) => b[sortBy] - a[sortBy]),
    [billboards, sortBy],
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billboards (Panneaux)</h1>
            <p className="text-sm text-muted-foreground">
              Computer vision analytics on outdoor advertising
            </p>
          </div>
          <button
            onClick={() => exportToCSV("billboards.csv", billboards)}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[112px]" />)
          ) : (
            <>
              <KpiCard
                label="Active billboards"
                value={`${totalActive}/${billboards.length}`}
                icon={Megaphone}
              />
              <KpiCard
                label="Daily car traffic"
                value={totalCars.toLocaleString("en-US")}
                trend={3.2}
                icon={Car}
              />
              <KpiCard
                label="Pedestrian detections today"
                value={totalPed.toLocaleString("en-US")}
                trend={1.9}
                icon={Eye}
              />
              <KpiCard
                label="Top performing billboard"
                value={top.id}
                sub={`${top.pedestrians.toLocaleString("en-US")} detections`}
                icon={Trophy}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold">Billboards across Tunisia</h3>
            </div>
            <div className="h-[640px]">
              <MapContainer center={[35.5, 10]} zoom={7} className="h-full w-full">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap"
                />
                {billboards.map((b) => (
                  <CircleMarker
                    key={b.id}
                    center={[b.lat, b.lng]}
                    radius={b.id === top.id ? 11 : 7}
                    pathOptions={{
                      color: b.status === "Maintenance" ? "oklch(0.6 0 0)" : "oklch(0.62 0.22 25)",
                      fillColor:
                        b.status === "Maintenance" ? "oklch(0.4 0 0)" : "oklch(0.62 0.22 25)",
                      fillOpacity: 0.85,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="w-[240px] space-y-2 text-foreground">
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-xs font-bold text-primary">{b.id}</div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              b.status === "Actif"
                                ? "bg-[oklch(0.7_0.18_145)]/20 text-[oklch(0.7_0.18_145)]"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <div className="text-sm font-semibold">{b.location}</div>
                        <div className="text-[11px] text-muted-foreground">{b.city}</div>
                        <div className="flex h-20 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                          <Camera className="h-6 w-6 opacity-40" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Car className="h-3 w-3" /> Flux voitures
                          </span>
                          <span className="font-mono font-semibold">
                            {b.carFlow.toLocaleString("en-US")}/jour
                          </span>
                        </div>
                        <Sparkline data={b.trend} />
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-3 w-3" /> Piétons remarqué
                          </span>
                          <span className="font-mono font-semibold">
                            {b.pedestrians.toLocaleString("en-US")}{" "}
                            <span className="text-primary">({b.detectionRate}%)</span>
                          </span>
                        </div>
                        <div className="border-t border-border pt-1.5 text-[10px] text-muted-foreground">
                          📅 {new Date(b.lastUpdated).toLocaleString("en-GB")}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold">All billboards</h3>
              <div className="flex items-center gap-1 rounded-md border border-border p-0.5 text-[11px]">
                <button
                  onClick={() => setSortBy("carFlow")}
                  className={`rounded px-2 py-1 ${sortBy === "carFlow" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Cars
                </button>
                <button
                  onClick={() => setSortBy("pedestrians")}
                  className={`rounded px-2 py-1 ${sortBy === "pedestrians" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Pedestrians
                </button>
              </div>
            </div>
            <div className="max-h-[640px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">City</th>
                    <th className="px-4 py-2 text-right">Cars/day</th>
                    <th className="px-4 py-2 text-right">Pedestrians</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((b, i) => (
                    <tr
                      key={b.id}
                      className={`border-b border-border/50 transition-colors hover:bg-secondary/50 ${
                        i === 0 ? "bg-primary/10" : ""
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {i === 0 && <Trophy className="h-3 w-3 text-primary" />}
                          <span className="font-mono font-semibold">{b.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{b.city}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {b.carFlow.toLocaleString("en-US")}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {b.pedestrians.toLocaleString("en-US")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
