<#import "template.ftl" as layout>
<@layout.registrationLayout bodyClass="two-panel" displayMessage=true; section>

  <#if section = "header">
  <#elseif section = "form">

  <div class="two-panel">

    <!-- Left panel -->
    <div class="left-panel">
      <div class="logo-placeholder">LOGO</div>
    </div>

    <!-- Right panel -->
    <div class="right-panel">

      <div class="top-nav">
        <a href="${url.registrationUrl}" class="btn-nav">Inscription</a>
      </div>

      <#if message?has_content && message.type = "success">
        <div class="card" style="margin-bottom: 1.5rem; text-align: center;">
          <div class="email-icon" style="margin: 0 auto 1rem; width: 60px; height: 60px; color: var(--brown-mid);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
              <rect x="10" y="25" width="65" height="50" rx="4"/>
              <polyline points="10,25 42,55 75,25"/>
              <circle cx="78" cy="32" r="14" fill="white" stroke="currentColor" stroke-width="3"/>
              <polyline points="70,32 76,38 87,26" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p style="color: var(--brown-dark); font-size: 0.95rem; line-height: 1.6;">
            <p style="color: var(--brown-dark); font-size: 0.95rem; line-height: 1.6;">
              Un lien de réinitialisation a été envoyé à votre adresse email.
              Vérifiez votre boîte de réception.
            </p>
          </p>
          <p class="expire-msg">Le lien expire dans 15 minutes. Pensez à vérifier vos spams.</p>
        </div>
      </#if>

      <div class="form-card">
        <h1 class="form-title">CONNEXION</h1>

        <#if message?has_content && message.type = "error">
          <div class="alert-error">${message.summary}</div>
        </#if>

        <form action="${url.loginAction}" method="post">
          <input type="hidden" name="credentialId" value="<#if auth.selectedCredential?has_content>${auth.selectedCredential}</#if>"/>

          <!-- Email -->
          <div class="field-group">
            <input
              type="text"
              name="username"
              class="form-input <#if messagesPerField.existsError('username','password')>error</#if>"
              placeholder="Email ou nom d'utilisateur"
              value="${(login.username!'')}"
              autocomplete="username"
            />
            <#if messagesPerField.existsError('username')>
              <span class="error-msg">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
            </#if>
          </div>

          <!-- Password -->
          <div class="field-group">
            <div class="input-wrapper">
              <input
                type="password"
                name="password"
                class="form-input with-icon <#if messagesPerField.existsError('username','password')>error</#if>"
                placeholder="Mot de passe"
                autocomplete="current-password"
              />
            </div>
            <#if messagesPerField.existsError('password')>
              <span class="error-msg">${kcSanitize(messagesPerField.get('password'))?no_esc}</span>
            </#if>
          </div>

          <!-- Forgot password -->
          <#if realm.resetPasswordAllowed>
            <a href="${url.loginResetCredentialsUrl}" class="forgot-link">Mot de passe oublié ?</a>
          </#if>

          <!-- Submit -->
          <button type="submit" class="btn-submit">Se connecter</button>

          <!-- Divider -->
          <div class="divider">ou</div>

          <!-- Google -->
          <#list social.providers as p>
            <#if p.alias = "google">
              <a href="${p.loginUrl}" class="btn-google">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continuer avec Google
              </a>
            </#if>
          </#list>

        </form>
      </div>
    </div>
  </div>

  </#if>
</@layout.registrationLayout>