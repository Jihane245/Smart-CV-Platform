<#import "template.ftl" as layout>
<@layout.registrationLayout bodyClass="two-panel" displayMessage=true; section>

  <#if section = "header">
  <#elseif section = "form">

  <div class="two-panel">

    <div class="left-panel">
      <img src="${url.resourcesPath}/img/logo.jpg" alt="Logo Cevia" class="logo">
    </div>

    <div class="right-panel">

      <div class="top-nav">
        <a href="${url.loginUrl}" class="btn-nav">Connexion</a>
      </div>

      <div class="form-card">
        <h1 class="form-title">INSCRIPTION</h1>

        <#if message?has_content && message.type = "error">
          <div class="alert-error">${message.summary}</div>
        </#if>

        <form action="${url.registrationAction}" method="post">

          <!-- Nom -->
          <div class="field-group">
            <input
              type="text"
              name="lastName"
              class="form-input <#if messagesPerField.existsError('lastName')>error</#if>"
              placeholder="Nom"
              value="${(register.formData.lastName!'')}"
              autocomplete="family-name"
            />
            <#if messagesPerField.existsError('lastName')>
              <span class="error-msg">${kcSanitize(messagesPerField.get('lastName'))?no_esc}</span>
            </#if>
          </div>

          <!-- Prénom -->
          <div class="field-group">
            <input
              type="text"
              name="firstName"
              class="form-input <#if messagesPerField.existsError('firstName')>error</#if>"
              placeholder="Prénom"
              value="${(register.formData.firstName!'')}"
              autocomplete="given-name"
            />
            <#if messagesPerField.existsError('firstName')>
              <span class="error-msg">${kcSanitize(messagesPerField.get('firstName'))?no_esc}</span>
            </#if>
          </div>

          <!-- Email -->
          <div class="field-group">
            <input
              type="email"
              name="email"
              class="form-input <#if messagesPerField.existsError('email')>error</#if>"
              placeholder="Adresse email"
              value="${(register.formData.email!'')}"
              autocomplete="email"
            />
            <#if messagesPerField.existsError('email')>
              <span class="error-msg">${kcSanitize(messagesPerField.get('email'))?no_esc}</span>
            </#if>
          </div>

          <!-- Password -->
          <div class="field-group">
            <div class="input-wrapper">
              <input
                type="password"
                name="password"
                class="form-input <#if messagesPerField.existsError('password','password-confirm')>error</#if>"
                placeholder="Mot de passe"
                autocomplete="new-password"
              />
            </div>
            <#if messagesPerField.existsError('password')>
              <span class="error-msg">${kcSanitize(messagesPerField.get('password'))?no_esc}</span>
            </#if>
          </div>

          <!-- Confirm Password -->
          <div class="field-group">
            <div class="input-wrapper">
              <input
                type="password"
                name="password-confirm"
                class="form-input <#if messagesPerField.existsError('password-confirm')>error</#if>"
                placeholder="Confirmer le mot de passe"
                autocomplete="new-password"
              />
            </div>
            <#if messagesPerField.existsError('password-confirm')>
              <span class="error-msg">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</span>
            </#if>
          </div>

          <button type="submit" class="btn-submit">S'inscrire</button>

          <!-- Google -->
          <#if social.providers?has_content>
            <div class="divider">ou</div>
            <#list social.providers as p>
              <#if p.alias = "google">
                <a href="${p.loginUrl}" class="btn-google">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  S'inscrire avec Google
                </a>
              </#if>
            </#list>
          </#if>

        </form>
      </div>
    </div>
  </div>

  </#if>
</@layout.registrationLayout>