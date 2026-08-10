import lightexchange from 'light-exchange';

// Same API host as the mobile app / dashboard (from the shared npm config).
export const BASE_URL: string = lightexchange.app.INFO.API_HOST;
export const GRAPHQL_API_URL = `https://${BASE_URL}/graphql`;
export const GRAPHQL_API_URL_WS = `wss://${BASE_URL}/subscriptions`;
