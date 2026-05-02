import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un expert en planification publicitaire TV pour le marché tunisien.
Tu as accès à des données d'audience réelles de chaînes TV tunisiennes.

Heures disponibles : 0h–23h.
Tranches d'âge : 18-24, 25-34, 35-44, 45+.
Sexe : H (Homme), F (Femme).
Revenu : faible, moyen, eleve.
Jours : Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche.

FORMULE DE SCORING :
1. SPA = 0.4×age_pct + 0.3×sex_pct + 0.3×rev_pct
2. SVP = audience_totale × SPA
3. Bonus jour : Lundi–Jeudi ×1.00–1.05, Vendredi ×1.20, Samedi ×1.30, Dimanche ×1.25, Férié +10%
4. Score final = SVP × bonus_jour → normalisé 0–100

RÈGLES : Demande âge/sexe/revenu si vague. Affiche TOP 5 avec jour. Verdict ✅/❌ pour les évaluations. Réponds TOUJOURS en français.

IMPORTANT: Keep all responses concise and short. Maximum 5 lines. No long tables. No detailed calculations. Just give the key recommendation directly.`;

// ─── OpenRouter Call ──────────────────────────────────────────────────────────

async function callOpenRouter(
  message: string,
  history: { role: string; text: string }[],
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log("[chat] OPENROUTER_API_KEY exists:", !!apiKey);
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set in .env.local");

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((h) => ({
      role: h.role === "bot" ? "assistant" : "user",
      content: h.text,
    })),
    { role: "user", content: message },
  ];

  console.log("[chat] message:", message);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tencent/hy3-preview:free",
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned no content");
  return content;
}

// ─── Body Parsing ─────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

// ─── Vite Plugin ──────────────────────────────────────────────────────────────

export function chatApiPlugin(): Plugin {
  return {
    name: "chat-api",
    configureServer(server) {
      server.middlewares.use("/api/chat", (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== "POST") { next(); return; }

        console.log("[chat] POST /api/chat hit");
        res.setHeader("Content-Type", "application/json");

        readBody(req)
          .then(async (body) => {
            const response = await callOpenRouter(body.message, body.history ?? []);
            res.end(JSON.stringify({ response }));
          })
          .catch((err: any) => {
            console.error("[chat] error:", err?.message ?? err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message ?? "Internal server error" }));
            }
          });
      });
    },
  };
}
