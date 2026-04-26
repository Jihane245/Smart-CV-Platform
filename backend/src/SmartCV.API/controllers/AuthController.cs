using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using API.services;
using System.Linq;
using System.Security.Claims;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly KeycloakAdminService _keycloakAdmin;

        public AuthController(KeycloakAdminService keycloakAdmin)
        {
            _keycloakAdmin = keycloakAdmin;
        }

        [HttpGet("login")]
        public IActionResult Login(string returnUrl = "/")
        {
            return Challenge(
                new AuthenticationProperties { RedirectUri = returnUrl },
                OpenIdConnectDefaults.AuthenticationScheme
            );
        }

        [HttpGet("logout")]
        public IActionResult Logout()
        {
            // Sign-out both the local cookie and the OIDC session.
            // Important: don't clear the cookie first, otherwise the OIDC handler can't access
            // the id_token claim used as id_token_hint for Keycloak logout.
            return SignOut(
                new AuthenticationProperties
                {
                    RedirectUri = "http://localhost/connexion"
                },
                CookieAuthenticationDefaults.AuthenticationScheme,
                OpenIdConnectDefaults.AuthenticationScheme
            );
        }

    public class ForgotPasswordRequest 
    { 
        public string Email { get; set; } = string.Empty; 
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.Email))
            return BadRequest("Email requis");

        // Sécurité : réponse identique que l'email existe ou non.
        try
        {
            var ok = await _keycloakAdmin.SendUpdatePasswordEmailAsync(request.Email);
            if (!ok)
                return StatusCode(500, new { message = "Erreur lors de l'envoi de l'email" });
        }
        catch
        {
            return StatusCode(500, new { message = "Erreur serveur" });
        }

        return Ok(new { message = "Si cet email existe, un lien de réinitialisation a été envoyé" });
    }
        [HttpGet("admin")]  // TA TÂCHE 3 - Role security
        [Authorize(Policy = "Admin")]
        public IActionResult AdminOnly()
        {
            return Ok(new { message = "Super Admin Access !", user = User.Identity?.Name });
        }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var result = new
        {
            Name = User.Identity?.Name,
            Claims = User.Claims.Select(c => new { c.Type, c.Value })
        };
        return Ok(result);
    } 

    [HttpGet("status")]
    [AllowAnonymous]
    public IActionResult Status()
    {
        return Ok(new
        {
            IsAuthenticated = User.Identity?.IsAuthenticated ?? false,
            IdentityName = User.Identity?.Name,
            PreferredUsername = User.FindFirst("preferred_username")?.Value,
            Email = User.FindFirst(ClaimTypes.Email)?.Value ?? User.FindFirst("email")?.Value,
            Name = User.FindFirst("name")?.Value,
            GivenName = User.FindFirst(ClaimTypes.GivenName)?.Value ?? User.FindFirst("given_name")?.Value,
            Surname = User.FindFirst(ClaimTypes.Surname)?.Value ?? User.FindFirst("family_name")?.Value
        });
    }

    [HttpGet("error")]
    public IActionResult Error([FromQuery] string message)
    {
        return BadRequest(new { error = message });
    }
}
}