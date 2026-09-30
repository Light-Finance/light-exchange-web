import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faChevronRight,
  faCoins,
  faGraduationCap,
  faLock,
} from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import type { ILessonCard } from '../../stores/learn.store';
import './learn.css';

// La liste des leçons, groupees par parcours, avec les credits en tete.
//
// Les credits sont ce que l'utilisateur vient chercher ; les leçons sont le
// chemin. Les montrer d'abord, avec la barre de progression, dit en un coup
// d'oeil ou l'on en est et ce qu'il reste a gagner.

/** L'etat d'une leçon, en un mot et une couleur. */
const badge = (l: ILessonCard) => {
  const p = l.progress;
  if (p.rewarded > 0) return { text: `+${l.reward} crédit`, cls: 'is-done', icon: faCheck };
  if (p.passed) return { text: 'Réussie · à réclamer', cls: 'is-claim', icon: faCoins };
  if (p.retryAt) return { text: 'Réessayer demain', cls: 'is-wait', icon: faLock };
  return { text: `${l.reward} crédit`, cls: '', icon: faCoins };
};

export const LearnList = observer(() => {
  const navigate = useNavigate();
  const { learnStore } = appRootStore;
  const s = learnStore.status;
  const lessons = learnStore.lessons ?? [];
  const tracks = Array.from(new Set(lessons.map(l => l.track || 'Formation')));
  const ratio = s && s.lessonCount > 0 ? s.passedCount / s.lessonCount : 0;

  useEffect(() => {
    learnStore.load(true);
  }, [learnStore]);

  return (
    <div className="stack">
      <h1 className="screen-title">Formations</h1>

      <section className="ln-hero">
        <div className="ln-hero__top">
          <span className="ln-hero__icon"><FontAwesomeIcon icon={faGraduationCap} /></span>
          <div>
            <h2 className="ln-hero__title">Apprenez, gagnez des crédits</h2>
            <p className="ln-hero__text">
              Chaque leçon réussie rapporte des crédits, qui paient votre abonnement
              au robot IA. Jusqu'à {s?.cap ?? 25} crédits.
            </p>
          </div>
        </div>
        <div className="ln-credits">
          <div>
            <span className="ln-credits__label">Vos crédits</span>
            <strong className="ln-credits__value">{(s?.credits ?? 0).toFixed(0)}</strong>
          </div>
          <div className="ln-credits__progress">
            <span className="ln-credits__label">
              {s?.passedCount ?? 0} / {s?.lessonCount ?? lessons.length} leçons réussies
            </span>
            <div className="ln-bar"><div className="ln-bar__fill" style={{ width: `${Math.round(ratio * 100)}%` }} /></div>
          </div>
        </div>
        {/* Dit d'avance ce qui bloque une recompense, plutot que de le
            decouvrir apres avoir reussi un quiz. */}
        {s && s.verifiedRequired && !s.verified ? (
          <button type="button" className="ln-warn" onClick={() => navigate('/profil')}>
            Vérifiez votre identité dans votre profil pour recevoir vos crédits.
            Vous pouvez suivre les leçons dès maintenant.
          </button>
        ) : null}
        {s && s.todayRewarded >= s.dailyMax ? (
          <p className="ln-info">Une leçon récompensée par jour : la prochaine se réclame demain.</p>
        ) : null}
      </section>

      {tracks.map((track, ti) => (
        <div key={track}>
          <h3 className="ln-track">Parcours {ti + 1} · {track}</h3>
          {lessons
            .filter(l => (l.track || 'Formation') === track)
            .map(l => {
              const b = badge(l);
              return (
                <button
                  key={l.id}
                  type="button"
                  className="ln-card"
                  onClick={() => navigate('/academy/lesson', { state: { lessonId: l.id } })}
                >
                  <div className="ln-card__body">
                    <strong className="ln-card__title">{l.title}</strong>
                    <span className="ln-card__summary">{l.summary}</span>
                    <span className="ln-card__meta">
                      <span>{l.minutes} min · {l.questionCount} questions</span>
                      <span className={`ln-badge ${b.cls}`}><FontAwesomeIcon icon={b.icon} /> {b.text}</span>
                    </span>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} className="ln-card__chev" />
                </button>
              );
            })}
        </div>
      ))}

      {lessons.length === 0 ? <p className="mk-note">Les leçons arrivent bientôt.</p> : null}
    </div>
  );
});
