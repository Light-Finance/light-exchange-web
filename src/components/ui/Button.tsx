import { ButtonHTMLAttributes } from 'react';
import './Button.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
  loading?: boolean;
}

/** Web equivalent of the mobile Button component (THEME.HEIGHT.button tall). */
export const Button = ({
  variant = 'primary',
  block,
  loading,
  disabled,
  children,
  className = '',
  ...rest
}: Props) => (
  <button
    type="button"
    className={`btn btn--${variant} ${block ? 'btn--block' : ''} ${className}`}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...rest}
  >
    {loading ? <span className="btn__spinner" aria-hidden="true" /> : null}
    {children}
  </button>
);
