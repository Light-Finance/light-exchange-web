import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { AuthLayout } from './AuthLayout';
import { Password, TextLink, GoogleButton } from './components';

export const SignIn = observer(() => {
  const navigate = useNavigate();
  const { authStore } = appRootStore;
  const { user } = authStore;

  return (
    <AuthLayout>
      <form
        // yup (via checkForm in the stores) is the single validation authority, as on
        // mobile. Native constraint bubbles would pre-empt it and are English-only.
        noValidate
        className="auth__form"
        onSubmit={e => {
          e.preventDefault();
          authStore.signIn();
        }}
      >
        <Input
          type="email"
          autoComplete="email"
          placeholder={translate('signIn.emailPhTxt')}
          value={user?.email ?? ''}
          onChange={e => authStore.setUserData(e.target.value, 'email')}
        />
        <Password
          value={user?.password}
          onChange={value => authStore.setUserData(value, 'password')}
        />
        <TextLink onClick={() => navigate('/forgot-password')}>
          {translate('signIn.forgetPassBtn')}
        </TextLink>
        <Button type="submit" block>
          {translate('signIn.logInBtn')}
        </Button>
      </form>
      <GoogleButton>{translate('googleButton.logInGoogleBtn')}</GoogleButton>
      <TextLink onClick={() => navigate('/signup')}>{translate('signIn.signUpBtn')}</TextLink>
    </AuthLayout>
  );
});
