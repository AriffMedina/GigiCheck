export function Snoopy({ className = "" }: { className?: string }) {
  return <img className={`snoopy ${className}`} src="/snoopy-lilies.png" alt="" aria-hidden="true" width={420} height={448} />;
}
