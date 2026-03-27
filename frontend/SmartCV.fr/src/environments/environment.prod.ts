// src/environments/environment.prod.ts
// DO NOT put real values here. DO NOT commit real values here.
// The placeholder strings below are replaced at container startup by env.sh.
// This file is safe to commit as-is.

export const environment = {
  production: true,
  keycloak: {
    url: 'KEYCLOAK_URL_PLACEHOLDER',
    realm: 'KEYCLOAK_REALM_PLACEHOLDER',
    clientId: 'KEYCLOAK_CLIENT_ID_PLACEHOLDER',
  },
};