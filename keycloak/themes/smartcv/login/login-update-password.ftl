<#import "template.ftl" as layout>
<@layout.registrationLayout bodyClass="card-layout" displayMessage=true; section>

  <#if section = "header">
  <#elseif section = "form">

  <div class="card-layout">
    <div class="card">

      <h1 class="card-title">Nouveau mot de passe</h1>

      <p class="card-desc">
        Choisissez un nouveau mot de passe pour votre compte.
      </p>

      <#if message?has_content && message.type = "error">
        <div class="alert-error">${message.summary}</div>
      </#if>

      <form action="${url.loginAction}" method="post">

        <div class="field-group">
          <div class="input-wrapper">
            <input
              type="password"
              name="password-new"
              class="form-input <#if messagesPerField.existsError('password-new')>error</#if>"
              placeholder="Nouveau mot de passe"
              autocomplete="new-password"
            />
          </div>
          <#if messagesPerField.existsError('password-new')>
            <span class="error-msg">${kcSanitize(messagesPerField.get('password-new'))?no_esc}</span>
          </#if>
        </div>

        <div class="field-group">
          <div class="input-wrapper">
            <input
              type="password"
              name="password-confirm"
              class="form-input <#if messagesPerField.existsError('password-confirm')>error</#if>"
              placeholder="Confirmer le nouveau mot de passe"
              autocomplete="new-password"
            />
          </div>
          <#if messagesPerField.existsError('password-confirm')>
            <span class="error-msg">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</span>
          </#if>
        </div>

        <button type="submit" class="btn-submit">
          Réinitialiser le mot de passe
        </button>

      </form>

    </div>
  </div>

  </#if>
</@layout.registrationLayout>