import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import gql from 'graphql-tag';
import { QRCodeSVG } from 'qrcode.react';
import { appRootStore } from '../../stores/root.store';
import { Service } from '../../services/service.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { ToastService } from '../../services/toast.service';

// Depot d'une crypto du Marche sur son reseau natif. L'adresse est celle que
// l'admin a fournie ; sans adresse, la crypto n'apparait pas ici. Apres
// l'envoi, l'utilisateur declare la quantite et le hash, l'admin verifie et la
// quantite entre dans sa position.

const DECLARE = gql`
  mutation cryptoDepositDeclare($userId: ID!, $assetId: ID!, $quantity: Float!, $txid: String!) {
    cryptoDepositDeclare(userId: $userId, assetId: $assetId, quantity: $quantity, txid: $txid) { id status }
  }
`;
const MINE = gql`
  query myCryptoDeposits($userId: ID!) {
    myCryptoDeposits(userId: $userId) { id shortName quantity status note createdAt }
  }
`;

const STATUS: Record<string, string> = { pending: 'En vérification', approved: 'Crédité', rejected: 'Refusé' };

export const CryptoDepositPanel = observer(() => {
  const { marketStore, authStore } = appRootStore as any;
  const userId = authStore.user?.id;
  const assets = (marketStore.assets || []).filter((a: any) => a.depositAddress);
  const [open, setOpen] = useState<any>(null);
  const [qty, setQty] = useState('');
  const [txid, setTxid] = useState('');
  const [mine, setMine] = useState<any[]>([]);

  const load = async () => {
    if (!userId) return;
    const r: any = await Service.query({ userId }, MINE, false);
    setMine(r?.data?.myCryptoDeposits || []);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!assets.length) return null;

  const copy = (t: string) => {
    try {
      navigator.clipboard.writeText(t);
      ToastService.show('Copié', ToastService.SUCCESS);
    } catch {
      /* presse-papiers bloque */
    }
  };

  const submit = async () => {
    const q = parseFloat(qty.replace(',', '.'));
    if (!(q > 0) || txid.trim().length < 10) {
      ToastService.show('Indiquez la quantité envoyée et le hash de la transaction.', ToastService.ERROR);
      return;
    }
    const r: any = await Service.mutation({ userId, assetId: open.id, quantity: q, txid: txid.trim() }, DECLARE);
    if (r?.data?.cryptoDepositDeclare) {
      ToastService.show('Dépôt déclaré : il sera crédité après vérification.', ToastService.SUCCESS);
      setOpen(null);
      setQty('');
      setTxid('');
      load();
    }
  };

  return (
    <>
      <h2 className="mk-heading">Déposer une crypto</h2>
      <div className="mk-kinds" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {assets.map((a: any) => (
          <button key={a.id} type="button" className="mk-kind" onClick={() => setOpen(a)}>
            {a.shortName} · {a.depositNetwork || 'réseau natif'}
          </button>
        ))}
      </div>
      {mine.length ? (
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 16 }}>
          {mine.slice(0, 5).map(d => (
            <div key={d.id}>
              {new Date(d.createdAt).toLocaleDateString('fr-FR')} · {d.quantity} {d.shortName} ·{' '}
              <strong>{STATUS[d.status] || d.status}</strong>
              {d.note ? ` — ${d.note}` : ''}
            </div>
          ))}
        </div>
      ) : null}

      {open ? (
        <Modal onClose={() => setOpen(null)} label="Dépôt crypto">
          <div className="stack">
            <h2>Déposer du {open.shortName}</h2>
            <p style={{ margin: 0 }}>
              Réseau : <strong>{open.depositNetwork || 'natif'}</strong>. Envoyez uniquement du {open.shortName} sur ce
              réseau : un autre réseau ou une autre crypto serait perdu.
            </p>
            <div style={{ textAlign: 'center' }}>
              <QRCodeSVG value={open.depositAddress} size={160} level="M" />
            </div>
            <button type="button" className="mk-kind" style={{ wordBreak: 'break-all' }} onClick={() => copy(open.depositAddress)}>
              {open.depositAddress} 📋
            </button>
            {open.depositMemo ? (
              <button type="button" className="mk-kind" onClick={() => copy(open.depositMemo)}>
                Mémo / tag obligatoire : <strong>{open.depositMemo}</strong> 📋
              </button>
            ) : null}
            <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
              Après l'envoi, indiquez la quantité et le hash (ID) de la transaction : votre {open.shortName} est ajouté
              à votre portefeuille Marché après vérification.
            </p>
            <Input placeholder={`Quantité envoyée (${open.shortName})`} inputMode="decimal" value={qty} onChange={e => setQty(e.target.value)} />
            <Input placeholder="Hash / ID de la transaction" value={txid} onChange={e => setTxid(e.target.value)} />
            <Button block onClick={submit}>J'ai envoyé, déclarer le dépôt</Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
});
