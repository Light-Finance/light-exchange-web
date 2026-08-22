import { ReactNode } from 'react';
import './wallet.css';

// Web counterparts of the mobile WalletUI pieces. The four money screens
// (convert, transfer, withdraw, add funds) all ask the same three questions —
// from which wallet, how much, what actually arrives — so they share one set of
// blocks rather than four private layouts that drift apart.

export const WalletCard = ({
  children,
  className = '',
}: {
  children?: ReactNode;
  className?: string;
}) => <div className={`w-card ${className}`}>{children}</div>;

export const FieldLabel = ({ children }: { children?: ReactNode }) => (
  <span className="w-label">{children}</span>
);

/**
 * The amount field: oversized because it is the one number the user types on
 * these screens, with the unit pinned to the right so the figure can never read
 * as a different currency.
 */
export const AmountInput = ({
  value,
  onChange,
  unit,
  placeholder,
  readOnly = false,
  onMax,
}: {
  value?: string;
  onChange?: (v: string) => void;
  unit?: string;
  placeholder?: string;
  readOnly?: boolean;
  onMax?: () => void;
}) => (
  <div className={`w-amount ${readOnly ? 'w-amount--readonly' : ''}`}>
    <input
      className="w-amount__input"
      inputMode="decimal"
      value={value ?? ''}
      readOnly={readOnly}
      placeholder={placeholder ?? '0.00'}
      onChange={e => onChange?.(e.target.value)}
    />
    {onMax ? (
      <button type="button" className="w-amount__max" onClick={onMax}>
        MAX
      </button>
    ) : null}
    {unit ? <span className="w-amount__unit">{unit}</span> : null}
  </div>
);

/** One line of the "what this costs / what you get" breakdown. */
export const SummaryLine = ({
  label,
  value,
  tone = 'normal',
}: {
  label: string;
  value: string;
  tone?: 'normal' | 'fee' | 'strong';
}) => (
  <div className="w-sum__line">
    <span className="w-sum__label">{label}</span>
    <span className={`w-sum__value w-sum__value--${tone}`}>{value}</span>
  </div>
);

export const SummaryBox = ({ children }: { children?: ReactNode }) => (
  <div className="w-sum">{children}</div>
);

export const InfoBanner = ({
  children,
  tone = 'info',
}: {
  children?: ReactNode;
  tone?: 'info' | 'warn';
}) => <div className={`w-banner w-banner--${tone}`}>{children}</div>;

/** The numbered step header used by the add-funds screen. */
export const StepHeader = ({ n, children }: { n: number; children?: ReactNode }) => (
  <div className="w-step">
    <span className="w-step__badge">{n}</span>
    <span className="w-step__title">{children}</span>
  </div>
);
