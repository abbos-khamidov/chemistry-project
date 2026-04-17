import logo from '../../assets/logo.png';

type Props = {
  className?: string;
};

/** Комбинированный логотип: знак + текст бренда. */
export function BrandLogo({ className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="AGRONOMIA">
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        className="h-full w-auto object-contain shrink-0"
        loading="eager"
        decoding="async"
      />
      <span className="font-extrabold tracking-[0.08em] text-slate-900 dark:text-slate-100 whitespace-nowrap">
        AGRONOMIA
      </span>
    </span>
  );
}
