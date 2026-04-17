import logo from '../../assets/logo.png';

type Props = {
  className?: string;
};

/** Брендовый логотип из статического ассета. */
export function BrandLogo({ className = '' }: Props) {
  return (
    <img
      src={logo}
      alt="AGRONOMIA"
      className={`inline-block object-contain ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}
