import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { appRootStore } from '../../stores/root.store';
import './tutorials.css';

const getYoutubeId = (url: string): string | null => {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
};

export const TutorialDetail = observer(() => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { tutorialStore } = appRootStore;
  const id = params.get('id');

  // The list is the usual entry point, but a deep link (or refresh) lands here
  // with an empty store — fetch so the lookup below can resolve.
  useEffect(() => {
    if (!tutorialStore.tutorials.length) tutorialStore.tutorialList();
  }, [tutorialStore]);

  const tutorial = tutorialStore.tutorials.find(t => String(t.id) === String(id));
  const videoId = tutorial ? getYoutubeId(tutorial.youtubeUrl) : null;

  return (
    <div className="stack">
      <button type="button" className="tut-back" onClick={() => navigate(-1)}>
        ← {tutorial?.title ?? 'Tutoriel'}
      </button>

      {videoId ? (
        <div className="tut-player">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={tutorial?.title ?? 'Tutorial'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="card empty-state">Vidéo indisponible.</div>
      )}

      {tutorial?.description ? <p className="tut-desc">{tutorial.description}</p> : null}
    </div>
  );
});
