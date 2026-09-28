import { makeAutoObservable } from 'mobx';
import gql from 'graphql-tag';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';

// ── Messagerie de support ─────────────────────────────────────────────────
// L'ecran interroge ces requetes periodiquement plutot que de tenir une
// connexion ouverte : un fil de support ne demande pas la seconde pres.

const SUPPORT_MESSAGES = gql`
  query supportMessages($userId: ID!) {
    supportMessages(userId: $userId) {
      id
      fromAdmin
      text
      imageUrl
      read
      at
    }
  }
`;

const SUPPORT_UNREAD = gql`
  query supportUnreadCount($userId: ID!) {
    supportUnreadCount(userId: $userId)
  }
`;

const SUPPORT_SEND = gql`
  mutation supportSend($userId: ID!, $text: String, $imageBase64: String) {
    supportSend(userId: $userId, text: $text, imageBase64: $imageBase64) {
      id
      fromAdmin
      text
      imageUrl
      read
      at
    }
  }
`;

const SUPPORT_MARK_READ = gql`
  mutation supportMarkRead($userId: ID!) {
    supportMarkRead(userId: $userId)
  }
`;

export interface ISupportMessage {
  id: string;
  fromAdmin: boolean;
  text: string;
  /** Image jointe, vide quand il n'y en a pas. */
  imageUrl?: string | null;
  read: boolean;
  at: string;
}

export class SupportStore {
  rootStore: RootStore;
  messages: ISupportMessage[] = [];
  unread = 0;
  sending = false;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  private get userId(): string | undefined {
    return this.rootStore.authStore.user?.id;
  }

  async load() {
    const userId = this.userId;
    if (!userId) return;
    const r = await Service.query({ userId }, SUPPORT_MESSAGES, false);
    if (r?.data?.supportMessages) this.messages = r.data.supportMessages;
  }

  /** Compteur pour la pastille, sans charger la conversation. */
  async loadUnread() {
    const userId = this.userId;
    if (!userId) return;
    const r = await Service.query({ userId }, SUPPORT_UNREAD, false);
    if (typeof r?.data?.supportUnreadCount === 'number')
      this.unread = r.data.supportUnreadCount;
  }

  /** Ouvrir la conversation vaut lecture des reponses du support. */
  async markRead() {
    const userId = this.userId;
    if (!userId) return;
    await Service.mutation({ userId }, SUPPORT_MARK_READ, false);
    this.unread = 0;
  }

  /** Envoie un message, avec ou sans image. Une image seule suffit. */
  async send(text: string, imageBase64?: string | null): Promise<boolean> {
    const body = text.trim();
    const userId = this.userId;
    if ((!body && !imageBase64) || !userId || this.sending) return false;
    this.sending = true;
    try {
      const r = await Service.mutation(
        { userId, text: body, imageBase64: imageBase64 || undefined },
        SUPPORT_SEND,
        false,
      );
      if (!r?.data?.supportSend) return false;
      this.messages = [...this.messages, r.data.supportSend];
      return true;
    } finally {
      this.sending = false;
    }
  }
}
