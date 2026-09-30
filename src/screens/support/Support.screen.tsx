import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faHeadset,
  faImage,
  faXmark,
  faGraduationCap,
  faChevronRight,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { SocialLinks } from '../../components/SocialLinks';
import { ToastService } from '../../services/toast.service';
import './support.css';

// La conversation se rafraichit toute seule : une reponse du support ne doit
// pas obliger a recharger la page. Dix secondes suffisent pour de l'ecrit.
const POLL_MS = 10000;

const hour = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const dayKey = (iso: string) => new Date(iso).toDateString();

/** Le jour en toutes lettres, avec "aujourd'hui" et "hier" pour les recents. */
const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  if (d.toDateString() === today.toDateString()) return translate('support.today');
  if (d.toDateString() === yesterday.toDateString())
    return translate('support.yesterday');
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
};

export const Support = observer(() => {
  const { supportStore } = appRootStore;
  // Un message pre-rempli quand on arrive depuis un moyen de paiement : la
  // conversation part avec son contexte au lieu de le faire retaper.
  const location = useLocation();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<string>(
    (location.state as any)?.prefill ?? '',
  );
  // Image choisie, en attente d'envoi : on veut souvent l'accompagner d'un mot.
  const [image, setImage] = useState<{ data: string; name: string } | null>(null);
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

  // `dayStart` porte le separateur de date, `tail` marque la fin d'une salve du
  // meme cote : seule cette bulle garde l'heure et le coin pointu.
  const messages = useMemo(() => {
    const list = supportStore.messages.slice();
    return list.map((m, i) => ({
      ...m,
      dayStart: i === 0 || dayKey(list[i - 1].at) !== dayKey(m.at),
      tail: i === list.length - 1 || list[i + 1].fromAdmin !== m.fromAdmin,
    }));
  }, [supportStore.messages]);

  // Appele par le formulaire comme par la touche Entree : seul
  // preventDefault est utilise.
  // Le delai de reponse, rappele une fois par visite au premier envoi : la
  // note en haut le dit deja, mais c'est au moment d'envoyer que l'on se
  // demande quand on aura une reponse.
  const toldDelay = useRef(false);

  const send = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (await supportStore.send(draft, image?.data)) {
      setDraft('');
      setImage(null);
      if (!toldDelay.current) {
        toldDelay.current = true;
        ToastService.show(translate('support.sentToast'));
      }
    }
  };

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Le champ est remis a zero pour que choisir deux fois le meme fichier
    // declenche bien l'evenement la seconde fois.
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () =>
      setImage({ data: String(reader.result), name: file.name });
    reader.readAsDataURL(file);
  };

  return (
    <div className="stack">
      <h1 className="screen-title">{translate('support.title')}</h1>

      {/* Epinglee : rejoindre le canal ou le groupe repond a une bonne part
          des questions avant meme qu'elles soient posees. */}
      {/* Epingle au-dessus de la conversation : une bonne part des questions
          posees ici ont deja leur reponse en tutoriel, et l'utilisateur
          attendait parfois des heures pour l'apprendre. */}
      <button
        type="button"
        className="sup-tuto"
        onClick={() => navigate('/tutorials')}
      >
        <span className="sup-tuto__icon">
          <FontAwesomeIcon icon={faGraduationCap} />
        </span>
        <span className="sup-tuto__text">
          <strong>{translate('support.tutorialsTitle')}</strong>
          <span>{translate('support.tutorialsText')}</span>
        </span>
        <FontAwesomeIcon icon={faChevronRight} className="sup-tuto__chev" />
      </button>

      <SocialLinks compact />

      {/* Le delai de reponse, dit avant qu'on ne le demande : sans lui, le
          deuxieme message d'une conversation etait souvent « vous etes la ? ». */}
      <p className="sup-delay">
        <FontAwesomeIcon icon={faClock} /> {translate('support.replyNote')}
      </p>

      <div className="sup-thread">
        {messages.length === 0 ? (
          <div className="sup-empty">
            <span className="sup-empty__icon">
              <FontAwesomeIcon icon={faHeadset} />
            </span>
            <strong>{translate('support.emptyTitle')}</strong>
            <p>{translate('support.empty')}</p>
          </div>
        ) : (
          messages.map(m => (
            <Fragment key={m.id}>
              {/* Un separateur des que le jour change : sans lui, deux messages
                  a une semaine d'intervalle se suivent sans rien le dire. */}
              {m.dayStart ? (
                <div className="sup-day">
                  <span>{dayLabel(m.at)}</span>
                </div>
              ) : null}
              <div
                className={`sup-row ${m.fromAdmin ? 'is-them' : 'is-me'}${
                  m.tail ? ' is-tail' : ' is-stacked'
                }`}
              >
                <div className="sup-bubble">
                  {m.imageUrl ? (
                    /* Ouverte dans un onglet : une capture d'ecran est
                       illisible a la taille d'une bulle. */
                    <a href={m.imageUrl} target="_blank" rel="noreferrer">
                      <img className="sup-img" src={m.imageUrl} alt="" />
                    </a>
                  ) : null}
                  {m.text ? <span className="sup-text">{m.text}</span> : null}
                  {/* Une seule heure par salve : repetee a chaque bulle, elle
                      hachait la lecture. */}
                  {m.tail ? <span className="sup-time">{hour(m.at)}</span> : null}
                </div>
              </div>
            </Fragment>
          ))
        )}
        <div ref={bottom} />
      </div>

      {/* L'apercu avant envoi : on voit ce qu'on s'apprete a joindre, et on
          peut encore le retirer. */}
      {image ? (
        <div className="sup-preview">
          <img src={image.data} alt="" />
          <span className="sup-preview__name">{image.name}</span>
          <button
            type="button"
            className="sup-preview__drop"
            onClick={() => setImage(null)}
            aria-label="Retirer l'image"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      ) : null}

      <form className="sup-compose" onSubmit={send}>
        <label className="sup-attach" title="Joindre une image">
          <FontAwesomeIcon icon={faImage} />
          <input type="file" accept="image/*" hidden onChange={pickImage} />
        </label>
        <textarea
          className="sup-input"
          placeholder={translate('support.placeholder')}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={1}
          // Entree envoie, Maj+Entree passe a la ligne : le reflexe d'une
          // messagerie, et un message en plusieurs points reste possible.
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(e);
            }
          }}
        />
        <button
          className="sup-send"
          type="submit"
          disabled={supportStore.sending || (!draft.trim() && !image)}
          aria-label={translate('support.send')}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </div>
  );
});
