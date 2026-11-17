export function Lily({ className = "" }: { className?: string }) {
  return (
    <svg className={`lily ${className}`} viewBox="0 0 72 88" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M33 77c9-14 12-28 10-42M37 69c-2-12-12-17-21-16 1 10 10 16 21 16ZM40 59c10-1 19-7 20-17-11 0-17 6-20 17Z" />
        <path d="M42 36C29 35 17 29 13 18c13-2 23 3 29 18ZM42 36C32 22 33 10 43 4c7 9 8 20-1 32ZM42 36c1-15 10-23 22-21-1 13-9 20-22 21Z" />
        <path d="M42 36c-15 4-25 1-31-6 11-5 22-4 31 6ZM42 36c5-5 15-6 23-2-6 8-14 10-23 2ZM42 36c-1 10-9 17-19 18-1-10 5-15 19-18Z" />
        <path d="m42 36-8-15m8 15 6-17m-6 17 13-10" />
        <circle cx="34" cy="21" r="1.1" fill="currentColor" /><circle cx="48" cy="19" r="1.1" fill="currentColor" /><circle cx="55" cy="26" r="1.1" fill="currentColor" />
      </g>
    </svg>
  );
}
