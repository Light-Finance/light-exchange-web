import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { appRootStore } from './stores/root.store';
import { NavigationBridge } from './components/NavigationBridge';
import { Shell } from './components/Shell';
import { ModalHost } from './components/hosts/ModalHost';
import { ToastHost } from './components/hosts/ToastHost';
import { OverlaySpinner } from './components/hosts/OverlaySpinner';
import { Welcome } from './screens/auth/Welcome.screen';
import { SignIn } from './screens/auth/SignIn.screen';
import { SignUp } from './screens/auth/SignUp.screen';
import { ForgotPassword } from './screens/auth/ForgotPassword.screen';
import { EmailConfirmation } from './screens/auth/EmailConfirmation.screen';
import { Splash } from './screens/auth/Splash.screen';
import { WalletHome } from './screens/wallet/WalletHome.screen';
import { WalletHistory } from './screens/wallet/WalletHistory.screen';
import { WalletDeposit } from './screens/wallet/WalletDeposit.screen';
import { WalletWithdraw } from './screens/wallet/WalletWithdraw.screen';
import { WalletTransfer } from './screens/wallet/WalletTransfer.screen';
import { WalletConvert } from './screens/wallet/WalletConvert.screen';
import { PaymentMethod } from './screens/wallet/PaymentMethod.screen';
import { ManagedBot } from './screens/aiTrading/ManagedBot.screen';
import { RunningBots } from './screens/aiTrading/RunningBots.screen';
import { Orders } from './screens/aiTrading/Orders.screen';
import { MyTeam } from './screens/aiTrading/MyTeam.screen';
import { ManagedHistory } from './screens/aiTrading/ManagedHistory.screen';
import { SpinWheel } from './screens/aiTrading/SpinWheel.screen';
import { NotificationList } from './screens/notification/NotificationList.screen';
import { Profil } from './screens/profil/Profil.screen';
import { AffiliateProgram } from './screens/profil/AffiliateProgram.screen';
import { LfcMerchant } from './screens/profil/LfcMerchant.screen';
import { TutorialList } from './screens/tutorials/TutorialList.screen';
import { TutorialDetail } from './screens/tutorials/TutorialDetail.screen';
import { SendWorldwide } from './screens/wallet/SendWorldwide.screen';
import { ComingSoon } from './screens/ComingSoon.screen';

/** Routes that require a signed-in user; everything else bounces to /welcome. */
const Protected = observer(() => {
  if (!appRootStore.authStore.user?.connected) {
    return <Navigate to="/welcome" replace />;
  }
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
});

/** Auth screens redirect away once the user is signed in. */
const PublicOnly = observer(({ children }: { children: JSX.Element }) => {
  if (appRootStore.authStore.user?.connected) return <Navigate to="/wallet" replace />;
  return children;
});

export const App = observer(() => {
  // Wire up the store subscriptions the mobile app sets up on mount
  // (modal/spinner events, connectivity, FCM token sync).
  useEffect(() => {
    appRootStore.uxStore.subscribe();
    return () => appRootStore.uxStore.unSubscribe();
  }, []);

  return (
    <BrowserRouter>
      <NavigationBridge />
      <Routes>
        <Route path="/" element={<Splash />} />

        <Route path="/welcome" element={<PublicOnly><Welcome /></PublicOnly>} />
        <Route path="/signin" element={<PublicOnly><SignIn /></PublicOnly>} />
        <Route path="/signup" element={<PublicOnly><SignUp /></PublicOnly>} />
        <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
        {/* Reached mid-signup, before `connected` is set — not PublicOnly. */}
        <Route path="/email-confirmation" element={<EmailConfirmation />} />

        <Route element={<Protected />}>
          <Route path="/wallet" element={<WalletHome />} />
          <Route path="/wallet/history" element={<WalletHistory />} />
          <Route path="/wallet/deposit" element={<WalletDeposit />} />
          <Route path="/wallet/withdraw" element={<WalletWithdraw />} />
          <Route path="/wallet/transfer" element={<WalletTransfer />} />
          <Route path="/wallet/convert" element={<WalletConvert />} />
          <Route path="/wallet/payment-method" element={<PaymentMethod />} />

          <Route path="/ai-trading" element={<ManagedBot />} />
          <Route path="/ai-trading/running-bots" element={<RunningBots />} />
          <Route path="/ai-trading/orders" element={<Orders />} />
          <Route path="/ai-trading/my-team" element={<MyTeam />} />
          <Route path="/ai-trading/history" element={<ManagedHistory />} />

          {/* Ported in a later pass; routed now so the tabs and any store
              redirect land somewhere real instead of 404-ing. */}
          <Route path="/spin" element={<SpinWheel />} />
          <Route path="/trade" element={<ComingSoon titleKey="tradingTradeCrypto.titleTxt" />} />
          <Route path="/tutorials" element={<TutorialList />} />
          <Route path="/tutorials/detail" element={<TutorialDetail />} />
          <Route path="/notifications" element={<NotificationList />} />
          <Route path="/profile" element={<Profil />} />
          <Route path="/affiliate" element={<AffiliateProgram />} />
          <Route path="/lfc-merchant" element={<LfcMerchant />} />
          <Route path="/user-numbers" element={<ComingSoon titleKey="tabs.userNumbers" />} />
          <Route path="/wallet/send-worldwide" element={<SendWorldwide />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ModalHost />
      <ToastHost />
      <OverlaySpinner />
    </BrowserRouter>
  );
});
