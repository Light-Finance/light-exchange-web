import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faChevronRight,
  faEdit,
  faEnvelope,
  faFileContract,
  faFlag,
  faPhone,
  faPlayCircle,
  faPowerOff,
  faShareNodes,
  faShieldAlt,
  faStore,
  faIdCard,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import lightexchange from 'light-exchange';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { APP } from '../../consts/app';
import { API_BASE_URL } from '../../consts/api';
import { ToastService } from '../../services/toast.service';
import './profil.css';

const MAX_UPDATES = 2;
type IdType = 'front' | 'back' | 'selfie';

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

export const Profil = observer(() => {
  const navigate = useNavigate();
  const { authStore } = appRootStore;
  const user = authStore.user;

  useEffect(() => {
    authStore.countryList();
  }, [authStore]);

  const shareApp = async () => {
    const referalCode = user?.referalCode ?? '';
    const text = `${APP.INFO.PLAYSTORE_LINK}\n${translate('profil.shareReferralCode')} ${referalCode}`;
    try {
      await navigator.clipboard.writeText(text);
      ToastService.show(translate('profil.shareCopied'), ToastService.SUCCESS);
    } catch {
      /* clipboard blocked */
    }
  };

  const verified = !!user?.idVerified;
  const pending = !verified && !!user?.idVerificationRequested;

  return (
    <div className="stack profil">
      <h1 className="screen-title">{translate('profil.profil') || 'Profil'}</h1>

      {/* Identity */}
      <div className="card profil-card">
        <div className="profil-identity">
          <div className="profil-avatar">
            <FontAwesomeIcon icon={faUser} />
          </div>
          <div className="profil-identity__body">
            <NameField />
            <div className="profil-email">{user?.email}</div>
            <span className={`profil-pill profil-pill--${verified ? 'ok' : pending ? 'pending' : 'off'}`}>
              <FontAwesomeIcon icon={verified ? faShieldAlt : faIdCard} />
              {verified
                ? translate('profil.idVerified')
                : pending
                  ? translate('profil.idPending')
                  : translate('profil.idNotVerified')}
            </span>
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="profil-section">{translate('profil.sectionAccount')}</div>
      <div className="card profil-card">
        <DetailRow icon={faFlag} label={translate('profil.labelCountry')}>
          <CountrySelect />
        </DetailRow>
        <DetailRow icon={faPhone} label={translate('profil.labelPhone')}>
          <PhoneField />
        </DetailRow>
        <DetailRow icon={faEnvelope} label={translate('profil.labelEmail')} last>
          <span className="profil-value">{user?.email}</span>
        </DetailRow>
      </div>

      {/* ID verification */}
      <IdVerification />

      {/* Menu */}
      <div className="profil-section">{translate('profil.sectionMore')}</div>
      <div className="card profil-card">
        <MenuRow icon={faShareNodes} label={translate('profil.affiliateBtn')} onClick={() => navigate('/affiliate')} />
        <MenuRow icon={faStore} label={translate('profil.merchantBtn')} onClick={() => navigate('/lfc-merchant')} />
        <MenuRow icon={faPlayCircle} label={translate('profil.tutorialsBtn')} onClick={() => navigate('/tutorials')} />
        <MenuRow icon={faShareNodes} label={translate('profil.shareBtn')} onClick={shareApp} />
        <MenuRow
          icon={faFileContract}
          label={translate('profil.termsBtn')}
          onClick={() => window.open(`https://${APP.INFO.WEB_SITE}`, '_blank', 'noopener')}
          last
        />
      </div>

      <button type="button" className="profil-signout" onClick={() => authStore.signOut()}>
        <FontAwesomeIcon icon={faPowerOff} />
        {translate('profil.signOutBtn')}
      </button>

      <div className="profil-version">
        {lightexchange.app.INFO.COPYRIGHT} {APP.INFO.APP_VERSION}
      </div>
    </div>
  );
});

const NameField = observer(() => {
  const { authStore } = appRootStore;
  const user = authStore.user;
  if (user?.isEditingName) {
    return (
      <div className="profil-editrow">
        <input
          autoFocus
          className="profil-nameinput"
          value={user.name ?? ''}
          onChange={e => authStore.setUserData(e.target.value, 'name')}
        />
        <button type="button" className="profil-iconbtn" onClick={() => authStore.userNameUpdate()}>
          <FontAwesomeIcon icon={faCheck} style={{ color: 'var(--color-green, #1D9E75)' }} />
        </button>
      </div>
    );
  }
  const locked = (user?.numberUpdateName ?? 0) >= MAX_UPDATES;
  return (
    <div className="profil-editrow">
      <span className="profil-name">{user?.name || translate('profil.nameTxt')}</span>
      {!locked ? (
        <button type="button" className="profil-iconbtn" onClick={() => authStore.setUserData(true, 'isEditingName')}>
          <FontAwesomeIcon icon={faEdit} style={{ color: 'var(--color-secondary)' }} />
        </button>
      ) : null}
    </div>
  );
});

const PhoneField = observer(() => {
  const { authStore } = appRootStore;
  const user = authStore.user;
  if (user?.isEditingPhone) {
    return (
      <div className="profil-editrow">
        <input
          autoFocus
          className="profil-valueinput"
          inputMode="tel"
          value={user.phone ?? ''}
          onChange={e => authStore.setUserData(e.target.value, 'phone')}
        />
        <button type="button" className="profil-iconbtn" onClick={() => authStore.userPhoneUpdate()}>
          <FontAwesomeIcon icon={faCheck} style={{ color: 'var(--color-green, #1D9E75)' }} />
        </button>
      </div>
    );
  }
  const locked = (user?.numberUpdatePhone ?? 0) >= MAX_UPDATES;
  return (
    <div className="profil-editrow">
      <span className="profil-value">{user?.phone || translate('profil.phoneTxt')}</span>
      {!locked ? (
        <button type="button" className="profil-iconbtn" onClick={() => authStore.setUserData(true, 'isEditingPhone')}>
          <FontAwesomeIcon icon={faEdit} style={{ color: 'var(--color-secondary)' }} />
        </button>
      ) : null}
    </div>
  );
});

const CountrySelect = observer(() => {
  const { authStore } = appRootStore;
  const user = authStore.user;
  const countries = (authStore.countries || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const locked = (user?.countryUpdateCount ?? 0) >= 2;

  if (locked) {
    return (
      <span className="profil-value">
        {user?.country?.name ?? ''} ({user?.country?.phoneCode ?? ''})
      </span>
    );
  }
  return (
    <select
      className="profil-select"
      value={user?.country?.id ?? ''}
      onChange={e => {
        const id = e.target.value;
        if (id && String(id) !== String(user?.country?.id)) authStore.userUpdateCountry(id);
      }}
    >
      {countries.map(c => (
        <option key={String(c.id)} value={c.id}>
          {c.name} ({c.phoneCode})
        </option>
      ))}
    </select>
  );
});

const IdVerification = observer(() => {
  const { authStore } = appRootStore;
  const user = authStore.user;
  if (user?.idVerified) return null;

  if (user?.idVerificationRequested) {
    return (
      <div className="card profil-card">
        <div className="profil-cardtitle">{translate('profil.idVerification')}</div>
        <p className="muted">{translate('profil.idPending')}</p>
        <button type="button" className="profil-secondarybtn" onClick={() => authStore.refreshVerificationStatus()}>
          {translate('profil.idRefreshStatus')}
        </button>
      </div>
    );
  }

  const allUploaded = !!(user?.idFrontUrl && user?.idBackUrl && user?.idSelfieUrl);
  return (
    <div className="card profil-card">
      <div className="profil-cardtitle">{translate('profil.idVerification')}</div>
      <p className="muted">{translate('profil.idAccepted')}</p>
      <div className="profil-idslots">
        <IdSlot type="front" url={user?.idFrontUrl} />
        <IdSlot type="back" url={user?.idBackUrl} />
        <IdSlot type="selfie" url={user?.idSelfieUrl} />
      </div>
      {allUploaded ? (
        <button type="button" className="profil-primarybtn" onClick={() => authStore.userRequestIdVerification()}>
          {translate('profil.idRequestVerification')}
        </button>
      ) : null}
    </div>
  );
});

const IdSlot = observer(({ type, url }: { type: IdType; url?: string }) => {
  const { authStore } = appRootStore;
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const resolved = url ? (url.startsWith('http') ? url : `${API_BASE_URL}${url}`) : null;

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const base64 = await readFileBase64(file);
      await authStore.userUploadIdDocument(type, base64);
    } catch {
      ToastService.show('Upload failed', ToastService.ERROR);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="profil-idslot">
      <button type="button" className="profil-idthumb" onClick={() => inputRef.current?.click()}>
        {busy ? (
          <span className="btn__spinner" style={{ color: 'var(--color-secondary)' }} />
        ) : resolved ? (
          <img src={resolved} alt={type} />
        ) : (
          <span className="profil-idplus">+</span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={e => onFile(e.target.files?.[0])}
      />
      <span className="profil-idlabel">{translate(`profil.id_${type}`)}</span>
    </div>
  );
});

function DetailRow({
  icon,
  label,
  children,
  last,
}: {
  icon: IconDefinition;
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`profil-detailrow ${last ? 'is-last' : ''}`}>
      <div className="profil-detailicon">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="profil-detailbody">
        <div className="profil-detaillabel">{label}</div>
        {children}
      </div>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
  last,
}: {
  icon: IconDefinition;
  label: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button type="button" className={`profil-menurow ${last ? 'is-last' : ''}`} onClick={onClick}>
      <div className="profil-menuicon">
        <FontAwesomeIcon icon={icon} />
      </div>
      <span className="profil-menulabel">{label}</span>
      <FontAwesomeIcon icon={faChevronRight} className="profil-chevron" />
    </button>
  );
}
