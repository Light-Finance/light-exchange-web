import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCoins, faXmark } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import type { IQuizResult } from '../../stores/learn.store';
import { ToastService } from '../../services/toast.service';
import './learn.css';

// Une leçon : le texte, puis le quiz, puis le resultat. Le texte est au-dessus
// du quiz, sur la meme page, pour qu'on puisse y revenir en faisant defiler.

/** Ce que le serveur dit quand une reussite n'est pas recompensee. */
const REASONS: Record<string, string> = {
  verified_required: "Vérifiez votre identité dans votre profil pour recevoir ce crédit. Vous pourrez le réclamer ensuite depuis la liste.",
  daily_limit: 'Une leçon récompensée par jour : ce crédit se réclame demain depuis la liste.',
  cap_reached: 'Vous avez atteint le maximum de crédits de formation.',
  already_rewarded: 'Cette leçon vous a déjà rapporté son crédit.',
  retry_later: 'Vous pourrez retenter ce quiz demain.',
};

/**
 * Le texte d'une leçon, en blocs : un paragraphe par ligne vide, un
 * sous-titre quand la ligne commence par ##, une puce quand elle commence
 * par •.
 */
const renderBody = (body: string) =>
  body.split(/\n\s*\n/).map((block, i) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 1 && lines[0].startsWith('## ')) return <h3 key={i}>{lines[0].slice(3)}</h3>;
    if (lines.every(l => l.startsWith('• '))) {
      return <ul key={i}>{lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>;
    }
    return <p key={i}>{lines.join(' ')}</p>;
  });

export const Lesson = observer(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { learnStore } = appRootStore;
  const lessonId = (location.state as any)?.lessonId as string | undefined;
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<IQuizResult | null>(null);

  useEffect(() => {
    if (!lessonId) {
      navigate('/academy');
      return;
    }
    learnStore.open(lessonId);
  }, [learnStore, lessonId, navigate]);

  const lesson = learnStore.current;
  const p = lesson?.progress;
  const allAnswered = !!lesson && lesson.quiz.every((_, i) => answers[i] != null);
  const claimable = !!p && p.passed && p.rewarded === 0;

  const submit = async () => {
    if (!lesson) return;
    const res = await learnStore.submit(lesson.id, lesson.quiz.map((_, i) => answers[i] ?? -1));
    if (!res) return;
    setResult(res);
    if (res.rewarded > 0) ToastService.show(`+${res.rewarded} crédit de formation`, ToastService.SUCCESS);
  };

  const claim = async () => {
    if (!lesson) return;
    const r = await learnStore.claim(lesson.id);
    if (!r) return;
    if (r.rewarded > 0) {
      ToastService.show(`+${r.rewarded} crédit de formation`, ToastService.SUCCESS);
      await learnStore.open(lesson.id);
    } else if (r.reason) {
      ToastService.show(REASONS[r.reason] ?? r.reason, ToastService.ERROR);
    }
  };

  if (!lesson) return <div className="stack"><p className="mk-note">Chargement…</p></div>;

  return (
    <div className="stack ln-lesson">
      <span className="ln-lesson__track">{lesson.track || 'Formation'}</span>
      <h1 className="screen-title" style={{ marginTop: 0 }}>{lesson.title}</h1>
      <p className="ln-lesson__summary">{lesson.summary}</p>

      {claimable && !result ? (
        <button type="button" className="ln-claim" onClick={claim}>
          <FontAwesomeIcon icon={faCoins} /> Réclamer mon crédit ({lesson.reward})
        </button>
      ) : null}

      <article className="ln-paper">{renderBody(lesson.body)}</article>

      <h2 className="ln-quiz__title">Quiz · {lesson.quiz.length} questions</h2>
      <p className="ln-quiz__hint">
        Réussite à 80 %. {p?.rewarded ? 'Cette leçon vous a déjà rapporté son crédit.' : `Réussir rapporte ${lesson.reward} crédit.`}
      </p>

      {lesson.quiz.map((q, i) => (
        <div className="ln-question" key={i}>
          <p className="ln-question__q">{i + 1}. {q.q}</p>
          {q.options.map((o, j) => (
            <button
              key={j}
              type="button"
              className={`ln-option${answers[i] === j ? ' is-on' : ''}`}
              disabled={!!result}
              onClick={() => setAnswers(a => { const n = [...a]; n[i] = j; return n; })}
            >
              <span className="ln-option__radio" /> {o}
            </button>
          ))}
        </div>
      ))}

      {result ? (
        <div className={`ln-result ${result.passed ? 'is-ok' : 'is-ko'}`}>
          <FontAwesomeIcon icon={result.passed ? faCheck : faXmark} />
          <div>
            <strong>{result.passed ? 'Quiz réussi' : 'Pas encore'} · {Math.round(result.score * 100)} %</strong>
            <p>
              {result.rewarded > 0
                ? `+${result.rewarded} crédit. Vous en avez ${result.credits}.`
                : result.reason
                  ? REASONS[result.reason] ?? result.reason
                  : 'Relisez la leçon : vous pourrez retenter demain.'}
            </p>
          </div>
        </div>
      ) : p?.retryAt ? (
        <div className="ln-result is-ko"><p>{REASONS.retry_later}</p></div>
      ) : (
        <button type="button" className="ln-submit" onClick={submit} disabled={!allAnswered || learnStore.busy}>
          {allAnswered ? 'Valider mes réponses' : `Répondez aux ${lesson.quiz.length} questions`}
        </button>
      )}

      <button type="button" className="ln-back" onClick={() => navigate('/academy')}>← Toutes les leçons</button>
    </div>
  );
});
