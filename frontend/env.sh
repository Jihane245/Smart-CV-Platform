set -e
 
TARGET_DIR="/usr/share/nginx/html"
 
# Inside Docker Compose, the browser reaches Keycloak via the nginx /auth proxy.
# The browser always talks to localhost (same origin), nginx forwards to the
# "keycloak" container internally. This avoids all CORS issues.
KEYCLOAK_URL="http://localhost/auth"
 
echo "[env.sh] Injecting environment into built JS files..."
echo "  KEYCLOAK_URL = ${KEYCLOAK_URL}"
echo "  KC_REALM     = ${KC_REALM}"
echo "  KC_CLIENT_ID = ${KC_CLIENT_ID}"
 
find "$TARGET_DIR" -name "*.js" | while read -r file; do
  sed -i \
    -e "s|KEYCLOAK_URL_PLACEHOLDER|${KEYCLOAK_URL}|g" \
    -e "s|KEYCLOAK_REALM_PLACEHOLDER|${KC_REALM}|g" \
    -e "s|KEYCLOAK_CLIENT_ID_PLACEHOLDER|${KC_CLIENT_ID}|g" \
    "$file"
done
 
echo "[env.sh] Done."
