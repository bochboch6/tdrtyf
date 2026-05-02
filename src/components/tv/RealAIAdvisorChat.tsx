import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";

type Msg = { role: "user" | "bot"; text: string };

export function RealAIAdvisorChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "Hi! I'm your media strategy assistant. Ask me anything about TV audiences, channels or ad timing.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMessages((m) => [...m, { role: "bot", text: data.response }]);
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: "bot", text: `⚠ ${err?.message ?? "Could not reach the server."}` },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[400] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 transition-transform hover:scale-110"
        aria-label="Open AI assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-[450] flex h-[520px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">AI Assistant</div>
                <div className="text-[10px] text-muted-foreground">Media strategy advisor</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background/60 text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-border bg-background/40 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about audience, channels…"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={typing}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
