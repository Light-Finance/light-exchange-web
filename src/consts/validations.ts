import * as yup from 'yup';
import { ToastService } from '../services/toast.service';
import { translate } from '../helpers/localization';
import lightexchange from 'light-exchange';
const PASSWORD_LENGHT = 5;
const NAME_LENGHT = 2;
export let checkForm = async values => {
  if (values.name != undefined) {
    if ((await nameValidation(values.name)) === false) {
      return false;
    }
  }
  if (values.email != undefined) {
    if ((await emailValidation(values.email)) === false) {
      return false;
    }
  }
  if (values.spend != undefined) {
    if ((await spendValidation(values.spend)) === false) {
      return false;
    }
  }
  if (values.password != undefined) {
    if ((await passwordValidation(values.password)) === false) {
      return false;
    }
  }
  if (values.amountToWithdraw != undefined) {
    if ((await amountToWithdrawValidation(values.amountToWithdraw)) === false) {
      return false;
    }
  }

  if (values.phone != undefined) {
    if (
      (await phoneValidation(values.phone, values.paymentMethodName)) === false
    ) {
      return false;
    }
  }
  if (values.numberOrWallet != undefined) {
    if (
      (await phoneValidation(
        values.numberOrWallet,
        values.paymentMethodName,
      )) === false
    ) {
      return false;
    }
  }

  if (values.wallet != undefined) {
    if ((await walletValidation(values.wallet)) === false) {
      return false;
    }
  }
  if (values.code != undefined) {
    if ((await codeValidation(values.code)) === false) {
      return false;
    }
  }
  if (values.value1 != undefined && values.value2 != undefined) {
    if (
      (await walletBalanceValidation(values.value1, values.value2)) === false
    ) {
      return false;
    }
  }
  return true;
};
export let walletBalanceValidation = (value1, value2) => {
  if (isNaN(value2) || value1 < value2) {
    ToastService.show(
      translate('fiatWitdraw.amountErrorMsg'),
      ToastService.ERROR,
    );
    return false;
  }
  true;
};

export let nameValidation = async name => {
  const result = await yup.string().min(NAME_LENGHT).isValid(name);
  if (result) {
    return true;
  } else {
    ToastService.show(
      translate('errorMessages.nameValidation'),
      ToastService.ERROR,
    );
    return false;
  }
};
export let emailValidation = async mail => {
  const result = await yup.string().email().required().isValid(mail);
  if (result) {
    return true;
  } else {
    ToastService.show(
      translate('errorMessages.emailValidation'),
      ToastService.ERROR,
    );
    return false;
  }
};
export let passwordValidation = async password => {
  const result = await yup.string().min(PASSWORD_LENGHT).isValid(password);

  if (result) {
    return true;
  } else {
    ToastService.show(
      translate('errorMessages.passWordValidation'),
      ToastService.ERROR,
    );
    return false;
  }
};
export let spendValidation = async spend => {
  const result = await yup
    .number()
    .moreThan(0)
    .max(lightexchange.app.WALLET.LF.UPPER_LIMIT)
    .required(translate('errorMessages.spendValidation'))
    .isValid(spend);
  if (result) {
    return true;
  } else {
    ToastService.show(
      translate('errorMessages.spendValidation'),
      ToastService.ERROR,
    );
    return false;
  }
};
export let amountToWithdrawValidation = async spend => {
  const result = await yup
    .number()
    .min(lightexchange.app.WALLET.LF.LOWER_LIMIT - 1)
    .max(lightexchange.app.WALLET.LF.UPPER_LIMIT)
    .required(translate('errorMessages.amountToWithdrawValidation'))
    .isValid(spend);
  if (result) {
    return true;
  } else {
    ToastService.show(
      translate('errorMessages.amountToWithdrawValidation'),
      ToastService.ERROR,
    );
    return false;
  }
};
export let phoneValidation = async (phone, paymentMethodName) => {
  const result = await yup
    .string()
    .matches(/(6)(\d){8}\b/)
    .isValid(phone);
  if (!paymentMethodName) {
    ToastService.show(
      translate('errorMessages.phoneValidation'),
      ToastService.ERROR,
    );
    return result;
  }
  /* check if it's orange with mtn number */
  if (
    paymentMethodName[0] === 'O' &&
    (phone[1] == '7' ||
      (parseFloat(`${phone[1]}${phone[2]}`) <= 85 &&
        parseFloat(`${phone[1]}${phone[2]}`) >= 80) ||
      (parseFloat(`${phone[1]}${phone[2]}`) <= 54 &&
        parseFloat(`${phone[1]}${phone[2]}`) >= 50))
  ) {
    ToastService.show(
      translate('errorMessages.phoneValidationPaymentMethodOrange'),
      ToastService.ERROR,
    );
    return false;
  }
  /* check if it's mtn with orange number */
  if (
    paymentMethodName[0] === 'M' &&
    (phone[1] == '9' ||
      (parseFloat(`${phone[1]}${phone[2]}`) > 54 &&
        parseFloat(`${phone[1]}${phone[2]}`) < 60) ||
      parseFloat(`${phone[1]}${phone[2]}`) == 86 ||
      parseFloat(`${phone[1]}${phone[2]}${phone[3]}`) == 875)
  ) {
    ToastService.show(
      translate('errorMessages.phoneValidationPaymentMethodMtn'),
      ToastService.ERROR,
    );
    return false;
  }
  if (result) {
    return true;
  } else {
    ToastService.show(
      translate('errorMessages.phoneValidation'),
      ToastService.ERROR,
    );
    return false;
  }
};
export let codeValidation = async code => {
  const result = await yup
    .string()
    .min(6)
    .required(translate('errorMessages.codeValidation'))
    .isValid(code);

  if (result) {
    return true;
  } else {
    ToastService.show(
      translate('errorMessages.codeValidation'),
      ToastService.ERROR,
    );
    return false;
  }
};
export let walletValidation = async wallet => {
  const result = await yup
    .string()
    .min(20)
    .required(translate('errorMessages.walletValidation'))
    .isValid(wallet);

  if (result) {
    return true;
  } else {
    ToastService.show(
      translate('errorMessages.walletValidation'),
      ToastService.ERROR,
    );
    return false;
  }
};
