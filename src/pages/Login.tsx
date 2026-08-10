import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/auth.store';

export const Login = observer(() => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await authStore.signIn(email.trim(), password);
    if (ok) navigate('/wallet');
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">💚 Light Exchange</div>
        <h1 className="auth-title">Connexion</h1>
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="votre@email.com"
          autoFocus
        />
        <label className="label">Mot de passe</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {authStore.error && <div className="error">{authStore.error}</div>}
        <button className="btn-primary" type="submit" disabled={authStore.loading}>
          {authStore.loading ? 'Connexion…' : 'Se connecter'}
        </button>
        <div className="auth-alt">
          Pas encore de compte ? <Link to="/signup">Créer un compte</Link>
        </div>
      </form>
    </div>
  );
});
