import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import { APP } from '../../consts/app';
import logo from '../../assets/imgs/logo.png';
import splashBackground from '../../assets/imgs/splashBackground.jpg';
import './auth.css';

/**
 * Entry route. Waits for the persisted auth store to rehydrate from
 * localStorage before deciding where to send the user — without this, a
 * signed-in user would be bounced to /welcome on every page load.
 */
export const Splash = observer(() => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { authStore } = appRootStore;
      if (!authStore.isHydrated) await authStore.rehydrateStore();
      if (cancelled) return;
      navigate(authStore.user?.connected ? '/wallet' : '/welcome', { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="splash" style={{ backgroundImage: `url(${splashBackground})` }}>
      <img className="splash__logo" src={logo} alt="" />
      <p className="splash__site">{APP.INFO.WEB_SITE}</p>
    </div>
  );
});
