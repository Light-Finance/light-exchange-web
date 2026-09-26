import { useEffect, useState } from 'react';
import gql from 'graphql-tag';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWhatsapp,
  faTelegram,
  faFacebook,
  faYoutube,
  faTiktok,
  faXTwitter,
  faInstagram,
} from '@fortawesome/free-brands-svg-icons';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { Service } from '../services/service.service';
import { translate } from '../helpers/localization';
import './socialLinks.css';

// Les liens viennent du dashboard : un groupe change d'adresse, une chaine
// s'ajoute, et republier le site a chaque fois n'est pas tenable.
const SOCIAL_LINKS = gql`
  query socialLinks {
    socialLinks {
      id
      label
      url
      icon
    }
  }
`;

interface ILink {
  id: string;
  label: string;
  url: string;
  icon: string;
}

const ICONS: Record<string, any> = {
  whatsapp: faWhatsapp,
  telegram: faTelegram,
  facebook: faFacebook,
  youtube: faYoutube,
  tiktok: faTiktok,
  twitter: faXTwitter,
  instagram: faInstagram,
};

/** Un nom d'icone inconnu retombe sur un maillon plutot que sur un vide. */
const iconOf = (name: string) => ICONS[(name || '').toLowerCase()] ?? faLink;

export const SocialLinks = ({ compact = false }: { compact?: boolean }) => {
  const [links, setLinks] = useState<ILink[]>([]);

  useEffect(() => {
    let alive = true;
    Service.query({}, SOCIAL_LINKS, false).then((r: any) => {
      if (alive && r?.data?.socialLinks) setLinks(r.data.socialLinks);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Tant qu'aucun lien n'est publie, la section disparait plutot que de
  // laisser un titre au-dessus du vide.
  if (links.length === 0) return null;

  return (
    <section className={`soc${compact ? ' soc--compact' : ''}`}>
      {/* Epinglee au-dessus de la conversation, la barre n'a pas besoin de son
          titre : les puces se lisent seules, et le titre prendrait la place du
          premier message. */}
      {compact ? null : <h2 className="soc__title">{translate('social.title')}</h2>}
      <div className="soc__row">
        {links.map(l => (
          <a
            key={l.id}
            className="soc__link"
            href={l.url}
            target="_blank"
            rel="noreferrer"
          >
            <FontAwesomeIcon icon={iconOf(l.icon)} />
            <span>{l.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
};
