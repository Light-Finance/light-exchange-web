/**
 * Technical analysis of a Binance pair, computed on-device from daily klines.
 * The bot's "analysis" tab needs indicators, not just a price, and the API has
 * no analysis endpoint — so everything here is derived from the candles we
 * already fetch for the sparkline.
 */

export interface ICandle {
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TSignal = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

export interface IAnalysis {
  symbol: string;
  label: string;
  price: number;
  change24h: number;
  rsi: number;
  ema20: number;
  ema50: number;
  macd: number;
  macdSignal: number;
  support: number;
  resistance: number;
  volatility: number;
  trend: 'up' | 'down' | 'flat';
  signal: TSignal;
  confidence: number;
  reasons: string[];
  closes: number[];
}

export const PAIRS: { symbol: string; label: string }[] = [
  { symbol: 'BTCUSDT', label: 'BTC/USDT' },
  { symbol: 'ETHUSDT', label: 'ETH/USDT' },
  { symbol: 'SOLUSDT', label: 'SOL/USDT' },
  { symbol: 'BNBUSDT', label: 'BNB/USDT' },
];

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0];
  values.forEach((v, i) => {
    prev = i === 0 ? v : v * k + prev * (1 - k);
    out.push(prev);
  });
  return out;
}

/** Wilder's RSI. Returns 50 (neutral) when there isn't enough history. */
function rsi(closes: number[], period = 14): number {
  if (closes.length <= period) return 50;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (loss === 0) return 100;
  return 100 - 100 / (1 + gain / loss);
}

/** Annualised-ish volatility: stdev of daily returns, in %. */
function volatility(closes: number[]): number {
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  if (!rets.length) return 0;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const varc =
    rets.reduce((a, b) => a + (b - mean) * (b - mean), 0) / rets.length;
  return Math.sqrt(varc) * 100;
}

export async function fetchCandles(
  symbol: string,
  interval = '1d',
  limit = 90,
): Promise<ICandle[]> {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
  );
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((c: any[]) => ({
    t: c[0],
    open: parseFloat(c[1]),
    high: parseFloat(c[2]),
    low: parseFloat(c[3]),
    close: parseFloat(c[4]),
    volume: parseFloat(c[5]),
  }));
}

/**
 * Score the indicators into one signal. Each indicator votes in [-2, 2]; the
 * sum decides the label and its distance from 0 becomes the confidence, so a
 * signal only reads "strong" when the indicators actually agree.
 */
export function analyse(
  symbol: string,
  label: string,
  candles: ICandle[],
): IAnalysis | null {
  if (candles.length < 30) return null;
  const closes = candles.map(c => c.close);
  const price = closes[closes.length - 1];
  const prev24 = closes[closes.length - 2] || price;
  const change24h = ((price - prev24) / prev24) * 100;

  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50);
  const ema20 = e20[e20.length - 1];
  const ema50 = e50[e50.length - 1];

  const e12 = ema(closes, 12);
  const e26 = ema(closes, 26);
  const macdLine = e12.map((v, i) => v - e26[i]);
  const signalLine = ema(macdLine, 9);
  const macd = macdLine[macdLine.length - 1];
  const macdSignal = signalLine[signalLine.length - 1];

  const window = candles.slice(-30);
  const support = Math.min(...window.map(c => c.low));
  const resistance = Math.max(...window.map(c => c.high));

  const r = rsi(closes);
  const vol = volatility(closes.slice(-30));

  let score = 0;
  const reasons: string[] = [];

  if (r < 30) {
    score += 2;
    reasons.push(`RSI ${r.toFixed(0)} : zone de survente, rebond probable.`);
  } else if (r < 45) {
    score += 1;
    reasons.push(`RSI ${r.toFixed(0)} : légèrement faible, pression vendeuse qui s'essouffle.`);
  } else if (r > 70) {
    score -= 2;
    reasons.push(`RSI ${r.toFixed(0)} : zone de surachat, risque de correction.`);
  } else if (r > 55) {
    score -= 0;
    reasons.push(`RSI ${r.toFixed(0)} : momentum acheteur encore sain.`);
  } else {
    reasons.push(`RSI ${r.toFixed(0)} : marché équilibré.`);
  }

  if (ema20 > ema50) {
    score += 2;
    reasons.push('EMA20 au-dessus de l\'EMA50 : tendance de fond haussière.');
  } else {
    score -= 2;
    reasons.push('EMA20 sous l\'EMA50 : tendance de fond baissière.');
  }

  if (macd > macdSignal) {
    score += 1;
    reasons.push('MACD au-dessus de sa ligne de signal : momentum positif.');
  } else {
    score -= 1;
    reasons.push('MACD sous sa ligne de signal : momentum négatif.');
  }

  const range = resistance - support || 1;
  const pos = (price - support) / range;
  if (pos < 0.25) {
    score += 1;
    reasons.push(
      `Prix proche du support (${support.toFixed(2)}) : zone d'achat intéressante.`,
    );
  } else if (pos > 0.75) {
    score -= 1;
    reasons.push(
      `Prix proche de la résistance (${resistance.toFixed(2)}) : prises de bénéfices possibles.`,
    );
  }

  reasons.push(
    `Volatilité 30j : ${vol.toFixed(2)}% par jour — ${
      vol > 4 ? 'élevée, taille de position réduite' : 'modérée'
    }.`,
  );

  let signal: TSignal = 'NEUTRAL';
  if (score >= 4) signal = 'STRONG_BUY';
  else if (score >= 2) signal = 'BUY';
  else if (score <= -4) signal = 'STRONG_SELL';
  else if (score <= -2) signal = 'SELL';

  return {
    symbol,
    label,
    price,
    change24h,
    rsi: r,
    ema20,
    ema50,
    macd,
    macdSignal,
    support,
    resistance,
    volatility: vol,
    trend: ema20 > ema50 ? 'up' : ema20 < ema50 ? 'down' : 'flat',
    signal,
    confidence: Math.min(95, 45 + Math.abs(score) * 10),
    reasons,
    closes,
  };
}

export const SIGNAL_LABEL: Record<TSignal, string> = {
  STRONG_BUY: 'ACHAT FORT',
  BUY: 'ACHAT',
  NEUTRAL: 'NEUTRE',
  SELL: 'VENTE',
  STRONG_SELL: 'VENTE FORTE',
};
