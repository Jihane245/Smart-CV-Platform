FROM quay.io/keycloak/keycloak:26.5.6
USER root
COPY entrypoint.sh /opt/keycloak/entrypoint.sh
RUN sed -i 's/\r$//' /opt/keycloak/entrypoint.sh && chmod +x /opt/keycloak/entrypoint.sh
USER 1000
ENTRYPOINT ["/bin/bash", "/opt/keycloak/entrypoint.sh"]
