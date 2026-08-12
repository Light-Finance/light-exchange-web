import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { AuthLayout } from './AuthLayout';
import { Password, TextLink } from './components';

/** Three-step reset, driven by authStore.currentStep exactly as on mobile. */
export const ForgotPassword = observer(() => {
  const navigate = useNavigate();
  const { authStore } = appRootStore;
  const { user, currentStep, ressetPasswordSteps } = authStore;

  const submit = () => {
    if (currentStep === ressetPasswordSteps.initialization) return authStore.getCode();
    if (currentStep === ressetPasswordSteps.resetPassword) return authStore.verifyCodeResset();
    return authStore.resetPassword();
  };

  return (
    <AuthLayout>
      <form
        // yup (via checkForm in the stores) is the single validation authority, as on
        // mobile. Native constraint bubbles would pre-empt it and are English-only.
        noValidate
        className="auth__form"
        onSubmit={e => {
          e.preventDefault();
          submit();
        }}
      >
        {currentStep === ressetPasswordSteps.initialization ? (
          <>
            <Input
              type="email"
              autoComplete="email"
              placeholder={translate('signIn.emailPhTxt')}
              value={user?.email ?? ''}
              onChange={e => authStore.setUserData(e.target.value, 'email')}
            />
            <Button type="submit" block>
              {translate('resetPassword.verificationCodeBtn')}
            </Button>
          </>
        ) : currentStep === ressetPasswordSteps.resetPassword ? (
          <>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={translate('resetPassword.codeTxt')}
              value={user?.code ?? ''}
              onChange={e => authStore.setUserData(e.target.value, 'code')}
            />
            <Button type="submit" block>
              {translate('resetPassword.verifyCodeTxt')}
            </Button>
            <Button
              type="button"
              block
              variant="secondary"
              onClick={() => authStore.emailGetCode(user?.email!)}
            >
              {translate('emailConfirmation.resendCodeBtn')}
            </Button>
          </>
        ) : (
          <>
            <Password
              placeholder={translate('resetPassword.newPasswordTxt')}
              value={user?.password}
              onChange={value => authStore.setUserData(value, 'password')}
            />
            <Button type="submit" block>
              {translate('resetPassword.resetBtn')}
            </Button>
          </>
        )}
      </form>

      <TextLink onClick={() => navigate('/signin')}>{translate('signIn.logInBtn')}</TextLink>
      <TextLink onClick={() => navigate('/signup')}>{translate('signIn.signUpBtn')}</TextLink>
    </AuthLayout>
  );
});
