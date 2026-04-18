using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Security.Claims;
 

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        [HttpGet("login")]
        public IActionResult Login(string returnUrl = "/")
        {
            return Challenge(
                new AuthenticationProperties { RedirectUri = returnUrl },
                OpenIdConnectDefaults.AuthenticationScheme
            );
        }

        [HttpGet("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            return SignOut(
                new AuthenticationProperties
                {
                    RedirectUri = "/"
                },
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

        var httpClient = new HttpClient();

        // 1. On récupère un token admin pour pouvoir appeler l'API Keycloak
        var adminTokenResponse = await httpClient.PostAsync(
            "http://localhost:8080/realms/master/protocol/openid-connect/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "password",
                ["client_id"]  = "admin-cli",
                ["username"]   = "admin",
                ["password"]   = "admin"
            })
        );

        if (!adminTokenResponse.IsSuccessStatusCode)
        {
            var error = await adminTokenResponse.Content.ReadAsStringAsync();
            Console.WriteLine($"Admin token error: {error}");
            return StatusCode(500, new { message = "Erreur serveur", detail = error });
        }

        var adminTokenJson = System.Text.Json.JsonDocument.Parse(
            await adminTokenResponse.Content.ReadAsStringAsync());
        var adminToken = adminTokenJson.RootElement
            .GetProperty("access_token").GetString();

        // 2. On cherche l'user par email dans Keycloak
        httpClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", adminToken);

        var usersResponse = await httpClient.GetAsync(
            $"http://localhost:8080/admin/realms/cv-platform/users?email={request.Email}&exact=true"
        );

        var usersContent = await usersResponse.Content.ReadAsStringAsync();
        Console.WriteLine($"Keycloak users response: {usersContent}");

        if (!usersContent.TrimStart().StartsWith("["))
            return StatusCode(500, new { message = "Erreur recherche", detail = usersContent });

        var usersJson = System.Text.Json.JsonDocument.Parse(usersContent);
        var users = usersJson.RootElement.EnumerateArray().ToList();

        // 3. Même si l'email n'existe pas, on retourne le même message
        // (sécurité : on ne révèle pas si l'email existe ou non)
        if (users.Count == 0)
            return Ok(new { message = "Si cet email existe, un lien de réinitialisation a été envoyé" });

        var userId = users[0].GetProperty("id").GetString();

        // 4. On demande à Keycloak d'envoyer l'email de reset
        var resetResponse = await httpClient.PutAsync(
            $"http://localhost:8080/admin/realms/plateformecv/users/{userId}/execute-actions-email",
            new StringContent(
                "[\"UPDATE_PASSWORD\"]",
                System.Text.Encoding.UTF8,
                "application/json"
            )
        );

        if (!resetResponse.IsSuccessStatusCode)
            return StatusCode(500, new { message = "Erreur lors de l'envoi de l'email" });

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