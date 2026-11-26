import { useEffect, useRef, useState } from 'react';
import gql from 'graphql-tag';
import { Service } from '../../services/service.service';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { AuthLayout } from './AuthLayout';
import { Password } from './components';

// Support d'un compte bloque : il ne peut plus se connecter, mais doit pouvoir
// ecrire au support. Il s'identifie avec son email et son mot de passe, et
// n'a acces qu'a sa conversation.

const BLOCKED_SUPPORT = gql`
  mutation blockedSupport($email: String!, $password: String!, $text: String) {
    blockedSupport(email: $email, password: $password, text: $text) {
      id
      fromAdmin
      fromBot
      text
      imageUrl
      at
    }
  }
`;

interface IMsg { id: string; fromAdmin: boolean; fromBot?: boolean; text: string; imageUrl?: string; at: string }

export const BlockedSupport = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<IMsg[]>([]);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const call = async (msg?: string, loader = true) => {
    const r: any = await Service.mutation({ email: email.trim(), password, text: msg || null }, BLOCKED_SUPPORT, loader);
    const list = r?.data?.blockedSupport;
    if (Array.isArray(list)) {
      setMessages(list);
      setReady(true);
      return true;
    }
    return false;
  };

  // La conversation se rafraichit toute seule : la reponse arrive ici.
  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => call(undefined, false), 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, email, password]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!ready) {
    return (
      <AuthLayout>
        <form
          noValidate
          className="auth__form"
          onSubmit={e => {
            e.preventDefault();
            call();
          }}
        >
          <h3 style={{ margin: 0 }}>Compte bloqué : contacter le support</h3>
          <p style={{ opacity: 0.8, fontSize: 14, margin: 0 }}>
            Identifiez-vous avec l'email et le mot de passe de votre compte pour écrire au support et lire ses réponses.
          </p>
          <Input type="email" autoComplete="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <Password value={password} onChange={(v: string) => setPassword(v)} />
          <Button type="submit" block>Ouvrir la conversation</Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="auth__form">
        <h3 style={{ margin: 0 }}>Support</h3>
        <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.length === 0 ? (
            <p style={{ opacity: 0.7, fontSize: 14 }}>Expliquez votre situation : un conseiller vous répond ici.</p>
          ) : null}
          {messages.map(m => (
            <div
              key={m.id}
              style={{
                alignSelf: m.fromAdmin ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: 12,
                background: m.fromAdmin ? 'rgba(255,255,255,.08)' : 'rgba(245,197,24,.18)',
                fontSize: 14,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.text}
              {m.imageUrl ? <div><a href={m.imageUrl} target="_blank" rel="noreferrer">📷 Image</a></div> : null}
              <div style={{ opacity: 0.5, fontSize: 11, marginTop: 4 }}>
                {new Date(m.at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form
          noValidate
          onSubmit={async e => {
            e.preventDefault();
            const msg = text.trim();
            if (!msg) return;
            if (await call(msg)) setText('');
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <Input placeholder="Votre message" value={text} onChange={e => setText(e.target.value)} />
          <Button type="submit">Envoyer</Button>
        </form>
      </div>
    </AuthLayout>
  );
};
