#!/bin/bash
set -eu

IMPORT_DIR="/opt/keycloak/data/import"

if [ -d "${IMPORT_DIR}" ] && ls "${IMPORT_DIR}"/*-realm.json >/dev/null 2>&1; then
  echo "[keycloak] Import realm depuis ${IMPORT_DIR} (--override)..."
  /opt/keycloak/bin/kc.sh import --dir "${IMPORT_DIR}" --override true
fi

echo "[keycloak] Demarrage du serveur..."
exec /opt/keycloak/bin/kc.sh start-dev
