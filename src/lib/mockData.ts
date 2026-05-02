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
    const base = 200 + Math.exp(-Math.pow(hour - 20.5, 2) / 8) * 1800;
    return {
      hour: `${hour}h`,
      hourNum: hour,
      zaps: Math.floor(base + Math.random() * 250),
    };
  });
}

// For each hour, top 3 channels people zapped FROM (share %).
export function generateZappingSources() {
  return Array.from({ length: 19 }, (_, i) => {
    const hour = 6 + i;
    // Pick 3 channels weighted differently per hour
    const seed = (n: number) => Math.abs(Math.sin(hour * 1.7 + n * 3.1));
    const pool = [...TV_CHANNELS].sort((a, b) => seed(a.length) - seed(b.length));
    const a = Math.round(35 + seed(1) * 25); // 35-60
    const b = Math.round(20 + seed(2) * 20); // 20-40
    const c = Math.max(5, 100 - a - b);
    return {
      hour: `${hour}h`,
      hourNum: hour,
      sources: [
        { channel: pool[0], share: a },
        { channel: pool[1], share: b },
        { channel: pool[2], share: c },
      ],
    };
  });
}

export const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export function generateAudienceProfile(channel: string, hour: number, day: DayOfWeek = "Mon") {
  const dayIdx = DAYS_OF_WEEK.indexOf(day);
  const seed = channel.length + hour + dayIdx * 1.7;
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
      { name: "Men", value: sexH },
      { name: "Women", value: 100 - sexH },
    ],
    income: [
      { name: "Low", value: incLow },
      { name: "Middle", value: incMed },
      { name: "High", value: 100 - incLow - incMed },
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

// Real / mock streaming URLs — fall back to a silent loop when none.
export const RADIO_STREAMS: Record<string, string> = {
  "Mosaique FM": "https://streaming.mosaiquefm.net/mosaique",
  "Shems FM": "https://shemsfm.net/streaming",
  "Jawhara FM": "https://stream.zeno.fm/0r0xa792kwzuv",
  "Express FM": "https://stream.zeno.fm/v596wqxm6vhvv",
  IFM: "https://stream.zeno.fm/u8q0e6r8qg8uv",
  RTCI: "https://stream.radiojar.com/8s5u5tpdtwzuv",
  "Cap FM": "https://stream.zeno.fm/g69bhzv2mnhvv",
};

export type RadioStation = {
  name: string;
  listeners: number;
  audience: {
    womenPct: number;
    age45Plus: number;
    region: string;
    income: "Low" | "Middle" | "High";
  };
};

function pickIncome(seed: number): "Low" | "Middle" | "High" {
  const v = Math.abs(Math.sin(seed)) * 3;
  return v < 1 ? "Low" : v < 2 ? "Middle" : "High";
}

export function generateRadioData() {
  return GOVERNORATES.map((g) => {
    const popFactor =
      g.name === "Tunis" ? 1 : g.name === "Sfax" || g.name === "Sousse" ? 0.7 : 0.3 + Math.random() * 0.3;
    const totalListeners = Math.floor(popFactor * 250000 + Math.random() * 40000);
    const stations: RadioStation[] = [
      ...NATIONAL_RADIOS.map((n, i) => ({
        name: n,
        listeners: Math.floor((totalListeners / 7) * (0.6 + Math.random() * 0.8)),
        audience: {
          womenPct: 40 + Math.floor(Math.abs(Math.sin(n.length + i)) * 30),
          age45Plus: 25 + Math.floor(Math.abs(Math.cos(n.length + i)) * 40),
          region: `${g.name} region`,
          income: pickIncome(n.length + i),
        },
      })),
      ...(REGIONAL_BY_GOV[g.name] ?? []).map((n, i) => ({
        name: n,
        listeners: Math.floor(totalListeners * (0.15 + Math.random() * 0.2)),
        audience: {
          womenPct: 35 + Math.floor(Math.abs(Math.sin(n.length + i + 9)) * 35),
          age45Plus: 30 + Math.floor(Math.abs(Math.cos(n.length + i + 4)) * 40),
          region: `${g.name} local`,
          income: pickIncome(n.length + i + 3),
        },
      })),
    ].sort((a, b) => b.listeners - a.listeners);
    return { ...g, totalListeners, stations };
  });
}

// ============== BILLBOARDS ==============
export type Billboard = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  type: "digital" | "paper";
  traffic: number; // cars/day
  pedestrians: number;
  detectionRate: number;
  hasCamera: boolean;
  status: "Active" | "Maintenance";
  size: string;
  lastUpdated: string;
};

const BASE_BILLBOARDS: Omit<Billboard, "pedestrians" | "detectionRate" | "status" | "size" | "lastUpdated">[] = [
  { id: "BB-001", name: "Avenue Habib Bourguiba - Centre", city: "Tunis", lat: 36.8008, lng: 10.18, type: "digital", traffic: 42000, hasCamera: true },
  { id: "BB-002", name: "Lac 1 - Les Berges du Lac", city: "Tunis", lat: 36.832, lng: 10.23, type: "digital", traffic: 38000, hasCamera: true },
  { id: "BB-003", name: "Autoroute A1 - Sortie Tunis Sud", city: "Tunis", lat: 36.75, lng: 10.17, type: "paper", traffic: 55000, hasCamera: false },
  { id: "BB-004", name: "La Marsa - Avenue Taieb Mehiri", city: "Tunis", lat: 36.878, lng: 10.325, type: "digital", traffic: 22000, hasCamera: true },
  { id: "BB-005", name: "Ariana - Avenue de la Banlieue Nord", city: "Ariana", lat: 36.8625, lng: 10.1956, type: "paper", traffic: 29000, hasCamera: false },
  { id: "BB-006", name: "Ben Arous - Route de Mornag", city: "Ben Arous", lat: 36.75, lng: 10.22, type: "paper", traffic: 31000, hasCamera: false },
  { id: "BB-007", name: "Sfax - Avenue Farhat Hached", city: "Sfax", lat: 34.7406, lng: 10.7603, type: "digital", traffic: 27000, hasCamera: true },
  { id: "BB-008", name: "Sfax - Route de Tunis (GP1)", city: "Sfax", lat: 34.82, lng: 10.74, type: "paper", traffic: 33000, hasCamera: false },
  { id: "BB-009", name: "Sousse - Avenue Habib Bourguiba", city: "Sousse", lat: 35.8245, lng: 10.6346, type: "digital", traffic: 24000, hasCamera: true },
  { id: "BB-010", name: "Autoroute A1 - Entrée Sousse", city: "Sousse", lat: 35.78, lng: 10.61, type: "paper", traffic: 48000, hasCamera: false },
  { id: "BB-011", name: "Monastir - Route de l'Aéroport", city: "Monastir", lat: 35.7386, lng: 10.9078, type: "digital", traffic: 19000, hasCamera: true },
  { id: "BB-012", name: "Mahdia - Route Nationale 1", city: "Mahdia", lat: 35.5047, lng: 11.0622, type: "paper", traffic: 11000, hasCamera: false },
  { id: "BB-013", name: "Hammamet - Avenue des Nations", city: "Nabeul", lat: 36.4, lng: 10.61, type: "digital", traffic: 21000, hasCamera: true },
  { id: "BB-014", name: "Nabeul - Route Touristique", city: "Nabeul", lat: 36.4513, lng: 10.735, type: "paper", traffic: 15000, hasCamera: false },
  { id: "BB-015", name: "Bizerte - Avenue Habib Bourguiba", city: "Bizerte", lat: 37.2744, lng: 9.8739, type: "paper", traffic: 17000, hasCamera: false },
  { id: "BB-016", name: "Kairouan - Avenue de la République", city: "Kairouan", lat: 35.6781, lng: 10.0963, type: "paper", traffic: 13000, hasCamera: false },
  { id: "BB-017", name: "Gabès - Avenue Farhat Hached", city: "Gabès", lat: 33.8828, lng: 10.0982, type: "digital", traffic: 12000, hasCamera: true },
  { id: "BB-018", name: "Autoroute A1 - Entrée Gabès", city: "Gabès", lat: 33.92, lng: 10.07, type: "paper", traffic: 22000, hasCamera: false },
  { id: "BB-019", name: "Médenine - Route de Djerba", city: "Mednine", lat: 33.3549, lng: 10.5055, type: "paper", traffic: 9000, hasCamera: false },
  { id: "BB-020", name: "Djerba - Route Touristique Midoun", city: "Mednine", lat: 33.8076, lng: 10.9947, type: "digital", traffic: 16000, hasCamera: true },
];

const SIZES = ["4x3 m", "8x4 m", "12x4 m", "6x3 m"];

export function generateBillboards(): Billboard[] {
  return BASE_BILLBOARDS.map((b, i) => ({
    ...b,
    pedestrians: Math.floor(800 + Math.random() * 8000),
    detectionRate: Math.floor(55 + Math.random() * 40),
    status: Math.random() > 0.1 ? "Active" : "Maintenance",
    size: SIZES[i % SIZES.length],
    lastUpdated: new Date(Date.now() - Math.random() * 3600_000).toISOString(),
  }));
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
