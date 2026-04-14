type Props = {
  className?: string;
};

/** Текстовый логотип бренда. */
export function BrandLogo({ className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center font-extrabold tracking-[0.08em] text-slate-900 dark:text-slate-100 ${className}`}
      aria-label="AGRONOMIA"
    >
      AGRONOMIA
    </span>
  );
}
