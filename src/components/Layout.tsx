import { NavLink, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/auth.store';

export const Layout = observer(({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">💚 Light Exchange</div>
        <nav className="nav">
          <NavLink to="/wallet" className="navlink">
            Portefeuille
          </NavLink>
          <NavLink to="/bot" className="navlink">
            AI Bot
          </NavLink>
        </nav>
        <div className="topbar-right">
          <span className="user-email">{authStore.user?.email}</span>
          <button
            className="btn-ghost"
            onClick={() => {
              authStore.signOut();
              navigate('/login');
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
});
