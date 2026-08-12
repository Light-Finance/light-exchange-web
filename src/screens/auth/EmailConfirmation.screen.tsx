import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { AuthLayout } from './AuthLayout';

export const EmailConfirmation = observer(() => {
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
          authStore.emailConfirmation();
        }}
      >
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={translate('emailConfirmation.codeTxt')}
          value={user?.code ?? ''}
          onChange={e => authStore.setUserData(e.target.value, 'code')}
        />
        <Button type="submit" block>
          {translate('emailConfirmation.verifyCodeTxt')}
        </Button>
      </form>
      <Button block variant="secondary" onClick={() => authStore.emailGetCode(user?.email!)}>
        {translate('emailConfirmation.resendCodeBtn')}
      </Button>
    </AuthLayout>
  );
});
