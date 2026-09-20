import { action, makeAutoObservable, observable } from 'mobx';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';
import lightexchange from 'light-exchange';
import { ICountry, ICrypto } from '../models';

export class SystemStore {
  @observable rootStore: RootStore;
  @observable cryptos?: ICrypto[];
  @observable selectedCrypto?: ICrypto;
  @observable countries: ICountry[];
  @observable country: ICountry;
  /**
   * Nom de version saisi dans le dashboard. Tant que l'API n'a pas repondu, ou
   * si le champ est vide, il vaut undefined et l'affichage retombe sur la
   * version du build : un pied de page sans numero serait pire qu'un numero
   * un peu ancien.
   */
  @observable appVersionName?: string;
  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.setInitialState();
    makeAutoObservable(this);
  }
  @action setInitialState() {
    this.cryptos = [];
    this.selectedCrypto = {
      name: '',
    };
    this.countries = [];
    this.country = {};
  }
  @action setCryptoList(cryptos: ICrypto[]) {
    this.cryptos = cryptos;
  }
  @action setAppVersionName(name?: string) {
    this.appVersionName = name;
  }
  /**
   * Lit le nom de version regle dans le dashboard, pour que le site et l'app
   * mobile annoncent le meme numero sans avoir a republier le site.
   *
   * loaderOn est faux : c'est un detail de pied de page, il n'a aucune raison
   * de poser un voile de chargement sur l'ecran au demarrage.
   */
  @action async appVersion() {
    const response = await Service.query(
      { adminId: 1 },
      lightexchange.graphql.query.SYSTEM_BY_ID,
      false,
    );
    const name = response?.data?.systemById?.mobileAppVersionName;
    if (name) this.setAppVersionName(String(name));
  }
  @action async systemGetNumbers(type) {
    const response = await Service.query(
      { type },
      lightexchange.graphql.query.SYSTEM_GET_NUMBERS,
    );
    if (response.data && response.data.systemGetNumbers) {
      return response.data.systemGetNumbers;
    }
  }
  @action setSelectedCrypto(id: string) {
    const selectedCrypto = this.cryptos?.find(crypto => crypto.id === id);
    if (selectedCrypto) {
      this.selectedCrypto = selectedCrypto;
    }
  }
  @action async cryptoList() {
    const response = await Service.query(
      {},
      lightexchange.graphql.query.CRYPTO_LIST,
    );
    if (response.data && response.data.cryptoList.length > 0) {
      this.setCryptoList(response.data.cryptoList);
      this.selectedCrypto = response.data.cryptoList[0];
    }
  }
  @action setCountries(countries: ICountry[]) {
    this.countries = countries;
  }

  @action setSelectedCountry(id: string) {
    const selectedCountry = this.countries?.find(country => country.id === id);
    if (selectedCountry) {
      this.country = selectedCountry;
    }
  }
  @action async countryList() {
    const response = await Service.query(
      {},
      lightexchange.graphql.query.COUNTRY_LIST,
    );
    if (response.data && response.data.countryList.length > 0) {
      this.setCountries(response.data.countryList);
      this.country = response.data.countryList[0];
    }
  }
}
