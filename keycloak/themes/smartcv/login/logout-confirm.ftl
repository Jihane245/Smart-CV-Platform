<#import "template.ftl" as layout>
<@layout.registrationLayout bodyClass="card-layout"; section>

  <#if section = "header">
  <#elseif section = "form">

  <div class="card-layout">
    <div class="card">

      <h1 class="card-title">Déconnexion</h1>

      <div class="email-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M40 20 H22 a4 4 0 0 0 -4 4 v52 a4 4 0 0 0 4 4 H40"/>
          <polyline points="62,32 80,50 62,68"/>
          <line x1="80" y1="50" x2="40" y2="50"/>
        </svg>
      </div>

      <p class="card-desc">
        Voulez-vous vraiment vous déconnecter de votre compte ?
      </p>

      <form action="${url.logoutConfirmAction}" method="POST" class="logout-form">
        <input type="hidden" name="session_code" value="${logoutConfirm.code}">

        <div class="btn-row">
          <button type="submit" name="confirmLogout" class="btn-red">
            Se déconnecter
          </button>

          <#if !logoutConfirm.skipLink && (client.baseUrl)??>
            <a href="${client.baseUrl}" class="btn-back">Annuler</a>
          <#else>
            <a href="javascript:history.back()" class="btn-back">Annuler</a>
          </#if>
        </div>
      </form>

    </div>
  </div>

  </#if>
</@layout.registrationLayout>
