<#import "template.ftl" as layout>
<@layout.registrationLayout bodyClass="card-layout" displayMessage=true; section>

  <#if section = "header">
  <#elseif section = "form">

  <div class="card-layout">
    <div class="card">

      <h1 class="card-title">Lier votre compte</h1>

      <p class="card-desc">
        Un compte existe déjà avec cette adresse email.
        Voulez-vous lier votre compte Google à ce compte existant ?
      </p>

      <form action="${url.loginAction}" method="post">
        <button type="submit" name="submitAction" value="updateProfile" class="btn-submit">
          Lier le compte
        </button>
        <button type="submit" name="submitAction" value="linkAccount" class="btn-green" style="margin-top:0.75rem">
          Créer un nouveau compte
        </button>
        <a href="${url.loginUrl}" class="btn-back">&lt; Retour à la connexion</a>
      </form>

    </div>
  </div>

  </#if>
</@layout.registrationLayout>