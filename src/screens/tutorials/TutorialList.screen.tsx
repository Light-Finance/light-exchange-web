import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import './tutorials.css';

const getYoutubeId = (url: string): string | null => {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
};

export const TutorialList = observer(({ publicView = false }: { publicView?: boolean }) => {
  const navigate = useNavigate();
  const { tutorialStore } = appRootStore;
  const { tutorials, isLoading } = tutorialStore;

  const detailBase = publicView ? '/welcome/tutorials/detail' : '/tutorials/detail';

  useEffect(() => {
    tutorialStore.tutorialList();
  }, [tutorialStore]);

  return (
    <div className="stack">
      <div className="tut-header">
        <div className="tut-header-left">
          {publicView && (
            <button type="button" className="tut-back" onClick={() => navigate('/welcome')}>
              ←
            </button>
          )}
          <h1 className="screen-title" style={{ margin: 0 }}>Tutoriels</h1>
        </div>
        <button type="button" className="tut-refresh" onClick={() => tutorialStore.tutorialList()}>
          <FontAwesomeIcon icon={faSync} />
        </button>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <span className="btn__spinner" style={{ color: 'var(--color-secondary)' }} />
        </div>
      ) : tutorials.length ? (
        <div className="tut-grid">
          {tutorials.map(item => {
            const videoId = getYoutubeId(item.youtubeUrl);
            const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
            return (
              <button
                type="button"
                className="tut-card"
                key={item.id}
                onClick={() => navigate(`${detailBase}?id=${encodeURIComponent(item.id)}`)}
              >
                <div className="tut-thumb">
                  {thumb ? <img src={thumb} alt={item.title} /> : <span className="muted">No preview</span>}
                  <span className="tut-play">▶</span>
                </div>
                <div className="tut-cardtitle">{item.title}</div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card empty-state">Aucun tutoriel disponible pour le moment.</div>
      )}
    </div>
  );
});
