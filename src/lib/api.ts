// Data source: /public/data/audience_ramadan.csv
// NO backend — all functions read and aggregate the CSV directly.
//
// Actual CSV columns:
//   nom_chaine, heure, est_ramadan, age_groupe_pred, sexe_pred, revenu_pred, nb_foyers

export interface AudienceData {
  chaine: string;
  heure: number;
  total_foyers: number;
  par_age: Record<string, number>;
  par_sexe: Record<string, number>;
  par_revenu: Record<string, number>;
}

export interface RecommendationParams {
  chaine: string;
  objectif: string;
  sexe?: string | null;
  age_groupe?: string | null;
  revenu?: string | null;
}

export type ChatHistoryItem = { role: "user" | "bot"; text: string };

interface CsvRow {
  nom_chaine: string;
  heure: number;
  est_ramadan: boolean;
  age_groupe_pred: string;
  sexe_pred: string;
  revenu_pred: string;
  nb_foyers: number;
}

// Fetched once per session.
let csvCache: Promise<CsvRow[]> | null = null;

function parseBool(val: string): boolean {
  const v = val.trim().toLowerCase();
  return v === "true" || v === "1" || v === "oui";
}

function loadCsv(): Promise<CsvRow[]> {
  if (csvCache) return csvCache;

  csvCache = fetch("/data/audience_ramadan.csv")
    .then((res) => {
      if (!res.ok)
        throw new Error(
          `CSV not found (HTTP ${res.status}). Make sure public/data/audience_ramadan.csv exists.`,
        );
      return res.text();
    })
    .then((text) => {
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error("CSV file is empty or has no data rows.");

      const [header, ...dataLines] = lines;
      const cols = header.split(",").map((c) => c.trim().replace(/^﻿/, "")); // strip BOM

      const idx = (name: string) => {
        const i = cols.indexOf(name);
        if (i === -1)
          throw new Error(`Column "${name}" not found in CSV. Found: ${cols.join(", ")}`);
        return i;
      };

      const iChaine  = idx("nom_chaine");
      const iHeure   = idx("heure");
      const iRamadan = idx("est_ramadan");
      const iAge     = idx("age_groupe_pred");
      const iSexe    = idx("sexe_pred");
      const iRevenu  = idx("revenu_pred");
      const iFoyers  = idx("nb_foyers");

      return dataLines
        .map((line) => line.split(",").map((c) => c.trim()))
        .filter((cells) => cells.length > 1 && cells[iChaine])
        .map((cells) => ({
          nom_chaine:      cells[iChaine]  ?? "",
          heure:           Number(cells[iHeure]),
          est_ramadan:     parseBool(cells[iRamadan] ?? "0"),
          age_groupe_pred: cells[iAge]    ?? "",
          sexe_pred:       cells[iSexe]   ?? "",
          revenu_pred:     cells[iRevenu] ?? "",
          nb_foyers:       Number(cells[iFoyers]),
        }));
    })
    .catch((err) => {
      csvCache = null; // allow retry on next call
      throw err;
    });

  return csvCache;
}

function aggregateRows(rows: CsvRow[], chaine: string, heure: number): AudienceData {
  const par_age: Record<string, number>    = {};
  const par_sexe: Record<string, number>   = {};
  const par_revenu: Record<string, number> = {};
  let total_foyers = 0;

  for (const r of rows) {
    const n = r.nb_foyers;
    total_foyers += n;
    par_age[r.age_groupe_pred] = (par_age[r.age_groupe_pred] ?? 0) + n;
    par_sexe[r.sexe_pred]      = (par_sexe[r.sexe_pred]      ?? 0) + n;
    par_revenu[r.revenu_pred]  = (par_revenu[r.revenu_pred]  ?? 0) + n;
  }

  return { chaine, heure, total_foyers, par_age, par_sexe, par_revenu };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getChaines(): Promise<string[]> {
  const rows = await loadCsv();
  const seen = new Set<string>();
  for (const r of rows) if (r.nom_chaine) seen.add(r.nom_chaine);
  return Array.from(seen).sort();
}

export async function getAudience(
  chaine: string,
  heure: number,
  _jour?: string,       // CSV has no jour column — parameter kept for API compatibility
  ramadan = false,
  _ferie?: boolean,     // CSV has no ferie column — parameter kept for API compatibility
): Promise<AudienceData> {
  const rows = await loadCsv();

  let filtered = rows.filter(
    (r) => r.nom_chaine === chaine && r.heure === heure && r.est_ramadan === ramadan,
  );

  // Fallback: ignore ramadan filter if no rows match
  if (filtered.length === 0) {
    filtered = rows.filter((r) => r.nom_chaine === chaine && r.heure === heure);
  }

  // Fallback: ignore hour filter if still no rows
  if (filtered.length === 0) {
    filtered = rows.filter((r) => r.nom_chaine === chaine);
  }

  if (filtered.length === 0) {
    throw new Error(`No data found for channel "${chaine}" in the CSV.`);
  }

  return aggregateRows(filtered, chaine, heure);
}

// These require an AI backend — they surface a clear error in the UI.
export async function getRecommendation(_params: RecommendationParams): Promise<string> {
  throw new Error("AI recommendation requires a backend server. No backend is configured.");
}

export async function sendChat(_message: string, _history: ChatHistoryItem[]): Promise<string> {
  throw new Error("AI chat requires a backend server. No backend is configured.");
}
