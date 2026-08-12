import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import { ToastService } from '../../services/toast.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import './worldwide.css';

// Margin added on top of the Taptap Send rate.
const RATE_MARGIN = 5;
// Zelle number to send the USD payment to — the only sender method for now.
const ZELLE_RECEPTOR_NUMBER = '+1 914 444 0801';

const readFileBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1] ?? dataUrl);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const SendWorldwide = observer(() => {
  const { worldwideTransactionStore: store } = appRootStore;
  const fileRef = useRef<HTMLInputElement>(null);
  const [baseRate, setBaseRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [receiverPaymentMethod, setReceiverPaymentMethod] = useState('ORANGE');
  const [receiverNumber, setReceiverNumber] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://api.taptapsend.com/api/fxRates', {
          headers: {
            Accept: 'application/json',
            'Appian-Version': 'web/2022-05-03.0',
            'X-Device-Id': 'web',
            'X-Device-Model': 'web',
          },
        });
        const data = await res.json();
        const us = (data?.availableCountries || []).find(
          (c: any) => c.isoCountryCode === 'US' && c.currency === 'USD',
        );
        const cm = (us?.corridors || []).find(
          (k: any) => k.isoCountryCode === 'CM' && k.currency === 'XAF',
        );
        const rate = parseFloat(cm?.fxRate);
        setBaseRate(rate > 0 ? rate : 0);
      } catch {
        /* rate unavailable — screen shows the error line */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rate = baseRate > 0 ? baseRate + RATE_MARGIN : 0;
  const amt = parseFloat(amount) || 0;
  const xaf = amt * rate;

  const copyReceptor = async () => {
    try {
      await navigator.clipboard.writeText(ZELLE_RECEPTOR_NUMBER);
      ToastService.show('Number copied');
    } catch {
      /* clipboard blocked */
    }
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      const base64 = await readFileBase64(file);
      const ok = await store.create({
        amountSent: amt,
        rate,
        amountToReceive: Math.round(xaf),
        senderPaymentMethod: 'ZELLE',
        receiverPaymentMethod,
        receiverNumber: receiverNumber.trim(),
        base64,
      });
      if (ok) {
        setAmount('');
        setReceiverNumber('');
        setReceiverPaymentMethod('ORANGE');
      }
    } catch (e: any) {
      ToastService.show(e?.message || 'Could not read the screenshot', ToastService.ERROR);
    }
  };

  const submit = () => {
    if (store.isSubmitting) return;
    if (!amt || !rate) {
      ToastService.show('Enter a valid amount');
      return;
    }
    if (!receiverNumber.trim()) {
      ToastService.show('Enter the receiver number');
      return;
    }
    // The Zelle payment proof is chosen with a file input; create() runs once picked.
    fileRef.current?.click();
  };

  return (
    <div className="stack ww">
      <h1 className="screen-title">Send money worldwide</h1>

      {loading ? (
        <span className="btn__spinner" style={{ color: 'var(--color-secondary)' }} />
      ) : rate ? (
        <p className="ww-rate">1 USD = {rate.toFixed(2)} XAF</p>
      ) : (
        <p className="ww-rate-error">Rate unavailable — check your connection and reopen this screen.</p>
      )}

      <label className="ww-label">Source country</label>
      <select className="ww-select" value="USA" disabled>
        <option value="USA">United States (USA)</option>
      </select>

      <label className="ww-label">Sender payment method</label>
      <select className="ww-select" value="ZELLE" disabled>
        <option value="ZELLE">Zelle</option>
      </select>

      <div className="ww-receptor">
        <div>
          <div className="ww-receptor__label">Send Zelle payment to</div>
          <div className="ww-receptor__value">{ZELLE_RECEPTOR_NUMBER}</div>
        </div>
        <button type="button" className="profil-iconbtn" onClick={copyReceptor}>
          <FontAwesomeIcon icon={faCopy} style={{ color: 'var(--color-secondary)' }} />
        </button>
      </div>

      <label className="ww-label">Destination country</label>
      <select className="ww-select" value="CAMEROON" disabled>
        <option value="CAMEROON">Cameroon</option>
      </select>

      <label className="ww-label">Amount to send (USD)</label>
      <Input inputMode="numeric" placeholder="Ex: 200" value={amount} onChange={e => setAmount(e.target.value)} />

      <div className="ww-receive">
        <span>Amount to receive</span>
        <span className="ww-receive__value">
          {amt > 0 && rate ? `${Math.round(xaf).toLocaleString()} XAF` : '—'}
        </span>
      </div>

      <label className="ww-label">Receiver payment method</label>
      <select
        className="ww-select"
        value={receiverPaymentMethod}
        onChange={e => setReceiverPaymentMethod(e.target.value)}
      >
        <option value="ORANGE">Orange Money</option>
        <option value="MTN">MTN Money</option>
      </select>

      <label className="ww-label">Receiver number</label>
      <Input
        inputMode="tel"
        placeholder="Ex: 6XX XX XX XX"
        value={receiverNumber}
        onChange={e => setReceiverNumber(e.target.value)}
      />

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onFile(e.target.files?.[0])} />
      <Button block loading={store.isSubmitting} onClick={submit}>
        {store.isSubmitting ? 'Sending...' : 'Send'}
      </Button>
    </div>
  );
});
