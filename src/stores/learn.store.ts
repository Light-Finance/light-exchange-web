import { makeAutoObservable } from 'mobx';
import gql from 'graphql-tag';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';

// ── Formations remunerees ────────────────────────────────────────────────
// Apprendre rapporte des credits, qui paient un abonnement au robot. Les
// bonnes reponses des quiz ne quittent jamais le serveur : c'est lui qui
// corrige.

const LESSONS = gql`
  query lessons($userId: ID) {
    lessons(userId: $userId) {
      id
      track
      title
      summary
      reward
      questionCount
      minutes
      progress {
        attempts
        bestScore
        passed
        rewarded
        retryAt
      }
    }
  }
`;

const LESSON = gql`
  query lesson($userId: ID, $lessonId: ID!) {
    lesson(userId: $userId, lessonId: $lessonId) {
      id
      track
      title
      summary
      body
      reward
      quiz {
        q
        options
      }
      progress {
        attempts
        bestScore
        passed
        rewarded
        retryAt
      }
    }
  }
`;

const LEARN_STATUS = gql`
  query learnStatus($userId: ID!) {
    learnStatus(userId: $userId) {
      credits
      cap
      rewardedTotal
      todayRewarded
      dailyMax
      passedCount
      lessonCount
      verified
      verifiedRequired
    }
  }
`;

const SUBMIT = gql`
  mutation lessonSubmitQuiz($userId: ID!, $lessonId: ID!, $answers: [Int!]!) {
    lessonSubmitQuiz(userId: $userId, lessonId: $lessonId, answers: $answers) {
      score
      passed
      rewarded
      credits
      reason
      retryAt
    }
  }
`;

const CLAIM = gql`
  mutation lessonClaimReward($userId: ID!, $lessonId: ID!) {
    lessonClaimReward(userId: $userId, lessonId: $lessonId) {
      rewarded
      credits
      reason
    }
  }
`;

export interface ILessonProgress {
  attempts: number;
  bestScore: number;
  passed: boolean;
  rewarded: number;
  retryAt: string | null;
}

export interface ILessonCard {
  id: string;
  track: string;
  title: string;
  summary: string;
  reward: number;
  questionCount: number;
  minutes: number;
  progress: ILessonProgress;
}

export interface ILesson {
  id: string;
  track: string;
  title: string;
  summary: string;
  body: string;
  reward: number;
  quiz: { q: string; options: string[] }[];
  progress: ILessonProgress;
}

export interface ILearnStatus {
  credits: number;
  cap: number;
  rewardedTotal: number;
  todayRewarded: number;
  dailyMax: number;
  passedCount: number;
  lessonCount: number;
  verified: boolean;
  verifiedRequired: boolean;
}

export interface IQuizResult {
  score: number;
  passed: boolean;
  rewarded: number;
  credits: number;
  reason: string | null;
  retryAt: string | null;
}

export class LearnStore {
  rootStore: RootStore;
  lessons: ILessonCard[] = [];
  status?: ILearnStatus;
  current?: ILesson;
  busy = false;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  private get userId(): string | undefined {
    return this.rootStore.authStore.user?.id;
  }

  async load(loader = false) {
    const userId = this.userId;
    const [l, s] = await Promise.all([
      Service.query({ userId }, LESSONS, loader),
      userId ? Service.query({ userId }, LEARN_STATUS, false) : Promise.resolve(null),
    ]);
    if (l?.data?.lessons) this.lessons = l.data.lessons;
    if (s?.data?.learnStatus) this.status = s.data.learnStatus;
  }

  async open(lessonId: string) {
    this.current = undefined;
    const r = await Service.query({ userId: this.userId, lessonId }, LESSON, true);
    if (r?.data?.lesson) this.current = r.data.lesson;
  }

  /** Envoie les reponses ; le serveur corrige et recompense s'il y a lieu. */
  async submit(lessonId: string, answers: number[]): Promise<IQuizResult | null> {
    const userId = this.userId;
    if (!userId || this.busy) return null;
    this.busy = true;
    try {
      const r = await Service.mutation({ userId, lessonId, answers }, SUBMIT, true);
      const res = r?.data?.lessonSubmitQuiz ?? null;
      if (res) await this.load();
      return res;
    } finally {
      this.busy = false;
    }
  }

  /** Reclame une recompense reportee : identite verifiee depuis, ou nouveau jour. */
  async claim(lessonId: string): Promise<{ rewarded: number; reason: string | null } | null> {
    const userId = this.userId;
    if (!userId || this.busy) return null;
    this.busy = true;
    try {
      const r = await Service.mutation({ userId, lessonId }, CLAIM, true);
      const res = r?.data?.lessonClaimReward ?? null;
      if (res) await this.load();
      return res;
    } finally {
      this.busy = false;
    }
  }
}
