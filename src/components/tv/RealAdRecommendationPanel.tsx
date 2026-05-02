import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { getChaines, getAudience } from "@/lib/api";

const SEX    = ["All", "Male", "Female"] as const;
const AGE    = ["All", "18-24", "25-34", "35-44", "45+"] as const;
const INCOME = ["All", "Low", "Middle", "High"] as const;

const SEX_MAP:    Record<string, string | null> = { All: null, Male: "H", Female: "F" };
const INCOME_MAP: Record<string, string | null> = { All: null, Low: "faible", Middle: "moyen", High: "eleve" };

function fieldClass() {
  return "w-full rounded-md border border-[#1f2a3a] bg-[#0d1117] px-3 py-2 text-sm text-white focus:border-[oklch(0.7_0.15_200)] focus:outline-none";
}
function labelClass() {
  return "mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[oklch(0.7_0.15_200)]";
}

export function RealAdRecommendationPanel() {
  const [channels, setChannels] = useState<string[]>([]);
  const [channel, setChannel]   = useState("All");
  const [sex, setSex]           = useState<(typeof SEX)[number]>("All");
  const [age, setAge]           = useState<(typeof AGE)[number]>("All");
  const [income, setIncome]     = useState<(typeof INCOME)[number]>("All");
  const [goal, setGoal]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [output, setOutput]     = useState<string>("Awaiting your request...");
  const [displayed, setDisplayed] = useState<string>("Awaiting your request...");

  useEffect(() => {
    getChaines()
      .then((chaines) => setChannels(chaines))
      .catch(() => {});
  }, []);

  // Typewriter animation
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

  const run = async () => {
    setLoading(true);
    try {
      const selectedChannel = channel === "All" ? (channels[0] ?? "") : channel;
      if (!selectedChannel) throw new Error("No channel available");

      const sexKey    = SEX_MAP[sex];
      const incomeKey = INCOME_MAP[income];

      // Scan all 24 hours and score each slot from the CSV
      const hourResults = await Promise.all(
        Array.from({ length: 24 }, (_, h) =>
          getAudience(selectedChannel, h).then((data) => {
            const total = data.total_foyers || 1;

            // Fraction of audience matching each selected filter
            const sexPct    = sexKey    ? (data.par_sexe[sexKey]    ?? 0) / total : 1;
            const agePct    = age !== "All" ? (data.par_age[age]      ?? 0) / total : 1;
            const revPct    = incomeKey ? (data.par_revenu[incomeKey] ?? 0) / total : 1;

            // Average match across applied filters
            const filtersApplied = [
              sexKey    ? sexPct    : null,
              age !== "All" ? agePct    : null,
              incomeKey ? revPct    : null,
            ].filter((v) => v !== null) as number[];

            const matchFraction = filtersApplied.length > 0
              ? filtersApplied.reduce((a, b) => a + b, 0) / filtersApplied.length
              : 1;

            return { heure: h, total, matchedFoyers: Math.round(total * matchFraction), matchFraction };
          }).catch(() => ({ heure: h, total: 0, matchedFoyers: 0, matchFraction: 0 }))
        ),
      );

      // Best slot = highest matched foyers
      const best = hourResults.reduce((a, b) => (b.matchedFoyers > a.matchedFoyers ? b : a));
      const matchPct = Math.round(best.matchFraction * 100);

      const targetDesc = [
        sex !== "All" ? sex : null,
        age !== "All" ? age : null,
        income !== "All" ? `${income} income` : null,
      ].filter(Boolean).join(", ") || "general audience";

      const text =
        `▸ OPTIMAL TIME SLOT   : ${best.heure}h00\n` +
        `▸ RECOMMENDED CHANNEL : ${selectedChannel}\n` +
        `▸ AUDIENCE MATCH      : ${matchPct}%\n` +
        `▸ ESTIMATED REACH     : ${best.matchedFoyers.toLocaleString("fr-TN")} foyers\n\n` +
        `REASONING:\n` +
        `Best slot for ${targetDesc} on ${selectedChannel} based on real RPD audience data.` +
        (goal ? `\nCampaign goal: "${goal.slice(0, 80)}"` : "");

      setOutput(text);
    } catch (err: any) {
      setOutput(`⚠ ${err?.message ?? "Failed to compute recommendation from CSV."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[oklch(0.7_0.18_145)]" />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          AI Recommendation — Best Ad Time Slot
        </h3>
      </div>

      <div className="rounded-xl bg-[#0d1117] p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass()}>Channel</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className={fieldClass()}>
              <option value="All">All</option>
              {channels.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass()}>Target gender</label>
            <select value={sex} onChange={(e) => setSex(e.target.value as any)} className={fieldClass()}>
              {SEX.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass()}>Target age</label>
            <select value={age} onChange={(e) => setAge(e.target.value as any)} className={fieldClass()}>
              {AGE.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass()}>Target income</label>
            <select value={income} onChange={(e) => setIncome(e.target.value as any)} className={fieldClass()}>
              {INCOME.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass()}>Advertising goal</label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Promote a laundry detergent brand for stay-at-home women in Tunisia"
            className={fieldClass()}
          />
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-700 to-red-500 px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-red-700/30 transition-all hover:shadow-red-500/50 disabled:opacity-60"
        >
          <Target className="h-4 w-4" />
          {loading ? "Analyzing…" : "🎯 Get Recommendation"}
        </button>

        <div className="mt-5 rounded-lg border border-[#1f2a3a] bg-[#06090f] p-5 font-mono text-[12.5px] leading-relaxed text-[oklch(0.85_0_0)]">
          <pre className="whitespace-pre-wrap break-words">{displayed}</pre>
          {loading && <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-primary" />}
        </div>
      </div>
    </div>
  );
}
