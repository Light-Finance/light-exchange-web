import { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { BtcSparkline } from './BtcSparkline';
import { WhatIf } from './WhatIf';
import { appRootStore } from '../../stores/root.store';
import lightexchange from 'light-exchange';
import { Linking } from '../../platform/linking';
import {
  analyse,
  fetchCandles,
  IAnalysis,
  PAIRS,
  SIGNAL_LABEL,
  TSignal,
} from '../../helpers/marketAnalysis';
import './aiTrading.css';

const SIGNAL_COLOR: Record<TSignal, string> = {
  STRONG_BUY: '#0E9F6E',
  BUY: '#3BAA7A',
  NEUTRAL: '#8A8A8A',
  SELL: '#E4703A',
  STRONG_SELL: '#D64545',
};

// A single sentence tying the indicators together — the takeaway the user reads
// first, before the indicator-by-indicator breakdown below it.
function summary(a: IAnalysis): string {
  const dir =
    a.signal === 'STRONG_BUY' || a.signal === 'BUY'
      ? 'favorable à des positions longues'
      : a.signal === 'SELL' || a.signal === 'STRONG_SELL'
      ? 'favorable à la prudence, voire à des positions courtes'
      : 'sans direction claire, le bot reste sélectif';
  const trend =
    a.trend === 'up' ? 'haussière' : a.trend === 'down' ? 'baissière' : 'neutre';
  return `Sur ${a.label}, la configuration technique est ${dir}. Tendance ${trend}, avec un support à ${a.support.toFixed(
    2,
  )} et une résistance à ${a.resistance.toFixed(2)}.`;
}

export const Analysis = observer(() => {
  const { managedStore } = appRootStore;
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [askModal, setAskModal] = useState(false);
  const [data, setData] = useState<IAnalysis[]>([]);
  const [selected, setSelected] = useState(PAIRS[0].symbol);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(0);

  const load = useCallback(async () => {
    try {
      const results = await Promise.all(
        PAIRS.map(async p => analyse(p.symbol, p.label, await fetchCandles(p.symbol))),
      );
      const rows = results.filter(Boolean) as IAnalysis[];
      setData(rows);
      setError(rows.length === 0);
      setUpdatedAt(Date.now());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // The estimate card runs on the monthly rate the admin sets in the
    // dashboard, which rides along on the managed account.
    if (!managedStore.account) managedStore.load();
  }, [load, managedStore]);

  // Subscribers get a human on WhatsApp with their question already typed in;
  // everyone else gets the subscribe prompt.
  const ask = async () => {
    const text = question.trim();
    if (!text) return;
    if ((managedStore.account?.principal ?? 0) <= 0) {
      setAskModal(true);
      return;
    }
    const number = await appRootStore.systemStore.systemGetNumbers(
      lightexchange.app.NUMBERS_TYPE.CUSTOMER_SUPPORT,
    );
    const url = `whatsapp://send?text=${encodeURIComponent(
      `[LE AI BOT] ${text}`,
    )}&phone=${number}`;
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      setQuestion('');
    }
  };

  const a = data.find(d => d.symbol === selected);

  if (loading) {
    return (
      <div className="stack">
        <h1 className="screen-title">Analyse de marché</h1>
        <div className="empty-state">
          <span className="btn__spinner" style={{ color: 'var(--color-secondary)' }} />
        </div>
      </div>
    );
  }

  if (error || !a) {
    return (
      <div className="stack">
        <h1 className="screen-title">Analyse de marché</h1>
        <div className="card empty-state">
          Analyse indisponible. Vérifiez votre connexion et réessayez.
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <h1 className="screen-title">Analyse de marché</h1>

      <div className="an-tabs">
        {data.map(d => (
          <button
            key={d.symbol}
            type="button"
            className={`an-tab${d.symbol === selected ? ' an-tab--on' : ''}`}
            onClick={() => setSelected(d.symbol)}
          >
            {d.label.split('/')[0]}
          </button>
        ))}
      </div>

      <div className="bot-hero">
        <div className="bot-hero__label">{a.label}</div>
        <div className="bot-hero__equity">
          {a.price.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} USDT
        </div>
        <div
          className="bot-hero__target"
          style={{ color: a.change24h >= 0 ? 'rgba(255,255,255,0.95)' : '#FFD3D3' }}
        >
          {a.change24h >= 0 ? '▲ +' : '▼ '}
          {a.change24h.toFixed(2)}% / 24h
        </div>
        <div className="bot-hero__chart">
          <BtcSparkline
            data={a.closes.slice(-45)}
            color="#FFFFFF"
            height={62}
            id={`an-${a.symbol}`}
          />
        </div>
      </div>

      <div className="an-signal" style={{ borderColor: SIGNAL_COLOR[a.signal] }}>
        <div className="an-signal__label">Signal du LE AI BOT</div>
        <div className="an-signal__value" style={{ color: SIGNAL_COLOR[a.signal] }}>
          {SIGNAL_LABEL[a.signal]}
        </div>
        <div className="an-conf">
          <div
            className="an-conf__fill"
            style={{
              width: `${a.confidence}%`,
              background: SIGNAL_COLOR[a.signal],
            }}
          />
        </div>
        <div className="an-conf__txt">Confiance {a.confidence.toFixed(0)}%</div>
      </div>

      <p className="an-summary">{summary(a)}</p>

      <WhatIf monthRate={managedStore.account?.monthRate} />

      <div className="an-ask">
        <div className="an-ask__title">🤖 Posez votre question au bot</div>
        <div className="an-ask__hint">
          Ex. « Est-ce le bon moment pour acheter du BTC ? »
        </div>
        <textarea
          className="an-ask__input"
          placeholder="Votre question..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />
        <Button block disabled={!question.trim()} onClick={ask}>
          Envoyer au LE AI BOT
        </Button>
      </div>

      <div className="an-updated">
        Mis à jour à{' '}
        {new Date(updatedAt).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })}{' '}
        · données Binance
      </div>

      {askModal ? (
        <Modal onClose={() => setAskModal(false)}>
          <div className="stack">
            <h2>🔒 Réservé aux membres du bot</h2>
            <p>
              Les réponses personnalisées du LE AI BOT sont réservées aux
              utilisateurs ayant souscrit. Déposez dans le bot pour poser vos
              questions et recevoir ses analyses sur mesure.
            </p>
            <Button
              block
              onClick={() => {
                setAskModal(false);
                navigate('/ai-trading');
              }}
            >
              Souscrire au LE AI BOT
            </Button>
            <Button block variant="secondary" onClick={() => setAskModal(false)}>
              Plus tard
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
});
