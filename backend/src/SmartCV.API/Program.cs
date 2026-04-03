using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using API.data;
using API.models;
using API.models.Enums;

var builder = WebApplication.CreateBuilder(args);

// ===== DB =====
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ===== Auth Keycloak =====
var keycloakConfig = builder.Configuration.GetSection("Keycloak");

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
})
.AddOpenIdConnect(OpenIdConnectDefaults.AuthenticationScheme, options =>
{
    options.Authority = keycloakConfig["Authority"];
    options.MetadataAddress = keycloakConfig["MetadataAddress"];
    options.Authority = keycloakConfig["Authority"];
    options.ClientId = keycloakConfig["ClientId"];
    options.ClientSecret = keycloakConfig["ClientSecret"];
    options.ResponseType = OpenIdConnectResponseType.Code;

    options.SaveTokens = true;
    options.RequireHttpsMetadata = false; // local dev
    options.CallbackPath = "/signin-oidc";
    options.SignedOutCallbackPath = "/signout-callback-oidc";
    options.GetClaimsFromUserInfoEndpoint = true;
    options.MapInboundClaims = false;
    options.PushedAuthorizationBehavior = PushedAuthorizationBehavior.Disable;

    options.Scope.Clear();
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("email");

    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = "preferred_username"
    };

    options.Events = new OpenIdConnectEvents
    {
        OnTokenValidated = async ctx =>
        {
            var email = ctx.Principal?.FindFirstValue("email");
            if (string.IsNullOrEmpty(email))
                return;

            using var scope = ctx.HttpContext.RequestServices.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                db.Users.Add(new User
                {
                    Email = email,
                    Nom = ctx.Principal?.FindFirstValue("family_name") ?? "Unknown",
                    Prenom = ctx.Principal?.FindFirstValue("given_name") ?? "Unknown",
                    PasswordHash = Guid.NewGuid().ToString(),
                    Role = RoleUtilisateur.Candidat
                });

                await db.SaveChangesAsync();
            }
        },
        OnRedirectToIdentityProviderForSignOut = async ctx =>
        {
            var idToken = await ctx.HttpContext.GetTokenAsync("id_token");

            ctx.ProtocolMessage.PostLogoutRedirectUri = "http://localhost:5000/";

            if (!string.IsNullOrEmpty(idToken))
            {
                ctx.ProtocolMessage.IdTokenHint = idToken;
            }
        },
        OnRemoteFailure = ctx =>
        {
            ctx.Response.Redirect("/api/auth/error?message=" +
                Uri.EscapeDataString(ctx.Failure?.Message ?? "unknown"));
            ctx.HandleResponse();
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/", () => Results.Ok("API is running"));

app.Run();