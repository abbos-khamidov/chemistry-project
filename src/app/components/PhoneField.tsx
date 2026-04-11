import type { ReactNode } from 'react';
import {
  countryLabelRu,
  formatInternationalPhoneDisplay,
  getDetectedCountry,
  normalizePhoneForStore,
  sanitizeInternationalPhoneInput,
} from '../lib/phone';

type Props = {
  id?: string;
  label: ReactNode;
  value: string;
  onChange: (compact: string) => void;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  placeholder?: string;
  /** Показать определённую по номеру страну (libphonenumber). */
  showCountryHint?: boolean;
};

export function PhoneField({
  id,
  label,
  value,
  onChange,
  className = '',
  inputClassName = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800',
  required,
  placeholder = '+998901234567',
  showCountryHint = true,
}: Props) {
  const compact = normalizePhoneForStore(value);
  const display = compact === '' ? '+' : formatInternationalPhoneDisplay(compact);
  const country = showCountryHint ? getDetectedCountry(compact) : undefined;
  const region = countryLabelRu(country);

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required={required}
        value={display}
        onChange={(e) => onChange(sanitizeInternationalPhoneInput(e.target.value))}
        placeholder={placeholder}
        className={inputClassName}
      />
      {showCountryHint && region && compact.replace(/\D/g, '').length >= 3 ? (
        <p className="text-xs text-slate-500 mt-1">{region}</p>
      ) : null}
    </div>
  );
}
