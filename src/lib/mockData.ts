// Centralized mock data for the dashboard

export const TV_CHANNELS = [
  "Nessma TV",
  "El Hiwar Ettounsi",
  "Watania 1",
  "Watania 2",
  "Hannibal TV",
  "TFM",
  "Attessia",
];

export function generateChannelViewers() {
  return TV_CHANNELS.map((name) => ({
    name,
    viewers: Math.floor(80000 + Math.random() * 420000),
  }));
}

export function generateZappingData() {
  return Array.from({ length: 19 }, (_, i) => {
    const hour = 6 + i;
    // peak around 20-21h
    const base = 200 + Math.exp(-Math.pow(hour - 20.5, 2) / 8) * 1800;
    return {
      hour: `${hour}h`,
      hourNum: hour,
      zaps: Math.floor(base + Math.random() * 250),
    };
  });
}

export function generateAudienceProfile(channel: string, hour: number) {
  const seed = channel.length + hour;
  const rand = (n: number) => ((Math.sin(seed * 9.7 + n) + 1) / 2);
  const ageRaw = [rand(1) * 30 + 10, rand(2) * 35 + 15, rand(3) * 30 + 20, rand(4) * 30 + 15];
  const ageTotal = ageRaw.reduce((a, b) => a + b, 0);
  const age = ageRaw.map((v) => Math.round((v / ageTotal) * 100));
  const sexH = Math.round(35 + rand(5) * 30);
  const incLow = Math.round(20 + rand(7) * 30);
  const incMed = Math.round(30 + rand(8) * 30);
  return {
    age: [
      { name: "18-24", value: age[0] },
      { name: "25-34", value: age[1] },
      { name: "35-44", value: age[2] },
      { name: "45+", value: age[3] },
    ],
    sex: [
      { name: "Hommes", value: sexH },
      { name: "Femmes", value: 100 - sexH },
    ],
    income: [
      { name: "Faible", value: incLow },
      { name: "Moyen", value: incMed },
      { name: "Élevé", value: 100 - incLow - incMed },
    ],
  };
}

// Tunisia governorates with approximate coordinates
export const GOVERNORATES = [
  { name: "Tunis", lat: 36.8065, lng: 10.1815 },
  { name: "Ariana", lat: 36.8625, lng: 10.1956 },
  { name: "Ben Arous", lat: 36.7533, lng: 10.2189 },
  { name: "Manouba", lat: 36.8101, lng: 10.0956 },
  { name: "Nabeul", lat: 36.4561, lng: 10.7376 },
  { name: "Zaghouan", lat: 36.4029, lng: 10.1428 },
  { name: "Bizerte", lat: 37.2744, lng: 9.8739 },
  { name: "Béja", lat: 36.7256, lng: 9.1817 },
  { name: "Jendouba", lat: 36.5011, lng: 8.78 },
  { name: "Le Kef", lat: 36.1742, lng: 8.7049 },
  { name: "Siliana", lat: 36.0844, lng: 9.3708 },
  { name: "Sousse", lat: 35.8256, lng: 10.6411 },
  { name: "Monastir", lat: 35.7643, lng: 10.8113 },
  { name: "Mahdia", lat: 35.5047, lng: 11.0622 },
  { name: "Kairouan", lat: 35.6781, lng: 10.0963 },
  { name: "Kasserine", lat: 35.1676, lng: 8.8365 },
  { name: "Sidi Bouzid", lat: 35.0381, lng: 9.4858 },
  { name: "Sfax", lat: 34.7406, lng: 10.7603 },
  { name: "Gabès", lat: 33.8815, lng: 10.0982 },
  { name: "Mednine", lat: 33.3399, lng: 10.4951 },
  { name: "Tataouine", lat: 32.9297, lng: 10.4518 },
  { name: "Gafsa", lat: 34.425, lng: 8.7842 },
  { name: "Tozeur", lat: 33.9197, lng: 8.1335 },
  { name: "Kebili", lat: 33.7041, lng: 8.969 },
];

const NATIONAL_RADIOS = ["Mosaique FM", "Jawhara FM", "Express FM", "IFM", "Shems FM", "RTCI", "Cap FM"];
const REGIONAL_BY_GOV: Record<string, string[]> = {
  Tunis: ["Radio Tunis", "Radio Med"],
  Sfax: ["Radio Sfax", "Diwan FM"],
  Sousse: ["Sabra FM", "Radio Sousse"],
  Gabès: ["Radio Gabès"],
  Bizerte: ["Radio Bizerte"],
  Monastir: ["Radio Monastir"],
  Kairouan: ["Radio Kairouan"],
};

export function generateRadioData() {
  return GOVERNORATES.map((g) => {
    const popFactor =
      g.name === "Tunis" ? 1 : g.name === "Sfax" || g.name === "Sousse" ? 0.7 : 0.3 + Math.random() * 0.3;
    const totalListeners = Math.floor(popFactor * 250000 + Math.random() * 40000);
    const stations = [
      ...NATIONAL_RADIOS.map((n) => ({
        name: n,
        listeners: Math.floor((totalListeners / 7) * (0.6 + Math.random() * 0.8)),
      })),
      ...(REGIONAL_BY_GOV[g.name] ?? []).map((n) => ({
        name: n,
        listeners: Math.floor(totalListeners * (0.15 + Math.random() * 0.2)),
      })),
    ].sort((a, b) => b.listeners - a.listeners);
    return { ...g, totalListeners, stations };
  });
}

export type Billboard = {
  id: string;
  location: string;
  city: string;
  lat: number;
  lng: number;
  carFlow: number;
  pedestrians: number;
  detectionRate: number;
  status: "Actif" | "Maintenance";
  lastUpdated: string;
  trend: number[];
};

const CITY_COORDS: Record<string, [number, number]> = {
  Tunis: [36.8065, 10.1815],
  Sfax: [34.7406, 10.7603],
  Sousse: [35.8256, 10.6411],
  Monastir: [35.7643, 10.8113],
  Nabeul: [36.4561, 10.7376],
  Bizerte: [37.2744, 9.8739],
  Gabès: [33.8815, 10.0982],
};

const STREET_NAMES = [
  "Avenue Habib Bourguiba",
  "Avenue de la Liberté",
  "Rue de Carthage",
  "Avenue Mohamed V",
  "Boulevard du 7 Novembre",
  "Avenue Taieb Mhiri",
  "Rue de Marseille",
  "Avenue de Paris",
  "Boulevard de l'Environnement",
  "Avenue Farhat Hached",
];

export function generateBillboards(): Billboard[] {
  const cities = Object.keys(CITY_COORDS);
  const list: Billboard[] = [];
  let id = 1;
  cities.forEach((city) => {
    const count = city === "Tunis" ? 6 : city === "Sfax" || city === "Sousse" ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const [lat, lng] = CITY_COORDS[city];
      list.push({
        id: `BB-${String(id).padStart(3, "0")}`,
        location: STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)],
        city,
        lat: lat + (Math.random() - 0.5) * 0.06,
        lng: lng + (Math.random() - 0.5) * 0.06,
        carFlow: Math.floor(3000 + Math.random() * 22000),
        pedestrians: Math.floor(800 + Math.random() * 8000),
        detectionRate: Math.floor(45 + Math.random() * 45),
        status: Math.random() > 0.12 ? "Actif" : "Maintenance",
        lastUpdated: new Date(Date.now() - Math.random() * 3600_000).toISOString(),
        trend: Array.from({ length: 12 }, () => Math.floor(2000 + Math.random() * 8000)),
      });
      id++;
    }
  });
  return list;
}

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
