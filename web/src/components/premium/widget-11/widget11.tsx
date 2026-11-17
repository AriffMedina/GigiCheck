// Adapted from Shadcn Space widget-11@18fe1e07c286: props-driven, no remote images (offline PWA).
import { useEffect, useState } from "react";
import { animate } from "motion/react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Lily } from "@/Lily";

function useCountUp(value: number) {
  const [current, setCurrent] = useState(0);
  useEffect(() => animate(current, value, { duration: 0.9, ease: "easeOut", onUpdate: setCurrent }).stop,
    // `current` is intentionally omitted: each new value animates from wherever the last one stopped.
    [value]);
  return current;
}

export default function Widget11({ percent, label }: { percent: number; label: string }) {
  const current = useCountUp(percent);
  return (
    <Card className="relative w-full gap-5 overflow-hidden rounded-xl border-none bg-primary/15 p-5 text-foreground">
      <Lily className="pointer-events-none absolute -top-1 right-1 h-24 w-20 text-accent opacity-50" />
      <div>
        <strong className="block text-5xl leading-none font-bold tracking-tight tabular-nums">{Math.round(current)}%</strong>
        <span className="mt-1.5 block text-sm text-accent">completado</span>
      </div>
      <div>
        <p className="mb-2 text-sm text-muted-foreground">{label}</p>
        <Progress value={current} aria-label={label} className="**:data-[slot=progress-track]:h-2 **:data-[slot=progress-indicator]:bg-accent" />
      </div>
    </Card>
  );
}
