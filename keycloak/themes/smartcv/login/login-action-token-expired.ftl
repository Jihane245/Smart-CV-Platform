<#import "template.ftl" as layout>
<@layout.registrationLayout bodyClass="card-layout" displayMessage=false; section>

  <#if section = "header">
  <#elseif section = "form">

  <div class="card-layout">
    <div class="card">

      <h1 class="card-title" style="color: var(--red-accent);">Lien expiré</h1>

      <div style="width: 80px; height: 80px; margin: 1rem auto 1.5rem; color: var(--brown-mid);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>

      <p class="card-desc">
        Ce lien a expiré ou a déjà été utilisé.
        Veuillez faire une nouvelle demande.
      </p>

      <a href="${url.loginUrl}" class="btn-submit" style="display:block; text-align:center; text-decoration:none; margin-top: 1.5rem;">
        Retour à la connexion
      </a>

    </div>
  </div>

  </#if>
</@layout.registrationLayout>