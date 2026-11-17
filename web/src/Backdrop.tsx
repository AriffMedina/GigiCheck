import { Lily } from "./Lily";

// Lily field shared by every screen: fixed to the app column, so it stays put while lists scroll.
// Sizes and angles are hand-tuned so the corners stay airy around the content.
const LILIES = [
  "-left-6 top-16 h-40 w-32 -rotate-12 opacity-20",
  "-right-4 top-[38%] h-28 w-24 rotate-[18deg] opacity-15",
  "left-4 bottom-28 h-24 w-20 rotate-6 opacity-15",
  "-right-8 bottom-16 h-44 w-36 -rotate-[8deg] opacity-25",
];

export const Backdrop = () => (
  <div aria-hidden="true" className="backdrop pointer-events-none fixed inset-y-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_42%,color-mix(in_oklab,var(--accent)_20%,transparent),transparent)]" />
    {LILIES.map((position) => <Lily key={position} className={`absolute text-accent ${position}`} />)}
  </div>
);
