import { Link, useLocation } from "@tanstack/react-router";
import { Tv, Radio, Megaphone, Activity } from "lucide-react";
import { useEffect, useState } from "react";

const NAV = [
  { to: "/", label: "TV", icon: Tv },
  { to: "/radio", label: "Radio", icon: Radio },
  { to: "/billboards", label: "Billboards", icon: Megaphone },
] as const;

export function AppHeader() {
  const { pathname } = useLocation();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">MediaPulse</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Tunisia</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 text-right">
          <div className="flex h-2 w-2 items-center justify-center">
            <span className="absolute h-2 w-2 animate-ping rounded-full bg-primary opacity-60" />
            <span className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <div className="font-mono text-sm" suppressHydrationWarning>
            <div className="font-semibold">{now ? now.toLocaleTimeString("en-GB") : "--:--:--"}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {now ? now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }) : "—"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
