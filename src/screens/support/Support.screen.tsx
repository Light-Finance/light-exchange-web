import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import './support.css';

// La conversation se rafraichit toute seule : une reponse du support ne doit
// pas obliger a recharger la page. Dix secondes suffisent pour de l'ecrit.
const POLL_MS = 10000;

const when = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export const Support = observer(() => {
  const { supportStore } = appRootStore;
  const [draft, setDraft] = useState('');
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supportStore.load().then(() => supportStore.markRead());
    const id = window.setInterval(() => supportStore.load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [supportStore]);

  // Une conversation se lit par le bas : c'est le dernier message qui compte.
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [supportStore.messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await supportStore.send(draft)) setDraft('');
  };

  return (
    <div className="stack">
      <h1 className="screen-title">{translate('support.title')}</h1>

      <div className="sup-thread">
        {supportStore.messages.length === 0 ? (
          <p className="sup-empty">{translate('support.empty')}</p>
        ) : (
          supportStore.messages.map(m => (
            <div
              key={m.id}
              className={`sup-row ${m.fromAdmin ? 'is-them' : 'is-me'}`}
            >
              <div className="sup-bubble">
                <span className="sup-text">{m.text}</span>
                <span className="sup-time">{when(m.at)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={bottom} />
      </div>

      <form className="sup-compose" onSubmit={send}>
        <input
          className="sup-input"
          placeholder={translate('support.placeholder')}
          value={draft}
          onChange={e => setDraft(e.target.value)}
        />
        <button
          className="sup-send"
          type="submit"
          disabled={supportStore.sending || !draft.trim()}
          aria-label={translate('support.send')}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </div>
  );
});
