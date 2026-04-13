<#import "template.ftl" as layout>
<@layout.registrationLayout bodyClass="card-layout" displayMessage=true; section>

  <#if section = "header">
  <#elseif section = "form">

  <div class="card-layout">
    <div class="card">

      <#if message?has_content && (message.type = "success" || message.summary?contains("email"))>

        <h1 class="card-title">E-mail envoyé !</h1>

        <div class="email-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3">
            <rect x="10" y="25" width="65" height="50" rx="4"/>
            <polyline points="10,25 42,55 75,25"/>
            <circle cx="78" cy="32" r="14" fill="white" stroke="currentColor" stroke-width="3"/>
            <polyline points="70,32 76,38 87,26" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <p class="card-desc">
          Un lien de réinitialisation a été envoyé à votre adresse email.
          Vérifiez votre boîte de réception.
        </p>

        <p class="expire-msg">
          Le lien expire dans 15 minutes. Pensez à vérifier vos spams.
        </p>

        <a href="${url.loginUrl}" class="btn-back">&lt; Retour à la connexion</a>

      <#else>

        <h1 class="card-title">Mot de passe oublié ?</h1>

        <p class="card-desc">
          Entrez votre adresse e-mail et nous vous enverrons un lien
          pour réinitialiser votre mot de passe.
        </p>

        <#if message?has_content && message.type = "error">
          <div class="alert-error">${message.summary}</div>
        </#if>

        <form action="${url.loginAction}" method="post">
          <div class="field-group">
            <input
              type="email"
              name="username"
              class="form-input <#if messagesPerField.existsError('username')>error</#if>"
              placeholder="Confirmez votre adresse email"
              value="${(auth.attemptedUsername!'')}"
              autocomplete="email"
            />
            <#if messagesPerField.existsError('username')>
              <span class="error-msg">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
            </#if>
          </div>

          <button type="submit" class="btn-green">
            Envoyer le lien de réinitialisation
          </button>

          <div class="divider">ou</div>

          <a href="${url.loginUrl}" class="btn-back">&lt; Retour à la connexion</a>
        </form>

      </#if>

    </div>
  </div>

  </#if>
</@layout.registrationLayout>