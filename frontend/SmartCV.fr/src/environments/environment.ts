// src/environments/environment.ts
// Used when running outside Docker (plain ng serve).
// Change the values here only for local non-Docker dev.

export const environment = {
  production: false,
  keycloak: {
    url: 'http://localhost:8080',   // direct to Keycloak, no nginx proxy
    realm: 'smartcv',
    clientId: 'smartcv-frontend',
  },
};