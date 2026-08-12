import lightexchange from 'light-exchange';
import { THEME } from '../assets/style/theme.style';
export const getColorByType = type => {
  if (type === lightexchange.app.TRANSACTION.TYPE.convert) {
    return THEME.COLOR.secondaryColorDark;
  }
  if (type === lightexchange.app.TRANSACTION.TYPE.rechargeCrypto) {
    return 'blue';
  }
  if (type === lightexchange.app.TRANSACTION.TYPE.buy) {
    return 'green';
  }
  if (type === lightexchange.app.TRANSACTION.TYPE.sell) {
    return 'red';
  }
  if (type === lightexchange.app.TRANSACTION.TYPE.withdrawalCrypto) {
    return 'black';
  }
  if (type === lightexchange.app.TRANSACTION.TYPE.transfer) {
    return THEME.COLOR.secondaryColor;
  }
};
