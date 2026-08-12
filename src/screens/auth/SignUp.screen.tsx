import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { AuthLayout } from './AuthLayout';
import { Password, TextLink, GoogleButton } from './components';
import lightexchange from 'light-exchange';

export const SignUp = observer(() => {
  const navigate = useNavigate();
  const [termsVisible, setTermsVisible] = useState(false);
  const { authStore } = appRootStore;
  const { user } = authStore;

  return (
    <AuthLayout>
      <TextLink onClick={() => setTermsVisible(true)}>{translate('signUp.conditionTxt')}</TextLink>

      {termsVisible ? (
        <Modal onClose={() => setTermsVisible(false)} label={translate('signUp.conditionTxt')}>
          {/* Mobile renders the hosted terms in a WebView; the browser can just
              link out to the same page. */}
          <p className="stack">{translate('signUp.conditionTxt')}</p>
          <a
            href={`https://${lightexchange.app.INFO.WEB_SITE ?? 'lightexchange.io'}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {lightexchange.app.INFO.WEB_SITE ?? 'lightexchange.io'}
          </a>
        </Modal>
      ) : null}

      <form
        // yup (via checkForm in the stores) is the single validation authority, as on
        // mobile. Native constraint bubbles would pre-empt it and are English-only.
        noValidate
        className="auth__form"
        onSubmit={e => {
          e.preventDefault();
          authStore.signUp();
        }}
      >
        <Input
          type="email"
          autoComplete="email"
          placeholder={translate('signUp.emailPhTxt')}
          value={user?.email ?? ''}
          onChange={e => authStore.setUserData(e.target.value, 'email')}
        />
        <Password
          value={user?.password}
          onChange={value => authStore.setUserData(value, 'password')}
        />
        <Input
          placeholder={translate('signUp.referalCodeTxt')}
          value={user?.refererBy ?? ''}
          onChange={e => authStore.setUserData(e.target.value, 'refererBy')}
        />
        <Button type="submit" block>
          {translate('signUp.signUpBtn')}
        </Button>
      </form>

      <GoogleButton>{translate('googleButton.signUpGoogleBtn')}</GoogleButton>
      <TextLink onClick={() => navigate('/signin')}>{translate('signIn.logInBtn')}</TextLink>
    </AuthLayout>
  );
});
