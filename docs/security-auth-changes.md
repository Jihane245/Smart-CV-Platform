# Smart CV Platform — Renforcement sécurité Auth (Keycloak)

Date: 2026-04-26  
Portée: Backend API + configuration Docker + Keycloak realm import

## Résumé

Objectif: renforcer la sécurité de l’authentification (Keycloak) en supprimant les identifiants admin en dur, en durcissant la validation des tokens, en réduisant la persistance des tokens côté serveur, et en rendant la déconnexion compatible avec les exigences Keycloak.

## Changements principaux

### 1) Suppression du “admin/admin” dans le code

Avant:
- Le backend récupérait un token admin via **password grant** avec un compte admin Keycloak en dur (`admin/admin`) pour appeler l’Admin API (ex: forgot-password, désactivation/suppression).

Après:
- Le backend utilise un **client service account** via **`client_credentials`** avec:
  - `Keycloak__AdminClientId`
  - `Keycloak__AdminClientSecret`
- Rôles minimums attendus côté Keycloak (`realm-management`):
  - `view-users`
  - `manage-users`

Fichiers:
- `backend/src/SmartCV.API/services/KeycloakAdminService.cs`
- `backend/src/SmartCV.API/controllers/AuthController.cs`

### 2) Durcissement validation tokens (OIDC + Bearer)

Avant:
- Validation issuer permissive (`ValidateIssuer = false`).
- Configuration Bearer partiellement hardcodée.

Après:
- Validation stricte:
  - `ValidateIssuer = true`
  - `ValidateAudience = true`
  - `ValidateLifetime = true`
  - `ClockSkew = TimeSpan.Zero`
- Bearer aligne `Authority` / `Audience` sur la config Keycloak.

Fichier:
- `backend/src/SmartCV.API/Program.cs`

### 3) Réduction de l’exposition des tokens côté backend

Avant:
- `SaveTokens = true` (tokens conservés côté serveur/session).

Après:
- `SaveTokens = false`.

Fichier:
- `backend/src/SmartCV.API/Program.cs`

### 4) Déconnexion Keycloak (id_token_hint / client_id)

Contexte:
- Keycloak peut exiger `id_token_hint` ou `client_id` quand `post_logout_redirect_uri` est utilisé.

Après:
- Stockage **uniquement** de `id_token` comme claim dans le cookie d’auth (afin de fournir `id_token_hint` au logout).
- Envoi systématique de `client_id` au logout (fallback robuste).
- Ajustement de l’action `/api/auth/logout` pour déclencher `SignOut` **Cookies + OIDC** en une seule étape.

Fichiers:
- `backend/src/SmartCV.API/Program.cs`
- `backend/src/SmartCV.API/controllers/AuthController.cs`

### 5) Docker Compose: injection des variables Keycloak Admin API

Après:
- Le service `backend` reçoit:
  - `Keycloak__AdminBaseUrl=http://keycloak:8080`
  - `Keycloak__Realm=${KEYCLOAK_REALM}`
  - `Keycloak__AdminRealm=master`
  - `Keycloak__AdminClientId=${KEYCLOAK_ADMIN_CLIENT_ID}`
  - `Keycloak__AdminClientSecret=${KEYCLOAK_ADMIN_CLIENT_SECRET}`

Fichier:
- `docker-compose.yml`

### 6) Import du realm Keycloak: création automatique du client service account

Après:
- `keycloak/realm-export/cv-platform-realm.json` inclut:
  - le client `smartcv-admin-api` (serviceAccountsEnabled)
  - l’utilisateur `service-account-smartcv-admin-api` avec rôles `realm-management` (`view-users`, `manage-users`)

Fichier:
- `keycloak/realm-export/cv-platform-realm.json`

### 7) Documentation

Ajout:
- `docs/security-auth.md`: configuration, variables d’environnement, procédure Keycloak.

## Variables d’environnement concernées

Backend (dans `docker-compose.yml`):
- `Keycloak__Authority`
- `Keycloak__MetadataAddress`
- `Keycloak__ClientId`
- `Keycloak__ClientSecret`
- `Keycloak__AdminBaseUrl`
- `Keycloak__Realm`
- `Keycloak__AdminRealm`
- `Keycloak__AdminClientId`
- `Keycloak__AdminClientSecret`

## Validation rapide (manuel)

- Login: ouvrir le frontend → connexion → retour app OK.
- Logout: déclencher `/api/auth/logout` → pas d’erreur Keycloak `Missing parameters: id_token_hint`.
- Forgot password: `POST /api/auth/forgot-password`:
  - email existant → 200
  - email inexistant → 200 (message identique, pas de leak d’existence).

