import { ReactNode } from 'react';
import lightexchange from 'light-exchange';
import illustration from '../../assets/imgs/signInIllustration.png';
import './auth.css';

/**
 * Purple full-bleed auth frame, matching mobile's AuthLayout. The mobile
 * version hides the illustration when the soft keyboard opens; on the web the
 * layout just scrolls, so it stays put.
 */
export const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="auth">
    <div className="auth__panel">
      <img className="auth__illustration" src={illustration} alt="" />
      <h1 className="auth__app-name">{lightexchange.app.INFO.APP_NAME}</h1>
      <div className="auth__form">{children}</div>
    </div>
  </div>
);
