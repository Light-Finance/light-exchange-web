import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/auth.store';

export const SignUp = observer(() => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referer, setReferer] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await authStore.signUp(email.trim(), password, referer.trim());
    if (ok) navigate('/wallet');
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">💚 Light Exchange</div>
        <h1 className="auth-title">Créer un compte</h1>
        <div className="terms-note">
          En vous inscrivant, vous acceptez les conditions d'utilisation.
        </div>
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
        <label className="label">Code de parrainage (facultatif)</label>
        <input
          className="input"
          value={referer}
          onChange={e => setReferer(e.target.value)}
          placeholder="Code ami"
        />
        {authStore.error && <div className="error">{authStore.error}</div>}
        <button className="btn-primary" type="submit" disabled={authStore.loading}>
          {authStore.loading ? 'Création…' : "S'inscrire"}
        </button>
        <div className="auth-alt">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </div>
      </form>
    </div>
  );
});
