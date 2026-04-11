import type { ReactNode } from 'react';
import { amountDigitsOnly, formatAmountWithSpaces } from '../lib/amountInput';

type Props = {
  id?: string;
  label: ReactNode;
  /** Только цифры, без пробелов (как в state). */
  value: string;
  onChange: (digitsOnly: string) => void;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Ввод сумм в UZS: отображение с пробелами (10 000), в state — строка цифр.
 */
export function AmountField({
  id,
  label,
  value,
  onChange,
  className = '',
  inputClassName = 'w-full border border-slate-300 rounded-lg px-3 py-2',
  required,
  disabled,
  placeholder = '0',
}: Props) {
  const display = formatAmountWithSpaces(value);

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm text-slate-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={display}
        onChange={(e) => onChange(amountDigitsOnly(e.target.value))}
        className={inputClassName}
      />
    </div>
  );
}
