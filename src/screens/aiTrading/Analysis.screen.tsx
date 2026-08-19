import { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { BtcSparkline } from './BtcSparkline';
import { WhatIf } from './WhatIf';
import { appRootStore } from '../../stores/root.store';
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
    // The what-if card needs the global NAV, which lives on the managed
    // account — this screen is reachable without visiting the bot screen first.
    if (!managedStore.account) managedStore.load();
  }, [load, managedStore]);

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

      <WhatIf
        nav={managedStore.account?.nav ?? 0}
        monthRate={managedStore.account?.monthRate}
      />

      <div className="an-grid">
        <div className="bot-stat">
          <div className="bot-stat__label">RSI (14)</div>
          <div className="bot-stat__value">{a.rsi.toFixed(1)}</div>
        </div>
        <div className="bot-stat">
          <div className="bot-stat__label">Volatilité 30j</div>
          <div className="bot-stat__value">{a.volatility.toFixed(2)}%</div>
        </div>
        <div className="bot-stat">
          <div className="bot-stat__label">EMA 20</div>
          <div className="bot-stat__value">{a.ema20.toFixed(2)}</div>
        </div>
        <div className="bot-stat">
          <div className="bot-stat__label">EMA 50</div>
          <div className="bot-stat__value">{a.ema50.toFixed(2)}</div>
        </div>
        <div className="bot-stat">
          <div className="bot-stat__label">Support</div>
          <div className="bot-stat__value">{a.support.toFixed(2)}</div>
        </div>
        <div className="bot-stat">
          <div className="bot-stat__label">Résistance</div>
          <div className="bot-stat__value">{a.resistance.toFixed(2)}</div>
        </div>
      </div>

      {/* RSI 0-100 on a bar; the 30/70 zones are where the votes flip. */}
      <div className="an-gauge">
        <div className="an-gauge__track">
          <span className="an-gauge__zone" style={{ left: 0, width: '30%', background: '#DFF5E9' }} />
          <span className="an-gauge__zone" style={{ left: '70%', width: '30%', background: '#FCE8E8' }} />
          <span
            className="an-gauge__dot"
            style={{ left: `${Math.max(0, Math.min(100, a.rsi))}%` }}
          />
        </div>
        <div className="an-gauge__labels">
          <span>Survente</span>
          <span>Neutre</span>
          <span>Surachat</span>
        </div>
      </div>

      <h2 className="an-section">Lecture des indicateurs</h2>
      <ul className="an-reasons">
        {a.reasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>

      <div className="an-updated">
        Mis à jour à{' '}
        {new Date(updatedAt).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })}{' '}
        · données Binance
      </div>

      <div className="bot-note bot-note--info">
        <div className="bot-note__title">ℹ️ Information</div>
        <div>
          Cette analyse est fournie à titre informatif et ne constitue pas un
          conseil en investissement. Le LE AI BOT l'utilise parmi d'autres
          signaux pour prendre ses positions.
        </div>
      </div>
    </div>
  );
});
