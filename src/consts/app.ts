import { VersionCheck } from '../platform/device';
import lightexchange from 'light-exchange';
export const APP = {
  INFO: {
    APP_VERSION: `v${VersionCheck.getCurrentVersion()}`,
    WHATSAPP_PLAYSTORE: 'market://details?id=com.whatsapp',
    WEB_CLIENT_ID:
      '70493634022-n0bddfjqri3941u8d1p4dmq7to6t5seh.apps.googleusercontent.com',
    WEB_SITE: 'lightexchange.io',
    PLAYSTORE_LINK:
      'https://play.google.com/store/apps/details?id=com.lightexchangemobile&hl=en',
    TRADE_LINK: "whatsapp://send?text='Besoin de crypto'&phone=237694481723",
  },
  AUTH_STORE: {
    AUTH_STEPS: {
      initialization: 'initialization',
      referalCode: 'referalCode',
    },
    RESET_STEPS: {
      initialization: 'initialization',
      resetPassword: 'resetPassword',
      finalization: 'finalization',
    },
    USER: {
      id: '',
      email: '',
      emailConfirmation: false,
      connected: false,
      phone: '',
      password: '',
      name: '',
      refererBy: '',
      code: '',
      receivedCode: '0',
      referalCode: '',
      status: false,
      numberUpdatePhone: 0,
      numberUpdateName: 0,
      referals: 0,
      fcmToken: null,
      userNumbers: [],
      userNumber: { phone: '' },
      selectedUserNumber: { phone: '' },
      isEditingPhone: false,
      isEditingName: false,
      country: { id: '', name: '', phoneCode: '' },
    },
    MAX_USER_PROFILE_UPDATE: 2,
    COUNTRIES: [],
  },
  TRADE_STORE: {
    transaction: {
      spend: '',
      type: lightexchange.app.TRANSACTION.TYPE.recharge,
      receive: '',
      status: lightexchange.app.TRANSACTION.STATUS.initiated,
      fees: '0',
      walletIds: [],
      userIds: [],
      initiatorWallet: '',
    },
    transactionType: lightexchange.app.TRANSACTION.TYPE.all,
    recipient: {
      username: '',
      email: '',
      wallets: [],
    },
    paymentMethods: [{ name: 'Mtn' }],
    spend: 'spend',
    receive: 'receive',
    rate: {
      buyRate: 0,
      sellRate: 0,
      adminWallets: [{}, {}],
    },
  },
  WALLET_STORE: {
    fiatList: [],
    wallets: [],
    wallet: {
      crypto: {
        token: '',
        network: '',
        buyRate: 0,
        sellRate: 0,
        withdrawFees: 0,
      },
      balance: 0,
      fiat: {
        name: '',
      },
    },
  },
  EARN_STORE: {
    investments: [],
    investment: {},
    myInvestments: [],
  },
};
