import { useEffect, useRef, useState } from "react";
import { Play, Square, Radio as RadioIcon, Volume2 } from "lucide-react";

type Props = {
  stationName: string | null;
  streamUrl: string | null;
  onClose: () => void;
};

export function RadioPlayer({ stationName, streamUrl, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [bars, setBars] = useState<number[]>(Array(28).fill(20));

  useEffect(() => {
    if (!stationName) return;
    setPlaying(true);
    const a = audioRef.current;
    if (a && streamUrl) {
      a.src = streamUrl;
      a.play().catch(() => {
        // Autoplay or CORS may block — silent fallback, animation still runs
      });
    }
    return () => {
      a?.pause();
    };
  }, [stationName, streamUrl]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setBars((b) => b.map(() => 8 + Math.random() * 38));
    }, 110);
    return () => clearInterval(id);
  }, [playing]);

  if (!stationName) return null;

  const stop = () => {
    audioRef.current?.pause();
    setPlaying(false);
    onClose();
  };

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl shadow-2xl animate-fade-in">
      <audio ref={audioRef} crossOrigin="anonymous" />
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-6 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
          <RadioIcon className="h-5 w-5" />
        </div>
        <div className="min-w-[160px]">
          <div className="text-sm font-semibold">{stationName}</div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${playing ? "bg-[oklch(0.7_0.18_145)] animate-pulse" : "bg-muted-foreground"}`} />
            {playing ? "Live" : "Paused"}
          </div>
        </div>
        <div className="flex flex-1 items-end justify-center gap-[3px]">
          {bars.map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-primary/80 transition-all duration-100"
              style={{ height: `${playing ? h : 4}px` }}
            />
          ))}
        </div>
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Play className={`h-4 w-4 ${playing ? "hidden" : "block"}`} />
          <span className={`${playing ? "block" : "hidden"} h-3 w-3 rounded-sm bg-primary`} />
        </button>
        <button
          onClick={stop}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Square className="h-3 w-3" /> Stop
        </button>
      </div>
    </div>
  );
}
