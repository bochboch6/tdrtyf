import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { TV_CHANNELS } from "@/lib/mockData";

const SEX = ["Tous", "Homme", "Femme"] as const;
const AGE = ["Tous", "18-24", "25-34", "35-44", "45+"] as const;
const INCOME = ["Tous", "Faible", "Moyen", "Élevé"] as const;

function fieldClass() {
  return "w-full rounded-md border border-[#1f2a3a] bg-[#0d1117] px-3 py-2 text-sm text-white focus:border-[oklch(0.7_0.15_200)] focus:outline-none";
}
function labelClass() {
  return "mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.7_0.15_200)]";
}

export function AdRecommendationPanel() {
  const [channel, setChannel] = useState("Toutes");
  const [sex, setSex] = useState<(typeof SEX)[number]>("Tous");
  const [age, setAge] = useState<(typeof AGE)[number]>("Tous");
  const [income, setIncome] = useState<(typeof INCOME)[number]>("Tous");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>("En attente de votre requête...");
  const [displayed, setDisplayed] = useState<string>("En attente de votre requête...");

  useEffect(() => {
    if (output === displayed) return;
    setDisplayed("");
    const words = output.split(/(\s+)/);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplayed(words.slice(0, i).join(""));
      if (i >= words.length) clearInterval(id);
    }, 35);
    return () => clearInterval(id);
  }, [output]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = () => {
    setLoading(true);
    setTimeout(() => {
      const bestChannel = channel === "Toutes" ? "Nessma TV" : channel;
      const slot =
        age === "18-24" ? "22h00 - 23h30"
          : age === "45+" ? "20h00 - 21h00"
          : sex === "Femme" ? "19h30 - 20h30"
          : "21h00 - 22h00";
      const match = 78 + Math.floor(Math.random() * 18);
      const reason = goal
        ? `Audience ${sex.toLowerCase()} ${age !== "Tous" ? age : ""} avec revenu ${income.toLowerCase()} fortement représentée sur ${bestChannel} en prime time. Le créneau optimal maximise l'overlap avec votre cible "${goal.slice(0, 60)}".`
        : `Audience ciblée majoritairement présente sur ${bestChannel} dans ce créneau. Coût-par-impression optimal et fort taux de mémorisation.`;
      const text =
        `▸ HORAIRE OPTIMAL  : ${slot}\n` +
        `▸ CHAÎNE RECOMMANDÉE : ${bestChannel}\n` +
        `▸ MATCH AUDIENCE     : ${match}%\n` +
        `▸ REACH ESTIMÉ       : ${(match * 12000).toLocaleString("fr-FR")} téléspectateurs\n\n` +
        `RAISONNEMENT :\n${reason}`;
      setOutput(text);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[oklch(0.7_0.18_145)]" />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Recommandation IA — Meilleur Horaire Pub
        </h3>
      </div>

      <div className="rounded-xl bg-[#0d1117] p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass()}>Chaîne</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className={fieldClass()}>
              <option>Toutes</option>
              {TV_CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass()}>Sexe cible</label>
            <select value={sex} onChange={(e) => setSex(e.target.value as any)} className={fieldClass()}>
              {SEX.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass()}>Âge cible</label>
            <select value={age} onChange={(e) => setAge(e.target.value as any)} className={fieldClass()}>
              {AGE.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass()}>Revenu cible</label>
            <select value={income} onChange={(e) => setIncome(e.target.value as any)} className={fieldClass()}>
              {INCOME.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass()}>Objectif publicitaire</label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Ex: Promouvoir une marque de lessive pour femmes au foyer en Tunisie"
            className={fieldClass()}
          />
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[oklch(0.62_0.22_25)] to-[oklch(0.7_0.2_50)] px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50 disabled:opacity-60"
        >
          <Target className="h-4 w-4" />
          {loading ? "Analyse en cours…" : "🎯 Obtenir la recommandation"}
        </button>

        <div className="mt-5 rounded-lg border border-[#1f2a3a] bg-[#06090f] p-5 font-mono text-[12.5px] leading-relaxed text-[oklch(0.85_0_0)]">
          <pre className="whitespace-pre-wrap break-words">{displayed}</pre>
          {loading && <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-primary" />}
        </div>
      </div>
    </div>
  );
}
