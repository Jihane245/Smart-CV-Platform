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
        private readonly IConfiguration _configuration;
        private readonly HashSet<string> _allowedOrigins;

        public AuthController(KeycloakAdminService keycloakAdmin, IConfiguration configuration)
        {
            _keycloakAdmin = keycloakAdmin;
            _configuration = configuration;

            var frontendUrl = _configuration["FRONTEND_URL"] ?? "http://localhost:80";
            _allowedOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "http://localhost",
                "http://localhost:80",
                frontendUrl
            };
        }

        [HttpGet("login")]
        public IActionResult Login(string returnUrl = "/")
        {
            return Challenge(
                new AuthenticationProperties { RedirectUri = returnUrl },
                OpenIdConnectDefaults.AuthenticationScheme
            );
        }

        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            var origin = Request.Headers.Origin.ToString();
            if (!string.IsNullOrWhiteSpace(origin) && !_allowedOrigins.Contains(origin))
                return Forbid();

            var referer = Request.Headers.Referer.ToString();
            if (string.IsNullOrWhiteSpace(origin) &&
                !string.IsNullOrWhiteSpace(referer) &&
                !_allowedOrigins.Any(o => referer.StartsWith(o + "/", StringComparison.OrdinalIgnoreCase)))
            {
                return Forbid();
            }

            var frontendUrl = _configuration["FRONTEND_URL"] ?? "http://localhost";
            return SignOut(
                new AuthenticationProperties
                {
                    RedirectUri = $"{frontendUrl}/connexion"
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

        [HttpGet("admin")]
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
