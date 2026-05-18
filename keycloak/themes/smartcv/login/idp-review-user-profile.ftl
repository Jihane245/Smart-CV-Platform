<#import "template.ftl" as layout>
<@layout.registrationLayout bodyClass="card-layout" displayMessage=true; section>

  <#if section = "header">
  <#elseif section = "form">

  <div class="card-layout">
    <div class="card">

      <h1 class="card-title">Compte existant</h1>

      <p class="card-desc">
        Un compte existe déjà avec cette adresse email.
        Veuillez vous connecter ou lier votre compte Google.
      </p>

      <#if message?has_content && message.type = "error">
        <div class="alert-error">${message.summary}</div>
      </#if>

      <form action="${url.loginAction}" method="post">
        <#list profile.attributes as attribute>
          <div class="field-group">
            <input
              type="text"
              name="${attribute.name}"
              class="form-input"
              placeholder="${attribute.displayName!attribute.name}"
              value="${(attribute.value!'')}"
            />
          </div>
        </#list>

        <button type="submit" class="btn-submit">Continuer</button>
        <a href="${url.loginUrl}" class="btn-back">&lt; Retour à la connexion</a>
      </form>

    </div>
  </div>

  </#if>
</@layout.registrationLayout>