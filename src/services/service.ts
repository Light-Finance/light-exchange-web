import lightexchange from 'light-exchange';
import { GRAPHQL_API_URL, GRAPHQL_API_URL_WS } from '../consts/api';

// GraphQL client — same wiring as the dashboard/mobile, pointed at the shared API.
export const Service = new lightexchange.service({
  url: GRAPHQL_API_URL,
  url1: GRAPHQL_API_URL_WS,
  toastService: (message: string) => {
    // Simple surfacing of API errors for now.
    if (typeof message === 'string' && message) console.warn('[API]', message);
  },
  blockedUserHandler: () => {
    try {
      localStorage.removeItem('lx_user');
    } catch (e) {}
    if (location.pathname !== '/login') location.href = '/login';
  },
  language: 'fr',
  platform: 'web',
});
