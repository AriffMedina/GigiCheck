import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Icon } from "./ui";

// Button text uses `!` because the unlayered global `button{font:inherit}` rule outranks Tailwind layers.
export const Home = ({ onStart }: { onStart: () => void }) => (
  <section className="grid min-h-[68dvh] place-items-center">
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
