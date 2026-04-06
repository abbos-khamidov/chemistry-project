import logoUrl from '../../assets/logo.png?url';

type Props = {
  className?: string;
};

/** Логотип: файл `src/assets/logo.png` (Vite кладёт в `dist/assets/`). */
export function BrandLogo({ className = '' }: Props) {
  return (
    <img
      src={logoUrl}
      alt="Rosita"
      className={`object-contain object-left ${className}`}
      width={160}
      height={48}
    />
  );
}
