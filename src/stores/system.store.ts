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
