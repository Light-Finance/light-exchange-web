import { action, makeAutoObservable, observable } from 'mobx';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';
import lightexchange from 'light-exchange';

export interface ITutorial {
  id: string;
  title: string;
  youtubeUrl: string;
  description: string;
  order: number;
}

export class TutorialStore {
  @observable rootStore: RootStore;
  @observable tutorials: ITutorial[] = [];
  @observable isLoading: boolean = false;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  @action async tutorialList() {
    this.isLoading = true;
    const response = await Service.query({}, lightexchange.graphql.query.TUTORIAL_LIST, true);
    if (response?.data?.tutorialList) {
      this.tutorials = response.data.tutorialList;
    }
    this.isLoading = false;
  }
}
