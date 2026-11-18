import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { usePhoto } from './photos';
export function Icon({
  name,
  size = 24,
}: {
  name: 'camera' | 'home' | 'history' | 'back' | 'spark' | 'check' | 'close' | 'chevron' | 'share';
  size?: number;
}) {
  const paths = {
    camera: (
      <>
        <path d="M14 4h-4L8 7H4v13h16V7h-4z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7v11H3z" />
        <path d="M9 21v-8h6v8" />
      </>
    ),
    history: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6l4 2" />
      </>
    ),
    back: <path d="m14 5-7 7 7 7M7 12h14" />,
    check: <path d="m5 13 4 4 10-10" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    share: <path d="M12 16V4M7 9l5-5 5 5M5 14v6h14v-6" />,
    spark: <path d="M12 2c0 7-3 10-10 10 7 0 10 3 10 10 0-7 3-10 10-10-7 0-10-3-10-10Z" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function Button({
  children,
  secondary = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; secondary?: boolean }) {
  return (
    <button
      {...props}
      className={`button ${secondary ? 'secondary' : ''} ${props.className ?? ''}`}
    >
      {children}
    </button>
  );
}
export function Photo({ id, large = false }: { id: string | null; large?: boolean }) {
  const url = usePhoto(id);
  return (
    <div className={`photo ${large ? 'large' : ''}`}>
      {url ? (
        <img src={url} alt="Fotografía del producto" />
      ) : (
        <Icon name="spark" size={large ? 44 : 26} />
      )}
    </div>
  );
}
export const SearchField = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <input
    type="search"
    className="search"
    placeholder="Buscar producto"
    aria-label="Buscar producto por nombre"
    value={value}
    onChange={(event) => onChange(event.target.value)}
  />
);
export const ErrorNotice = ({ message }: { message: string }) =>
  message ? (
    <p className="error" role="alert">
      {message}
    </p>
  ) : null;
