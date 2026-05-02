import type { RadioStation } from "@/lib/mockData";

export function AudiencePills({ audience }: { audience: RadioStation["audience"] }) {
  const pills = [
    { icon: "👩", label: `${audience.womenPct}% Women` },
    { icon: "👴", label: `${audience.age45Plus}% 45+` },
    { icon: "📍", label: audience.region },
    { icon: "💰", label: `${audience.income} income` },
  ];
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {pills.map((p, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground"
        >
          <span>{p.icon}</span>
          <span className="text-foreground/90">{p.label}</span>
        </span>
      ))}
    </div>
  );
}
