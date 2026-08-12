import { action, makeAutoObservable, observable } from 'mobx';
import { ICountry, IUser } from '../models';
import {
  makePersistable,
  clearPersistedStore,
  isHydrated,
  hydrateStore,
  PersistStoreMap,
} from 'mobx-persist-store';
import { RootStore } from './root.store';
import lightexchange from 'light-exchange';
import { REFERRALS_BY_CODE } from '../consts/localQueries';
import { ToastService } from '../services/toast.service';
import { navigate, replace } from '../navigations/app.navigation';
import { ROUTES } from '../consts/routes';
import { checkForm } from '../consts/validations';
import { Service } from '../services/service.service';
import { APP } from '../consts/app';
import { Share } from '../platform/share';
import { Linking } from '../platform/linking';
import { GoogleSignin } from '../platform/google';
import { translate } from '../helpers/localization';
import { messaging } from '../platform/device';
import AsyncStorage from '../platform/storage';

export class AuthStore {
  /* variables definition */
  @observable user: IUser | undefined;
  @observable rootStore: RootStore | undefined;
  @observable ressetPasswordSteps: any;
  @observable authSteps: any;
  @observable currentStep: string | undefined;
  @observable countries: ICountry[] | undefined;
  @observable referralUsers: IUser[] = []; // filleuls (avec statut KYC idVerified)
  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.setInitialState();
    makeAutoObservable(this);
    if (
      !Array.from(PersistStoreMap.values())
        .map(item => item.storageName)
        .includes('AuthStore')
    ) {
      makePersistable(this, {
        name: 'AuthStore',
        properties: ['user'],
        storage: AsyncStorage,
      });
    }
  }
  /* persist functions */
  get isHydrated(): boolean {
    return isHydrated(this);
  }
  async clearPersistedData(): Promise<void> {
    await clearPersistedStore(this);
  }
  async rehydrateStore(): Promise<void> {
    await hydrateStore(this);
  }
  /* modifiers */
  @action async setUser(user: IUser) {
    this.user = user;
  }
  share = async () => {
    try {
      const result = await Share.share({
        message: `${translate('affiliateProgram.shareTxt')}${
          this.user?.referalCode
        }`,
        title: lightexchange.app.INFO.APP_NAME,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
        } else {
        }
      } else if (result.action === Share.dismissedAction) {
      }
    } catch (error) {}
  };
  @action setInitialState() {
    this.authSteps = APP.AUTH_STORE.AUTH_STEPS;
    this.ressetPasswordSteps = APP.AUTH_STORE.RESET_STEPS;
    this.currentStep = this.ressetPasswordSteps.initialization;
    this.user = APP.AUTH_STORE.USER;
    this.countries = APP.AUTH_STORE.COUNTRIES;
  }
  @action setCurrentStep(currentStep: string) {
    this.currentStep = currentStep;
  }
  @action setUserData(data: any, property: string) {
    this.user![`${property}`] = data;
  }
  toContactUs = async () => {
    const number = await this.rootStore?.systemStore.systemGetNumbers(
      lightexchange.app.NUMBERS_TYPE.CUSTOMER_SUPPORT,
    );
    const supported = await Linking.canOpenURL(
      lightexchange.app.INFO.WHATSAPP_LINK + number,
    );
    if (supported) {
      await Linking.openURL(lightexchange.app.INFO.WHATSAPP_LINK + number);
    } else {
      ToastService.show(
        translate('contactUs.whatsappError'),
        ToastService.ERROR,
      );
    }
  };
  setCountryList = countries => {
    this.countries = countries;
    if (this.user?.country?.id == '') this.user!.country = countries[0];
  };
  @action async signOut(toBlock?) {
    lightexchange.AppEventEmitter.emit(
      lightexchange.AppEvents.OverlaySpinner,
      true,
    );
    try {
      // Navigate BEFORE resetting state so the navigator ref is still valid
      replace(ROUTES.authNavigation.navigator, {
        screen: ROUTES.authNavigation.welcomeScreen,
      });
      this.rootStore!.setInitialState();
    } catch (e) {
      console.log('signOut navigation error', e);
    } finally {
      lightexchange.AppEventEmitter.emit(
        lightexchange.AppEvents.OverlaySpinner,
        false,
      );
    }
  }
  /* resolvers from api */
  @action async signIn(): Promise<any> {
    const token = await messaging().getToken();
    const values = {
      email: this.user?.email,
      password: this.user?.password,
      fcmToken: token,
    };
    if (!(await checkForm(values))) {
      return;
    }
    const response = await Service.mutation(
      values,
      lightexchange.graphql.mutation.SIGN_IN,
    );
    if (response.data && response.data.signIn) {
      if (response.data.signIn.emailConfirmation === false) {
        navigate(ROUTES.authNavigation.emailConfirmation);
      } else {
        this.setUser({
          ...this.user,
          ...response.data.signIn,
          connected: true,
        });
        replace(ROUTES.mainNavigation.navigator, {
          screen: ROUTES.mainNavigation.tabNavigation.walletNavigation.walletHome,
        });
        ToastService.show(
          translate('successMessages.signIn'),
          ToastService.SUCCESS,
        );
      }
    }
  }
  @action async signInGoogle(): Promise<any> {
    try {
      GoogleSignin.configure({
        webClientId: APP.INFO.WEB_CLIENT_ID,
      });
      const play = await GoogleSignin.hasPlayServices();
      const isSignedIn = await GoogleSignin.hasPreviousSignIn();
      if (isSignedIn) {
        await GoogleSignin.signOut();
      }
      const userInfo = await GoogleSignin.signIn();
      const token = await messaging().getToken();
      const values = {
        email: userInfo.data?.user.email,
        password: '',
        fcmToken: token,
      };
      let response = await Service.mutation(
        values,
        lightexchange.graphql.mutation.SIGN_IN_BY_GOOGLE,
      );

      if (response.data && response.data.signInByGoogle) {
        const userData = response.data.signInByGoogle;
        this.setUser({ ...this.user, ...userData, connected: true });
        replace(ROUTES.mainNavigation.navigator, {
          screen: ROUTES.mainNavigation.tabNavigation.walletNavigation.walletHome,
        });
        ToastService.show(
          translate('successMessages.signIn'),
          ToastService.SUCCESS,
        );
      }
    } catch (e) {
      console.log(e);
    }
  }
  @action async signUp(): Promise<any> {
    const token = await messaging().getToken();
    const values = {
      email: this.user?.email,
      password: this.user?.password,
      refererBy: this.user?.refererBy,
      fcmToken: token,
    };
    if (!(await checkForm(values))) {
      return;
    }
    const response = await Service.mutation(
      values,
      lightexchange.graphql.mutation.SIGN_UP,
    );
    if (response.data && response.data.signUp) {
      this.setUser({ ...this.user, ...response.data.signUp, connected: false });
      navigate(ROUTES.authNavigation.emailConfirmation);
    }
  }
  @action async emailGetCode(email: String): Promise<any> {
    const response = await Service.mutation(
      { email },
      lightexchange.graphql.mutation.EMAIL_GET_CODE,
    );
    if (response.data) {
      ToastService.show(
        translate('successMessages.passwordGetCode'),
        ToastService.SUCCESS,
      );
    }
  }
  @action async emailConfirmation(): Promise<any> {
    const data = {
      email: this.user?.email,
      code: this.user?.code,
    };
    const formIsOk = await checkForm(data);
    if (!formIsOk) {
      return;
    }
    const response = await Service.mutation(
      data,
      lightexchange.graphql.mutation.EMAIL_CONFIRMATION,
    );
    if (response.data && response.data.emailConfirmation) {
      this.setUser({ ...this.user, connected: true });
      replace(ROUTES.mainNavigation.navigator, {
        screen: ROUTES.mainNavigation.tabNavigation.walletNavigation.walletHome,
      });
      ToastService.show(
        translate('successMessages.emailConfirmation'),
        ToastService.SUCCESS,
      );
    }
  }
  @action async getCheckRefererBy() {
    const response = await Service.query(
      { referalCode: this.user?.referalCode },
      lightexchange.graphql.query.CHECK_REFERER_BY,
    );
    if (response.data && response.data.checkRefererBy) {
      this.setUserData(response.data.checkRefererBy.length, 'referals');
    }
  }
  // Récupère TOUS les filleuls (vérifiés KYC + non vérifiés) pour l'écran d'affiliation.
  @action async getReferralsByCode() {
    const response = await Service.query(
      { referalCode: this.user?.referalCode },
      REFERRALS_BY_CODE,
    );
    if (response.data && response.data.referralsByCode) {
      this.referralUsers = response.data.referralsByCode;
    }
  }
  @action async getUserById(userId: number) {
    if (this.user!.referalCode?.trim() !== '') {
      return;
    }
    const response = await Service.query(
      { userId },
      lightexchange.graphql.query.USER_BY_ID,
    );

    if (response.data) {
      this.setUser(response.data.userById);
      return response.data;
    }
  }
  @action async userNameUpdate(): Promise<any> {
    if (!(await checkForm({ name: this.user?.name || '' }))) {
      return;
    }
    const response = await Service.mutation(
      { userId: this.user?.id, name: this.user?.name },
      lightexchange.graphql.mutation.USER_NAME_UPDATE,
    );
    if (response.data && response.data.userNameUpdate) {
      if (
        response.data.userNameUpdate ==
        APP.AUTH_STORE.MAX_USER_PROFILE_UPDATE - 1
      ) {
        ToastService.show(
          translate('successMessages.nameUpdate'),
          ToastService.SUCCESS,
        );
      }
      if (
        response.data.userNameUpdate == APP.AUTH_STORE.MAX_USER_PROFILE_UPDATE
      ) {
        ToastService.show(
          translate('successMessages.nameUpdate1'),
          ToastService.SUCCESS,
        );
      }
      this.setUserData(response.data.userNameUpdate, 'numberUpdateName');
      this.setUserData(false, 'isEditingName');
    }
  }
  @action async userPhoneUpdate(): Promise<any> {
    const response = await Service.mutation(
      { userId: this.user?.id, phone: this.user?.phone },
      lightexchange.graphql.mutation.USER_PHONE_UPDATE,
    );
    if (response.data && response.data.userPhoneUpdate) {
      if (response.data.userPhoneUpdate == APP.AUTH_STORE.MAX_USER_PROFILE_UPDATE - 1) {
        ToastService.show(translate('successMessages.phoneUpdate'), ToastService.SUCCESS);
      }
      if (response.data.userPhoneUpdate == APP.AUTH_STORE.MAX_USER_PROFILE_UPDATE) {
        ToastService.show(translate('successMessages.phoneUpdate1'), ToastService.SUCCESS);
      }
      this.setUserData(response.data.userPhoneUpdate, 'numberUpdatePhone');
      this.setUserData(false, 'isEditingPhone');
    }
  }

  @action async userUpdateCountry(countryId: string): Promise<any> {
    const response = await Service.mutation(
      { userId: this.user?.id, countryId },
      lightexchange.graphql.mutation.USER_UPDATE_COUNTRY,
    );
    if (response.data && response.data.userUpdateCountry != null) {
      const count = response.data.userUpdateCountry;
      this.setUserData(count, 'countryUpdateCount');
      const selected = this.countries?.find(c => c.id === countryId);
      if (selected) this.setUserData(selected, 'country');
      if (count == APP.AUTH_STORE.MAX_USER_PROFILE_UPDATE - 1) {
        ToastService.show(translate('successMessages.countryUpdate'), ToastService.SUCCESS);
      }
      if (count == APP.AUTH_STORE.MAX_USER_PROFILE_UPDATE) {
        ToastService.show(translate('successMessages.countryUpdate1'), ToastService.SUCCESS);
      }
    }
  }

  @action async userUploadIdDocument(type: string, base64: string): Promise<any> {
    const response = await Service.mutation(
      { userId: this.user?.id, type, base64 },
      lightexchange.graphql.mutation.USER_UPLOAD_ID_DOCUMENT,
    );
    if (response?.data?.userUploadIdDocument) {
      const data = response.data.userUploadIdDocument;
      this.setUserData(data.idFrontUrl, 'idFrontUrl');
      this.setUserData(data.idBackUrl, 'idBackUrl');
      this.setUserData(data.idSelfieUrl, 'idSelfieUrl');
      ToastService.show(translate('profil.idUploadSuccess'), ToastService.SUCCESS);
    }
  }

  @action async userRequestIdVerification(): Promise<any> {
    const response = await Service.mutation(
      { userId: this.user?.id },
      lightexchange.graphql.mutation.USER_REQUEST_ID_VERIFICATION,
    );
    if (response.data?.userRequestIdVerification) {
      this.setUserData(true, 'idVerificationRequested');
      ToastService.show(
        translate('profil.idVerificationRequested'),
        ToastService.SUCCESS,
      );
    }
  }

  @action async refreshVerificationStatus(): Promise<any> {
    const response = await Service.query(
      { userId: this.user?.id },
      lightexchange.graphql.query.USER_BY_ID,
    );
    if (response.data?.userById) {
      const data = response.data.userById;
      this.setUserData(data.idVerified, 'idVerified');
      this.setUserData(data.idVerificationRequested, 'idVerificationRequested');
      this.setUserData(data.idFrontUrl, 'idFrontUrl');
      this.setUserData(data.idBackUrl, 'idBackUrl');
      this.setUserData(data.idSelfieUrl, 'idSelfieUrl');
      if (data.idVerified) {
        ToastService.show(
          translate('profil.idVerified'),
          ToastService.SUCCESS,
        );
      }
    }
  }

  @action async verifyCodeResset() {
    this.setUserData(APP.AUTH_STORE.USER.password, 'password');
    const data = { email: this.user?.email, code: this.user?.code };
    if (!(await checkForm(data))) {
      return;
    }
    const value = await Service.mutation(
      data,
      lightexchange.graphql.mutation.EMAIL_CONFIRMATION,
    );
    if (value.data) {
      this.setCurrentStep(this.ressetPasswordSteps.finalization);
    }
  }

  @action async getCode() {
    const formIsOk = await checkForm({ email: this.user?.email });
    if (!formIsOk) {
      return;
    }
    const email = this.user?.email!;
    try {
      const result = await this.passwordGetCode(email);
      if (result.data && result.data.passwordGetCode) {
        this.setUserData(result.data.passwordGetCode, 'code');
        this.setCurrentStep(this.ressetPasswordSteps.resetPassword);
      }
    } catch (e) {}
  }
  @action async passwordGetCode(email: String): Promise<any> {
    const response = await Service.mutation(
      { email },
      lightexchange.graphql.mutation.PASSWORD_GET_CODE,
    );
    if (response && response.data.passwordGetCode) {
      ToastService.show(
        translate('successMessages.passwordGetCode'),
        ToastService.SUCCESS,
      );
      return response;
    }
  }
  @action async passwordUpdate({ email, password }): Promise<any> {
    const response = await Service.mutation(
      { email, password },
      lightexchange.graphql.mutation.PASSWORD_UPDATE,
    );
    if (response.data) {
      ToastService.show(
        translate('successMessages.paswordUpdate'),
        ToastService.SUCCESS,
      );
    }
  }
  @action async resetPassword() {
    const formIsOk = await checkForm({ password: this.user?.password });
    if (!formIsOk) {
      return;
    }
    await this.passwordUpdate({
      email: this.user?.email,
      password: this.user?.password,
    });
    this.setUserData(APP.AUTH_STORE.USER.password, 'password');
    navigate(ROUTES.authNavigation.signIn);
    this.setCurrentStep(this.ressetPasswordSteps.initialization);
  }
  @action async userNumberCreate(): Promise<any> {
    const data = {
      userId: parseFloat(this.user?.id!),
      phone: this.user?.userNumber,
      paymentMethodId: parseFloat(
        this.rootStore?.tradeStore.selectedPaymentMethod?.id!,
      ),
    };
    const formIsOk = await checkForm({
      numberOrWallet: this.user?.userNumber,
      paymentMethodName: this.rootStore?.tradeStore.selectedPaymentMethod?.name,
    });
    if (!formIsOk) {
      return;
    }
    const response = await Service.mutation(
      data,
      lightexchange.graphql.mutation.USER_NUMBER_CREATE,
    );
    if (response.data && response.data.userNumberCreate) {
      ToastService.show(translate('paymentMethod.addSuccessTxt'));
      this.userNumbersByUser();
    }
  }
  @action async userNumbersByUser(): Promise<any> {
    const response = await Service.query(
      {
        userId: parseFloat(this.user?.id!),
      },
      lightexchange.graphql.query.USER_NUMBERS_BY_USER,
    );
    if (response.data && response.data.userNumbersByUser) {
      this.setUserData(response.data.userNumbersByUser, 'userNumbers');
      if (!this.user?.selectedUserNumber?.id)
        this.setUserData(
          response.data.userNumbersByUser[0],
          'selectedUserNumber',
        );
    }
  }
  @action async countryList() {
    const response = await Service.query(
      {},
      lightexchange.graphql.query.COUNTRY_LIST,
    );
    if (response.data && response.data.countryList) {
      this.setCountryList(response.data.countryList);
    }
  }
}
