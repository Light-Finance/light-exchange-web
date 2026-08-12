import { InputHTMLAttributes, SelectHTMLAttributes, ReactNode, useId } from 'react';
import './Field.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
}

/** Labelled text input matching THEME.INPUT / THEME.HEIGHT.input. */
export const Input = ({ label, error, hint, id, className = '', ...rest }: InputProps) => {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className={`field ${className}`}>
      {label ? (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`field__control ${error ? 'field__control--error' : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error ? (
        <span className="field__error" id={`${inputId}-error`} role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </div>
  );
};

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

/** Replaces the native picker / react-native-element-dropdown on mobile. */
export const Select = ({ label, id, className = '', children, ...rest }: SelectProps) => {
  const autoId = useId();
  const selectId = id || autoId;
  return (
    <div className={`field ${className}`}>
      {label ? (
        <label className="field__label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <select id={selectId} className="field__control" {...rest}>
        {children}
      </select>
    </div>
  );
};
