type Props = {
  className?: string;
};

/** Логотип: положите файл в `public/images/logo.png` */
export function BrandLogo({ className = '' }: Props) {
  return (
    <img
      src="/images/logo.png"
      alt="Rosita"
      className={`object-contain object-left ${className}`}
      width={160}
      height={48}
    />
  );
}
