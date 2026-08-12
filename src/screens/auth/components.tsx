import { ReactNode, useState } from 'react';
import { Input } from '../../components/ui/Field';
import { translate } from '../../helpers/localization';
import { appRootStore } from '../../stores/root.store';
import logoGoogle from '../../assets/imgs/logoGoogle.png';

/** Password input with a reveal toggle (mobile's Password.component). */
export const Password = ({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth__password">
      <Input
        type={visible ? 'text' : 'password'}
        autoComplete="current-password"
        placeholder={placeholder ?? translate('password.passwordPhTxt')}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
      />
      <button
        type="button"
        className="auth__password-toggle"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? '🙈' : '👁'}
      </button>
    </div>
  );
};

/** Underlined text button (mobile's TextLink.component). */
export const TextLink = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button type="button" className="auth__link" onClick={onClick}>
    {children}
  </button>
);

/** Google sign-in button (mobile's GoogleButton.component). */
export const GoogleButton = ({ children }: { children: ReactNode }) => (
  <button
    type="button"
    className="auth__google"
    onClick={() => appRootStore.authStore.signInGoogle()}
  >
    <img src={logoGoogle} alt="" />
    {children}
  </button>
);
