import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Lily } from "./Lily";
import { Icon } from "./ui";

// Decorative lily field: sizes and angles are hand-tuned so the corners stay airy around the button.
// Button text uses `!` because the unlayered global `button{font:inherit}` rule outranks Tailwind layers.
const LILIES = [
  "-left-6 top-2 h-40 w-32 -rotate-12 opacity-25",
  "-right-4 top-24 h-28 w-24 rotate-[18deg] opacity-20",
  "left-6 bottom-6 h-24 w-20 rotate-6 opacity-15",
  "-right-8 -bottom-4 h-44 w-36 -rotate-[8deg] opacity-30",
];

export const Home = ({ onStart }: { onStart: () => void }) => (
  <section className="relative -mx-6 grid min-h-[68dvh] place-items-center overflow-hidden px-6">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_45%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent)]" />
    {LILIES.map((position) => <Lily key={position} className={`pointer-events-none absolute text-accent ${position}`} />)}
    <Empty className="relative gap-8 border-0">
      <EmptyHeader className="gap-3">
        <EmptyTitle className="font-serif text-5xl font-bold tracking-tight">Buenos días cielo,</EmptyTitle>
        <EmptyDescription className="text-base">¿Iniciamos el conteo? {"<3"}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onStart} className="h-14 w-full max-w-xs rounded-full text-lg! font-bold! shadow-[0_8px_32px_color-mix(in_oklab,var(--accent)_35%,transparent)]">
          <Icon name="spark" size={22} />
          Iniciar conteo
        </Button>
      </EmptyContent>
    </Empty>
  </section>
);
