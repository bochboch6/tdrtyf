import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { spawn } from "node:child_process";
import path from "node:path";

// ─── Run Python script ────────────────────────────────────────────────────────

function runPython(keyword: string, eventTime: string, geo: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const projectRoot = process.cwd();
    const scriptPath  = path.join(projectRoot, "scripts", "SearchedArtical.py");

    const cmd  = "python";
    const args = [scriptPath, "--keyword", keyword, "--event-time", eventTime, "--geo", geo];

    console.log("[campaign] running:", cmd, args.join(" "));
    console.log("[campaign] cwd:", projectRoot);

    const proc = spawn(cmd, args, { cwd: projectRoot });

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      console.log("[campaign] python exit code:", code);
      if (stderr) console.log("[campaign] stderr:", stderr.slice(0, 500));
      if (code !== 0) {
        reject(new Error(`Python script failed (exit ${code}): ${stderr.slice(0, 300)}`));
        return;
      }
      const raw = stdout.trim();
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error(`Invalid JSON from script: ${raw.slice(0, 300)}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start Python: ${err.message}. Make sure python is in PATH.`));
    });
  });
}

// ─── Body Parser ──────────────────────────────────────────────────────────────

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

export function campaignApiPlugin(): Plugin {
  return {
    name: "campaign-api",
    configureServer(server) {
      server.middlewares.use(
        "/api/campaign-hit",
        (req: IncomingMessage, res: ServerResponse, next) => {
          if (req.method !== "POST") { next(); return; }

          console.log("[campaign] POST /api/campaign-hit");
          res.setHeader("Content-Type", "application/json");

          readBody(req)
            .then(async (body: { keyword: string; date: string; airTime: string }) => {
              const { keyword, date, airTime } = body;
              if (!keyword || !date) throw new Error("Missing keyword or date");

              // Normalise airTime to exactly "HH:MM" regardless of input format
              const rawTime = (airTime ?? "").trim();
              const hhmm    = rawTime.length >= 5 ? rawTime.slice(0, 5) : "00:00";

              // Final format expected by the Python script: "YYYY-MM-DD HH:MM"
              const eventTime = `${date} ${hhmm}`;

              console.log("[campaign] keyword:", keyword, "| eventTime:", eventTime);

              const result = await runPython(keyword, eventTime, "TN");
              res.end(JSON.stringify(result));
            })
            .catch((err: any) => {
              console.error("[campaign] error:", err?.message ?? err);
              if (!res.headersSent) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err?.message ?? "Internal server error" }));
              }
            });
        },
      );
    },
  };
}
