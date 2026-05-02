import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import {
  Camera, Car, Eye, Megaphone, Download, Trophy, Plus, X,
  Sparkles, AlertTriangle, Activity, ArrowUpDown,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/Skeleton";
import { generateBillboards, exportToCSV, type Billboard } from "@/lib/mockData";
import { TUNISIA_MAP_PROPS, TUNISIA_TILE_PROPS } from "@/lib/tunisia";

export const Route = createFileRoute("/billboards")({
  head: () => ({
    meta: [
      { title: "Billboards Monitoring — MediaPulse" },
      { name: "description", content: "Traffic and CV detection analytics on outdoor billboards in Tunisia." },
      { property: "og:title", content: "Billboards Monitoring — MediaPulse" },
      { property: "og:description", content: "Traffic and CV detection analytics on outdoor billboards in Tunisia." },
    ],
  }),
  component: BillboardsPage,
});

type Mode = "traffic" | "cv";
type SortKey = "id" | "name" | "type" | "traffic" | "pedestrians" | "status";


function BillboardsPage() {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("traffic");
  const [billboards, setBillboards] = useState<Billboard[]>([]);
  const [selected, setSelected] = useState<Billboard | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("traffic");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [posterAlert, setPosterAlert] = useState<{ id: number; billboard: Billboard; time: string } | null>(null);

  useEffect(() => {
    if (!posterAlert) return;
    const t = setTimeout(() => setPosterAlert(null), 6000);
    return () => clearTimeout(t);
  }, [posterAlert]);

  const handlePosterChange = (b: Billboard) => {
    setPosterAlert({
      id: Date.now(),
      billboard: b,
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    });
  };

  useEffect(() => {
    setBillboards(generateBillboards());
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // Live mock updates
  useEffect(() => {
    const id = setInterval(() => {
      setBillboards((bbs) =>
        bbs.map((b) => ({
          ...b,
          traffic: Math.max(2000, b.traffic + Math.floor((Math.random() - 0.5) * 800)),
          pedestrians: Math.max(200, b.pedestrians + Math.floor((Math.random() - 0.5) * 250)),
          lastUpdated: new Date().toISOString(),
        })),
      );
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const visible = useMemo(
    () => (mode === "cv" ? billboards.filter((b) => b.hasCamera) : billboards),
    [billboards, mode],
  );

  const totalActive = billboards.filter((b) => b.status === "Active").length;
  const totalCars = billboards.reduce((s, b) => s + b.traffic, 0);
  const totalPed = billboards.reduce((s, b) => s + b.pedestrians, 0);
  const top = useMemo(
    () => [...visible].sort((a, b) => b[mode === "cv" ? "pedestrians" : "traffic"] - a[mode === "cv" ? "pedestrians" : "traffic"])[0],
    [visible, mode],
  );

  const sorted = useMemo(() => {
    const arr = [...visible];
    arr.sort((a, b) => {
      const av = a[sortKey] as any;
      const bv = b[sortKey] as any;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "desc" ? bv - av : av - bv;
      }
      return sortDir === "desc"
        ? String(bv).localeCompare(String(av))
        : String(av).localeCompare(String(bv));
    });
    return arr;
  }, [visible, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const addBillboard = (b: Omit<Billboard, "pedestrians" | "detectionRate" | "status" | "size" | "lastUpdated">) => {
    setBillboards((prev) => [
      ...prev,
      {
        ...b,
        pedestrians: Math.floor(800 + Math.random() * 5000),
        detectionRate: Math.floor(60 + Math.random() * 30),
        status: "Active",
        size: "8x4 m",
        lastUpdated: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billboards</h1>
            <p className="text-sm text-muted-foreground">
              Outdoor advertising network — traffic & computer vision
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ModePill mode={mode} onChange={setMode} />
            <button
              onClick={() => exportToCSV("billboards.csv", billboards)}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[112px]" />)
          ) : (
            <>
              <KpiCard label="Active billboards" value={`${totalActive}/${billboards.length}`} icon={Megaphone} />
              <KpiCard label="Daily car traffic" value={totalCars.toLocaleString("en-US")} trend={3.2} icon={Car} />
              <KpiCard label="Pedestrian detections today" value={totalPed.toLocaleString("en-US")} trend={1.9} icon={Eye} />
              <KpiCard
                label={mode === "cv" ? "Top CV billboard" : "Top performing billboard"}
                value={top?.id ?? "—"}
                sub={top ? `${(mode === "cv" ? top.pedestrians : top.traffic).toLocaleString("en-US")} ${mode === "cv" ? "detections" : "cars/day"}` : ""}
                icon={Trophy}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
          <div className="relative overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold">
                {mode === "cv" ? "Active CV-monitored billboards" : "All billboards across Tunisia"}
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {visible.length} pin{visible.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-[640px]">
              <MapContainer {...TUNISIA_MAP_PROPS} className="h-full w-full" zoomControl>
                <TileLayer {...TUNISIA_TILE_PROPS} />
                {visible.map((b) => {
                  const color =
                    mode === "cv"
                      ? "oklch(0.62 0.22 25)"
                      : b.status === "Maintenance"
                        ? "oklch(0.55 0 0)"
                        : "oklch(0.62 0.22 25)";
                  const isTop = top && b.id === top.id;
                  return (
                    <CircleMarker
                      key={b.id}
                      center={[b.lat, b.lng]}
                      radius={isTop ? 11 : 7}
                      pathOptions={{
                        color,
                        fillColor: color,
                        fillOpacity: 0.85,
                        weight: 2,
                      }}
                      eventHandlers={{ click: () => setSelected(b) }}
                    >
                      <Popup>
                        <div className="w-[240px] space-y-1.5 text-foreground">
                          <div className="flex items-center justify-between">
                            <div className="font-mono text-xs font-bold text-primary">{b.id}</div>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${b.type === "digital" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                              {b.type}
                            </span>
                          </div>
                          <div className="text-sm font-semibold">{b.name}</div>
                          <div className="text-[11px] text-muted-foreground">{b.city} · {b.size}</div>
                          <div className="flex items-center justify-between border-t border-border pt-1.5 text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Car className="h-3 w-3" /> Traffic/day
                            </span>
                            <span className="font-mono font-semibold">{b.traffic.toLocaleString("en-US")}</span>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>

            {/* Floating LIVE traffic badges (Traffic mode only) */}
            {mode === "traffic" && (
              <div className="pointer-events-none absolute left-4 top-16 rounded-md bg-background/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Live traffic
              </div>
            )}

            {/* Floating + button */}
            {mode === "traffic" && (
              <button
                onClick={() => setShowAdd(true)}
                className="absolute bottom-5 right-5 z-[400] flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 transition-transform hover:scale-110 pulse-red"
              >
                <Plus className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Side summary table */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold">All billboards</h3>
              <span className="text-[10px] uppercase text-muted-foreground">
                {sortKey} · {sortDir}
              </span>
            </div>
            <div className="max-h-[640px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    {([
                      ["id", "ID"],
                      ["name", "Name"],
                      ["type", "Type"],
                      ["traffic", "Cars/day"],
                      ...(mode === "cv" ? [["pedestrians", "Ped."]] : []),
                      ["status", "Status"],
                    ] as [SortKey, string][]).map(([k, label]) => (
                      <th
                        key={k}
                        onClick={() => toggleSort(k)}
                        className="cursor-pointer px-3 py-2 text-left transition-colors hover:text-primary"
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          <ArrowUpDown className="h-2.5 w-2.5 opacity-50" />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((b, i) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelected(b)}
                      className={`cursor-pointer border-b border-border/50 transition-colors hover:bg-secondary/50 ${
                        i === 0 ? "bg-primary/10" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {i === 0 && <Trophy className="h-3 w-3 text-primary" />}
                          <span className="font-mono font-semibold">{b.id}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{b.city}</td>
                      <td className="px-3 py-2.5 uppercase">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${b.type === "digital" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {b.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                        {b.traffic.toLocaleString("en-US")}
                      </td>
                      {mode === "cv" && (
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                          {b.pedestrians.toLocaleString("en-US")}
                        </td>
                      )}
                      <td className="px-3 py-2.5 text-[10px]">
                        <span className={`rounded-full px-1.5 py-0.5 ${b.status === "Active" ? "bg-[oklch(0.7_0.18_145)]/15 text-[oklch(0.78_0.18_145)]" : "bg-muted text-muted-foreground"}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recommendation section */}
        <BillboardRecommendation billboards={billboards} />
      </main>

      {/* Top-of-page poster change toast */}
      {posterAlert && (
        <div className="fixed left-1/2 top-20 z-[500] w-[min(92vw,460px)] -translate-x-1/2 animate-fade-in">
          <div className="flex items-start gap-3 rounded-lg border border-primary/60 bg-card/95 p-4 shadow-2xl shadow-primary/30 backdrop-blur">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">Poster change detected</div>
              <div className="mt-0.5 text-sm font-semibold text-foreground">
                {posterAlert.billboard.id} · {posterAlert.billboard.name}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Computer vision flagged a creative swap at {posterAlert.time}
              </div>
            </div>
            <button
              onClick={() => setPosterAlert(null)}
              className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* CV detection drawer */}
      {mode === "cv" && selected && selected.hasCamera && (
        <CvDrawer billboard={selected} onClose={() => setSelected(null)} onPosterChange={handlePosterChange} />
      )}

      {/* Add billboard modal */}
      {showAdd && <AddBillboardModal onClose={() => setShowAdd(false)} onAdd={addBillboard} />}
    </div>
  );
}

// =============== SUB COMPONENTS ===============

function ModePill({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      <button
        onClick={() => onChange("traffic")}
        className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
          mode === "traffic" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        🚗 Traffic Mode
      </button>
      <button
        onClick={() => onChange("cv")}
        className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
          mode === "cv" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        👁️ CV Detection Mode
      </button>
    </div>
  );
}

function CvDrawer({ billboard, onClose, onPosterChange }: { billboard: Billboard; onClose: () => void; onPosterChange: (b: Billboard) => void }) {
  const [pedCount, setPedCount] = useState(billboard.pedestrians);
  const [feedCount, setFeedCount] = useState(0);

  useEffect(() => {
    const id1 = setInterval(() => setPedCount((c) => c + 1), 3000);
    const id2 = setInterval(() => setFeedCount(Math.floor(2 + Math.random() * 9)), 1500);
    // Occasional poster-change detection event
    const id3 = setInterval(() => {
      if (Math.random() < 0.35) onPosterChange(billboard);
    }, 12000);
    return () => { clearInterval(id1); clearInterval(id2); clearInterval(id3); };
  }, [billboard, onPosterChange]);

  return (
    <div className="fixed inset-y-0 right-0 z-[450] w-[380px] max-w-full overflow-y-auto border-l border-border bg-card shadow-2xl animate-fade-in">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div>
          <div className="font-mono text-xs font-bold text-primary">{billboard.id}</div>
          <div className="text-sm font-semibold">{billboard.name}</div>
          <div className="text-[10px] text-muted-foreground">{billboard.city} · {billboard.size}</div>
        </div>
        <button onClick={onClose} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-5">
        {/* Mock camera feed */}
        <div className="relative h-[160px] overflow-hidden rounded-lg border border-border bg-[oklch(0.04_0_0)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,oklch(0.15_0_0),transparent_70%)]" />
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            LIVE
          </div>
          <div className="absolute right-3 top-3 rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-foreground">
            CAM-{billboard.id.slice(-3)}
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-[10px]">
            <div className="rounded bg-black/60 px-2 py-1 font-mono">
              <div className="text-muted-foreground">PEDESTRIANS IN FRAME</div>
              <div className="text-lg font-bold text-primary">{feedCount}</div>
            </div>
            <Camera className="h-8 w-8 opacity-30" />
          </div>
          {/* Scanline */}
          <div className="absolute inset-x-0 top-0 h-px animate-[scan_3s_linear_infinite] bg-primary/40" style={{ animation: "scan 3s linear infinite" }} />
        </div>

        {/* Pedestrian counter */}
        <div className="rounded-lg border border-border bg-background/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pedestrian detections today
              </span>
            </div>
          </div>
          <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-foreground">
            {pedCount.toLocaleString("en-US")}
            <span className="ml-2 text-xs font-medium text-[oklch(0.7_0.18_145)]">+1</span>
          </div>
        </div>

        {/* Detection rate gauge */}
        <div className="rounded-lg border border-border bg-background/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Detection rate
            </span>
            <span className="font-mono text-sm font-bold text-primary">{billboard.detectionRate}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.78_0.18_75)] transition-all duration-700"
              style={{ width: `${billboard.detectionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AddBillboardModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (b: Omit<Billboard, "pedestrians" | "detectionRate" | "status" | "size" | "lastUpdated">) => void;
}) {
  const [type, setType] = useState<"digital" | "paper">("digital");
  const [name, setName] = useState("");
  const [lat, setLat] = useState("36.8");
  const [lng, setLng] = useState("10.18");
  const [traffic, setTraffic] = useState("20000");
  const [hasCamera, setHasCamera] = useState(false);
  const idRef = useRef(`BB-${Math.floor(Math.random() * 900 + 100)}`);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAdd({
      id: idRef.current,
      name,
      city: "Tunis",
      lat: Number(lat),
      lng: Number(lng),
      type,
      traffic: Number(traffic),
      hasCamera,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 p-4 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Add a new billboard</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</label>
            <div className="flex gap-2">
              {(["paper", "digital"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium uppercase transition-colors ${type === t ? "border-primary bg-primary/15 text-primary" : "border-border bg-background text-muted-foreground"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Name / Label</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Avenue Habib Bourguiba - North"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Latitude</label>
              <input value={lat} onChange={(e) => setLat(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Longitude</label>
              <input value={lng} onChange={(e) => setLng(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Daily traffic estimate</label>
            <input value={traffic} onChange={(e) => setTraffic(e.target.value)} type="number" className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasCamera} onChange={(e) => setHasCamera(e.target.checked)} className="accent-[oklch(0.62_0.22_25)]" />
            Equipped with CV camera
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Add billboard</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BillboardRecommendation({ billboards }: { billboards: Billboard[] }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [days, setDays] = useState(7);
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ b: Billboard; score: number; reach: number; reason: string }[] | null>(null);

  const run = () => {
    setLoading(true);
    setResults(null);
    setTimeout(() => {
      const ranked = [...billboards]
        .map((b) => {
          const seed = (audience.length || 1) + b.traffic / 1000;
          const score = Math.min(99, Math.round(60 + Math.abs(Math.sin(seed * b.lat)) * 38));
          return {
            b,
            score,
            reach: Math.round(b.traffic * (0.6 + Math.random() * 0.4)),
            reason:
              b.type === "digital"
                ? "Digital screen — premium impressions, ideal for dynamic creatives"
                : "High traffic corridor — best cost-per-impression for mass reach",
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      setResults(ranked);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold">🎯 Best Billboard Recommendation</h3>
          <p className="text-xs text-muted-foreground">AI-powered ranking by reach & relevance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Start date</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">End date</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Days on air</label>
          <input type="number" min={1} max={90} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Target audience</label>
          <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Young commuters, premium" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="mt-4 w-full rounded-md bg-gradient-to-r from-primary to-[oklch(0.55_0.2_30)] px-5 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Analyzing…" : "Get Recommendation"}
      </button>

      <div className="mt-5">
        {!results && !loading && (
          <div className="rounded-md border border-dashed border-border bg-background/40 p-6 text-center text-xs text-muted-foreground">
            Configure your campaign and click "Get Recommendation".
          </div>
        )}
        {loading && (
          <div className="rounded-md border border-border bg-background/40 p-6 text-center text-xs text-muted-foreground">
            <Activity className="mx-auto mb-2 h-5 w-5 animate-pulse text-primary" />
            Computing optimal billboard mix…
          </div>
        )}
        {results && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 animate-fade-in">
            {results.map((r, i) => (
              <div key={r.b.id} className={`rounded-lg border p-4 ${i === 0 ? "border-primary bg-primary/5" : "border-border bg-background/50"}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">#{i + 1} · {r.b.id}</span>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">{r.score}%</span>
                </div>
                <div className="text-sm font-semibold">{r.b.name}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{r.b.city} · {r.b.type.toUpperCase()}</div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Daily reach</span>
                  <span className="font-mono font-semibold">{r.reach.toLocaleString("en-US")}</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{r.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
