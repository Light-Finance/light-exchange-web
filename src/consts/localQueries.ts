import gql from 'graphql-tag';

// Requêtes définies localement dans l'app (non publiées dans le paquet npm
// @light-finance/light-exchange-npm). Le schéma correspondant est ajouté côté
// serveur via `localTypeDefs` dans light-exchange-api.

// Filleuls (utilisateurs ayant utilisé le code de parrainage) avec leur statut KYC.
// Contrairement à CHECK_REFERER_BY (vérifiés uniquement), inclut les non-vérifiés.
export const REFERRALS_BY_CODE = gql`
  query referralsByCode($referalCode: String!) {
    referralsByCode(referalCode: $referalCode) {
      id
      name
      email
      idVerified
    }
  }
`;
