export const ROUTES = {
  authNavigation: {
    navigator: 'authNavigation',
    welcomeScreen: 'Home',
    signIn: 'signIn',
    signUp: 'signUp',
    forgotPassword: 'forgotPassword',
    emailConfirmation: 'emailConfirmation',
    splash: 'splash',
  },
  mainNavigation: {
    navigator: 'mainNavigation',
    tabNavigation: {
      navigator: 'tabNavigation',
      // The mobile ROUTES has no `tradeNavigation` entry, so its trading store
      // reads `.tradingTradeCrypto` off undefined and throws. Defined here so
      // the buy/sell entry points resolve instead of crashing.
      tradeNavigation: {
        navigator: 'Trading',
        tradingTradeCrypto: 'tradingTradeCrypto',
      },
      aiTradingNavigation: {
        navigator: 'Ai Trading',
        aiTrading: 'aiTrading',
        runningBots: 'runningBots',
        orders: 'orders',
        history: 'history',
        myTeam: 'myTeam',
        analysis: 'analysis',
      },
      spinNavigation: {
        navigator: 'Spin & Win',
        spin: 'spin',
      },
      tutorialsNavigation: {
        navigator: 'Tutoriels',
        tutorialList: 'tutorialList',
        tutorialDetail: 'tutorialDetail',
      },
      walletNavigation: {
        navigator: 'Wallet',
        walletHistory: 'walletHistory',
        walletHome: 'walletHome',
        walletConvert: 'walletConvert',
        walletDeposit: 'walletDeposit',
        walletTransfer: 'walletTransfer',
        walletWithdraw: 'walletWithdraw',
        paymentMethod: 'paymentMethod',
        sendWorldwide: 'sendWorldwide',
      },
    },
    profilNavigation: {
      navigator: 'profilNavigation',
      profil: 'Profil',
      notification: 'Notification',
      affiliateProgram: 'Affiliation',
      lfcMerchant: 'lfcMerchant',
      userNumber: 'userNumber',
      tutorials: 'tutorials',
    },
  },
};
