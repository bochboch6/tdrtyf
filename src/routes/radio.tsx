import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip as LTooltip } from "react-leaflet";
import { Headphones, MapPin, Radio as RadioIcon, X, Play } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { KpiCard } from "@/components/KpiCard";
import { Skeleton } from "@/components/Skeleton";
import { RadioPlayer } from "@/components/RadioPlayer";
import { AudiencePills } from "@/components/radio/AudiencePills";
import { generateRadioData, RADIO_STREAMS } from "@/lib/mockData";
import { TUNISIA_MAP_PROPS, TUNISIA_TILE_PROPS } from "@/lib/tunisia";

export const Route = createFileRoute("/radio")({
  head: () => ({
    meta: [
      { title: "Radio Monitoring — MediaPulse" },
      { name: "description", content: "Live radio listenership across Tunisian governorates." },
      { property: "og:title", content: "Radio Monitoring — MediaPulse" },
      { property: "og:description", content: "Live radio listenership across Tunisian governorates." },
    ],
  }),
  component: RadioPage,
});

function RadioPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReturnType<typeof generateRadioData>>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [expandedStation, setExpandedStation] = useState<string | null>(null);
  const [player, setPlayer] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => {
    setData(generateRadioData());
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setData(generateRadioData()), 5000);
    return () => clearInterval(id);
  }, []);

  const total = data.reduce((s, g) => s + g.totalListeners, 0);
  const topGov = [...data].sort((a, b) => b.totalListeners - a.totalListeners)[0];
  const topStation = useMemo(() => {
    const agg = new Map<string, number>();
    data.forEach((g) => g.stations.forEach((s) => agg.set(s.name, (agg.get(s.name) ?? 0) + s.listeners)));
    return [...agg.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [data]);

  const max = Math.max(...data.map((d) => d.totalListeners));
  const selectedGov = data.find((g) => g.name === selected);

  const colorFor = (listeners: number) => {
    const t = listeners / max;
    if (t > 0.7) return "oklch(0.62 0.22 25)";
    if (t > 0.45) return "oklch(0.5 0.18 25)";
    if (t > 0.25) return "oklch(0.38 0.12 25)";
    return "oklch(0.3 0.05 25)";
  };

  const playStation = (name: string) => {
    const url = RADIO_STREAMS[name] ?? "";
    setPlayer({ name, url });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Radio Network</h1>
          <p className="text-sm text-muted-foreground">National listenership by governorate</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {loading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-[112px]" />)
          ) : (
            <>
              <KpiCard
                label="Total listeners (national)"
                value={total.toLocaleString("en-US")}
                trend={1.8}
                icon={Headphones}
              />
              <KpiCard
                label="Most listened governorate"
                value={topGov.name}
                sub={`${topGov.totalListeners.toLocaleString("en-US")} listeners`}
                icon={MapPin}
              />
              <KpiCard
                label="Top radio station"
                value={topStation?.[0] ?? "—"}
                sub={`${topStation?.[1].toLocaleString("en-US")} listeners`}
                icon={RadioIcon}
              />
            </>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold">Tunisia listenership map</h3>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.3_0.05_25)]" /> Low
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5_0.18_25)]" /> Med
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.62_0.22_25)]" /> High
              </span>
            </div>
          </div>
          <div className="h-[560px]">
            <MapContainer {...TUNISIA_MAP_PROPS} className="h-full w-full" zoomControl>
              <TileLayer {...TUNISIA_TILE_PROPS} />
              {data.map((g) => (
                <CircleMarker
                  key={g.name}
                  center={[g.lat, g.lng]}
                  radius={8 + (g.totalListeners / max) * 18}
                  pathOptions={{
                    color: colorFor(g.totalListeners),
                    fillColor: colorFor(g.totalListeners),
                    fillOpacity: selected === g.name ? 0.95 : 0.65,
                    weight: selected === g.name ? 3 : 2,
                  }}
                  eventHandlers={{ click: () => setSelected(g.name) }}
                >
                  <LTooltip direction="top" offset={[0, -8]} opacity={1}>
                    <div style={{ fontSize: 12 }}>
                      <strong>{g.name}</strong>
                      <br />
                      {g.totalListeners.toLocaleString("en-US")} listeners
                    </div>
                  </LTooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Inline expandable governorate panel BELOW the map */}
        {selectedGov && (
          <div className="rounded-xl border border-border bg-card animate-fade-in">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{selectedGov.name}</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedGov.totalListeners.toLocaleString("en-US")} total listeners ·{" "}
                    {selectedGov.stations.length} stations
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
              {selectedGov.stations.map((s, i) => {
                const maxL = selectedGov.stations[0].listeners;
                const isOpen = expandedStation === s.name;
                return (
                  <div key={s.name} className="rounded-lg border border-border bg-background/50 p-4">
                    <button
                      type="button"
                      onClick={() => setExpandedStation(isOpen ? null : s.name)}
                      className="w-full text-left"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-muted-foreground">#{i + 1}</span>
                          <span className="text-sm font-semibold">{s.name}</span>
                        </div>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          {s.listeners.toLocaleString("en-US")}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700"
                          style={{ width: `${(s.listeners / maxL) * 100}%` }}
                        />
                      </div>
                      {!isOpen && (
                        <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                          Click to view audience profile
                        </div>
                      )}
                    </button>
                    {isOpen && <AudiencePills audience={s.audience} />}
                    {isOpen && (
                      <button
                        onClick={() => playStation(s.name)}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <Play className="h-3 w-3" /> 🎧 Listen Live
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!selectedGov && (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
            <MapPin className="mx-auto mb-2 h-6 w-6 opacity-40" />
            Click any governorate on the map to view its radio stations
          </div>
        )}
      </main>

      <RadioPlayer
        stationName={player?.name ?? null}
        streamUrl={player?.url ?? null}
        onClose={() => setPlayer(null)}
      />
    </div>
  );
}
