import lightexchange from 'light-exchange';

// Same API endpoints as the mobile app / dashboard, read from the shared npm
// config rather than hardcoded per client.
export const GRAPHQL_API_URL: string = lightexchange.app.INFO.GRAPHQL_API_URL;
export const API_BASE_URL = GRAPHQL_API_URL.replace('/graphql', '');
export const BASE_URL: string = lightexchange.app.INFO.API_HOST;
export const GRAPHQL_API_URL_WS = `wss://${BASE_URL}/subscriptions`;
/** Cheap liveness probe used by the connectivity check. */
export const GRAPHQL_API_URL_QUERY = `${GRAPHQL_API_URL}?query={info}`;
