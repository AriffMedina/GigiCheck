export function Snoopy({ className = "" }: { className?: string }) {
  return (
    <svg className={`snoopy ${className}`} viewBox="0 0 140 160" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="m13 37 2-6 2 6 6 2-6 2-2 6-2-6-6-2 6-2ZM115 18l2-5 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="currentColor" stroke="none" />
        <path d="M74 89c-10 8-15 20-12 34l-12 12c-4 5 1 9 10 9h27c10 1 16-4 13-9l-12-10c5-13 1-27-4-35" fill="var(--mascot-paper, #21182e)" />
        <path d="M68 109c10-4 18 0 21 6M86 144c9-6 20-6 22-1 3 7-14 9-26 7M64 144c-12-3-21 1-21 5s17 5 29 1M90 116c9 0 15-5 17-10" />
        <path d="M89 37c-4-12-18-17-31-11-8 4-11 12-17 15-4 1-11-1-16 1-8 3-8 13-4 21 7 12 20 19 34 18l6 13 25-1 3-14c14-7 18-28 8-39Z" fill="var(--mascot-paper, #21182e)" />
        <path d="M89 37c-9 1-13 13-12 27 1 15 7 23 14 20 8-4 13-20 12-32-1-9-7-15-14-15Z" fill="currentColor" fillOpacity=".15" />
        <path d="M89 45c-5 9-6 20-3 28M95 47c-3 9-4 16-2 23" strokeWidth="2" />
        <ellipse cx="23" cy="48" rx="7" ry="5" fill="currentColor" stroke="none" />
        <ellipse cx="53" cy="43" rx="2.3" ry="3" fill="currentColor" stroke="none" />
        <path d="M30 64c8 7 16 8 22 4M60 92l28-1M60 96l27-1" />
        <path d="m29 100 29-5 8 40-29 5Z" fill="var(--mascot-paper, #21182e)" />
        <path d="m36 97 14-2 1 7-14 2ZM42 112l3 2 5-6M44 123l3 2 5-6M61 112c-8-5-13-3-12 2 1 4 8 4 13 3" />
      </g>
    </svg>
  );
}
