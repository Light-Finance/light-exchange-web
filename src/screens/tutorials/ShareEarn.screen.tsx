import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import gql from 'graphql-tag';
import { appRootStore } from '../../stores/root.store';
import { Service } from '../../services/service.service';
import { ToastService } from '../../services/toast.service';
import './learn.css';

// Miroir de l'ecran mobile : publier l'app avec son code, envoyer le lien ou
// une capture, validation au dashboard, +1 credit robot par partage accepte.

const SHARE_STATUS = gql`
  query shareStatus($userId: ID!) {
    shareStatus(userId: $userId) {
      message
      reward
      perMonth
      canSubmit
      approvedThisMonth
      claims {
        id
        network
        status
        reward
        note
        createdAt
      }
    }
  }
`;
const SHARE_SUBMIT = gql`
  mutation shareSubmit($userId: ID!, $network: String!, $link: String, $imageBase64: String) {
    shareSubmit(userId: $userId, network: $network, link: $link, imageBase64: $imageBase64) {
      id
    }
  }
`;

const NETWORKS: [string, string][] = [
  ['whatsapp', 'WhatsApp'],
  ['facebook', 'Facebook'],
  ['tiktok', 'TikTok'],
  ['instagram', 'Instagram'],
  ['telegram', 'Telegram'],
  ['x', 'X'],
  ['autre', 'Autre'],
];
const STATUS: Record<string, [string, string]> = {
  pending: ['En attente', 'is-wait'],
  approved: ['Validé', 'is-ok'],
  rejected: ['Refusé', 'is-ko'],
};

interface IStatus {
  message: string;
  reward: number;
  perMonth: number;
  canSubmit: boolean;
  approvedThisMonth: number;
  claims: { id: string; network: string; status: string; reward: number; note: string; createdAt: string }[];
}

export const ShareEarn = observer(() => {
  const navigate = useNavigate();
  const userId = appRootStore.authStore.user?.id;
  const [s, setS] = useState<IStatus | null>(null);
  const [network, setNetwork] = useState('whatsapp');
  const [link, setLink] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (loader = false) => {
    if (!userId) return;
    const r: any = await Service.query({ userId }, SHARE_STATUS, loader);
    if (r?.data?.shareStatus) setS(r.data.shareStatus);
  };
  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(s?.message ?? '');
      ToastService.show('Message copié', ToastService.SUCCESS);
    } catch {
      ToastService.show('Copie impossible : sélectionnez le texte', ToastService.ERROR);
    }
  };
  const share = async () => {
    const text = s?.message ?? '';
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };
  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };
  const submit = async () => {
    if (busy || !userId) return;
    if (!link.trim() && !image) {
      ToastService.show("Ajoutez le lien de votre publication ou une capture d'écran", ToastService.ERROR);
      return;
    }
    setBusy(true);
    const r: any = await Service.mutation({ userId, network, link: link.trim(), imageBase64: image }, SHARE_SUBMIT, true);
    setBusy(false);
    if (r?.data?.shareSubmit) {
      setLink('');
      setImage(null);
      ToastService.show('Envoyé ! Vous serez notifié dès la validation.', ToastService.SUCCESS);
      load(false);
    }
  };

  return (
    <div className="stack">
      <button type="button" className="pr-back sh-back" onClick={() => navigate('/academy')}>← Formations</button>
      <h1 className="screen-title" style={{ marginTop: 0 }}>Partager et gagner</h1>

      <section className="sh-hero">
        <strong>📣 Parlez de Light Exchange</strong>
        <p>
          Publiez l'app sur vos réseaux (statut WhatsApp, Facebook, TikTok…) avec votre code de parrainage.
          Chaque partage validé = +{s?.reward ?? 1} crédit robot (1 $ sur l'abonnement). Un partage par jour,{' '}
          {s?.perMonth ?? 10} par mois.
        </p>
        <b>Ce mois-ci : {s?.approvedThisMonth ?? 0} / {s?.perMonth ?? 10} validés</b>
      </section>

      <h2 className="sh-h">1. Publiez</h2>
      <pre className="sh-msg">{s?.message ?? '…'}</pre>
      <div className="sh-row">
        <button type="button" className="sh-btn" onClick={share}>Partager</button>
        <button type="button" className="sh-btn sh-btn--ghost" onClick={copy}>Copier le texte</button>
      </div>

      <h2 className="sh-h">2. Envoyez la preuve</h2>
      {s && !s.canSubmit ? (
        <p className="ln-info">Vous avez déjà envoyé votre partage du jour (ou atteint le maximum du mois). Revenez demain !</p>
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          <div className="sh-chips">
            {NETWORKS.map(([k, label]) => (
              <button key={k} type="button" className={`sh-chip${network === k ? ' is-on' : ''}`} onClick={() => setNetwork(k)}>
                {label}
              </button>
            ))}
          </div>
          <input className="sh-input" value={link} onChange={e => setLink(e.target.value)} placeholder="Lien de la publication (facultatif)" />
          <label className="sh-btn sh-btn--ghost">
            {image ? 'Changer la capture' : "📷 Ajouter une capture d'écran"}
            <input type="file" accept="image/*" hidden onChange={pickImage} />
          </label>
          {image ? <img src={image} alt="Capture" className="sh-preview" /> : null}
          <button type="button" className="sh-btn" disabled={busy} onClick={submit}>
            {busy ? 'Envoi…' : 'Envoyer pour validation'}
          </button>
        </div>
      )}

      {s?.claims.length ? <h2 className="sh-h">Mes partages</h2> : null}
      {s?.claims.map(c => {
        const [label, cls] = STATUS[c.status] ?? [c.status, ''];
        return (
          <div key={c.id} className="sh-claim">
            <span>
              <b>{NETWORKS.find(([k]) => k === c.network)?.[1] ?? c.network}</b> · {new Date(c.createdAt).toLocaleDateString('fr-FR')}
              {c.note ? <small>{c.note}</small> : null}
            </span>
            <b className={cls}>{label}{c.status === 'approved' ? ` +${c.reward}` : ''}</b>
          </div>
        );
      })}
    </div>
  );
});
