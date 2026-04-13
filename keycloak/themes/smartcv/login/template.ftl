<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${msg("loginTitle",(realm.displayName!''))}</title>
  <link rel="stylesheet" href="${url.resourcesPath}/css/styles.css">
</head>
<body class="${bodyClass}">
  <#nested "header">
  <#nested "form">
  <#if displayInfo>
    <#nested "info">
  </#if>
</body>
</html>
</#macro>