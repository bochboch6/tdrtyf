import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X, Target, Clock, TrendingUp } from "lucide-react";

type Recommendation = {
  channel: string;
  timeslot: string;
  match: number;
  reason: string;
};

type Message = {
  id: string;
  role: "user" | "ai";
  text?: string;
  recommendations?: Recommendation[];
};

const ALL_CHANNELS = ["Nessma TV", "El Hiwar Ettounsi", "Watania 1", "Hannibal TV", "TFM", "Attessia"];

function craftRecommendations(prompt: string): Recommendation[] {
  const p = prompt.toLowerCase();
  const young = /jeune|youth|18|25|étudiant|student/.test(p);
  const family = /famille|family|enfant|parent/.test(p);
  const luxury = /luxe|premium|haut de gamme|luxury/.test(p);
  const food = /food|aliment|restaurant|boisson|drink/.test(p);

  const slots = young
    ? ["22h00 - 23h30", "19h30 - 20h30"]
    : family
      ? ["20h00 - 21h00", "18h30 - 19h30"]
      : luxury
        ? ["21h00 - 22h00", "20h30 - 21h30"]
        : ["20h00 - 21h00", "21h30 - 22h30"];

  const channels = young
    ? ["Nessma TV", "TFM", "Hannibal TV"]
    : family
      ? ["Watania 1", "Nessma TV", "Attessia"]
      : ["El Hiwar Ettounsi", "Nessma TV", "Watania 1"];

  return channels.map((c, i) => ({
    channel: c,
    timeslot: slots[i % slots.length],
    match: Math.floor(72 + Math.random() * 23),
    reason: food
      ? "Strong overlap with food & lifestyle viewers"
      : luxury
        ? "Premium audience peak engagement"
        : young
          ? "Highest reach for 18-34 segment"
          : "Optimal cost-per-impression vs target",
  })).sort((a, b) => b.match - a.match);
}

export function AIAdvisorChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "ai",
      text: "Hello! I'm your AI advertising advisor. Describe your product, target audience, and desired period — I'll recommend the best channels and timeslots to maximize impact.",
    },
  ]);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    const prompt = input;
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: "Based on your campaign brief, here are my top recommendations:",
          recommendations: craftRecommendations(prompt),
        },
      ]);
      setThinking(false);
    }, 1100);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-2xl shadow-primary/40 transition-all hover:scale-105 pulse-red ${
          open ? "pointer-events-none opacity-0" : ""
        }`}
      >
        <Sparkles className="h-4 w-4" />
        Conseiller Pub IA
      </button>

      {/* Drawer */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[calc(100vh-3rem)] w-[420px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/15 to-transparent px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Conseiller Pub IA</div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.18_145)]" />
                Online · Powered by AI
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] space-y-2 rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-secondary text-foreground"
                }`}
              >
                {m.text && <div>{m.text}</div>}
                {m.recommendations && (
                  <div className="space-y-2 pt-1">
                    {m.recommendations.map((r, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-background/60 p-3 text-xs"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="font-semibold text-foreground">{r.channel}</div>
                          <div className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                            <Target className="h-3 w-3" />
                            {r.match}%
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {r.timeslot}
                        </div>
                        <div className="mt-1.5 flex items-start gap-1.5 text-muted-foreground">
                          <TrendingUp className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          <span>{r.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border bg-background/40 p-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:border-primary">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Décrivez votre publicité, cible et période..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// suggestions for users
void ALL_CHANNELS;
