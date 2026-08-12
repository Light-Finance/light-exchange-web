import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareNodes } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { ToastService } from '../../services/toast.service';
import { Modal } from '../../components/ui/Modal';
import type { IUser } from '../../models';
import './profil.css';

const GREEN = '#1D9E75';
const RED = '#C0392B';

export const AffiliateProgram = observer(() => {
  const { authStore } = appRootStore;
  const [group, setGroup] = useState<'verified' | 'unverified' | null>(null);

  useEffect(() => {
    (async () => {
      await authStore.getCheckRefererBy();
      await authStore.getReferralsByCode();
    })();
  }, [authStore]);

  const referalCode = authStore.user?.referalCode ?? '';
  const referrals: IUser[] = authStore.referralUsers || [];
  const verified = referrals.filter(u => u.idVerified);
  const unverified = referrals.filter(u => !u.idVerified);
  const list = group === 'verified' ? verified : group === 'unverified' ? unverified : [];

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(referalCode);
      ToastService.show(translate('affiliateProgram.toastTxt'));
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="stack aff">
      <h1 className="screen-title">{translate('profil.affiliateBtn') || 'Affiliation'}</h1>

      <button type="button" className="aff-code" onClick={copyCode}>
        {referalCode}
      </button>
      <p className="aff-text">{translate('affiliateProgram.codeRecommendation')}</p>
      <p className="aff-text aff-text--bold">{translate('affiliateProgram.affiliationJoin')}</p>
      <p className="aff-text aff-text--bold">{translate('affiliateProgram.recommendationTxt')}</p>

      <button type="button" className="aff-share" onClick={() => authStore.share()}>
        <FontAwesomeIcon icon={faShareNodes} />
        {translate('affiliateProgram.shareBtn')}
      </button>

      <p className="aff-title">
        {translate('affiliateProgram.codeUsed')} {referrals.length}
      </p>

      <div className="aff-kycrow">
        <button type="button" className="aff-kyc" onClick={() => setGroup('verified')}>
          <span className="aff-kycnum" style={{ color: GREEN }}>
            {verified.length}
          </span>
          <span className="aff-kyclabel">{translate('affiliateProgram.kycDone')}</span>
          <span className="aff-kychint">{translate('affiliateProgram.tapToSee')}</span>
        </button>
        <button type="button" className="aff-kyc" onClick={() => setGroup('unverified')}>
          <span className="aff-kycnum" style={{ color: RED }}>
            {unverified.length}
          </span>
          <span className="aff-kyclabel">{translate('affiliateProgram.kycNot')}</span>
          <span className="aff-kychint">{translate('affiliateProgram.tapToSee')}</span>
        </button>
      </div>

      {group ? (
        <Modal onClose={() => setGroup(null)}>
          <div className="stack">
            <h2>
              {group === 'verified'
                ? translate('affiliateProgram.kycDone')
                : translate('affiliateProgram.kycNot')}{' '}
              ({list.length})
            </h2>
            <div className="aff-emaillist">
              {list.length ? (
                list.map((u, i) => (
                  <div className="aff-emailrow" key={u.id || String(i)}>
                    <div>{u.email}</div>
                    {u.name ? <div className="muted">{u.name}</div> : null}
                  </div>
                ))
              ) : (
                <p className="muted">{translate('affiliateProgram.noReferrals')}</p>
              )}
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
});
