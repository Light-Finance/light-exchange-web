import { useNavigate } from 'react-router-dom';
import lightexchange from 'light-exchange';
import { APP } from '../../consts/app';
import { translate } from '../../helpers/localization';
import { Button } from '../../components/ui/Button';
import logo from '../../assets/imgs/logo.png';
import './auth.css';

export const Welcome = () => {
  const navigate = useNavigate();
  return (
    <div className="auth">
      <div className="auth__panel">
        <img className="welcome__logo" src={logo} alt="" />
        <h1 className="welcome__title">{lightexchange.app.INFO.APP_NAME}</h1>
        <p className="welcome__text">{translate('welcome.welcomeTxt')}</p>
        <Button block onClick={() => navigate('/signin')}>
          {translate('signIn.logInBtn')}
        </Button>
        <Button block variant="secondary" onClick={() => navigate('/signup')}>
          {translate('signIn.signUpBtn')}
        </Button>
        <p className="auth__footer">
          {lightexchange.app.INFO.COPYRIGHT} {APP.INFO.APP_VERSION}
        </p>
      </div>
    </div>
  );
};
