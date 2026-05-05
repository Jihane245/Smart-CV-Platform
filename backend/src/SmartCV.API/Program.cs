using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using API.data;
using API.models;
using API.models.Enums;
using API.services;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IPdfGenerationService, PdfGenerationService>();


// ===== DB =====
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ===== Keycloak config =====
var keycloakConfig = builder.Configuration.GetSection("Keycloak");

// =======================================================
// AUTHENTICATION (OIDC + JWT)
// =======================================================
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
// ===== Cookie (frontend login session) =====
.AddCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
})
// ===== OpenID Connect (Angular login redirect) =====
.AddOpenIdConnect(OpenIdConnectDefaults.AuthenticationScheme, options =>
{
    options.BackchannelHttpHandler =
        new HostRewritingHandler("localhost:8080", "keycloak:8080");

    options.Authority = keycloakConfig["Authority"];
    options.MetadataAddress = keycloakConfig["MetadataAddress"];
    options.ClientId = keycloakConfig["ClientId"];
    options.ClientSecret = keycloakConfig["ClientSecret"];
    options.ResponseType = OpenIdConnectResponseType.Code;

    // Don't persist tokens in the auth session unless strictly needed.
    options.SaveTokens = true;
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
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
        ValidateIssuer = false,
        ValidIssuer = keycloakConfig["Authority"],
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,

        NameClaimType = "preferred_username",

        RoleClaimType = "role"
    };

    options.Events = new OpenIdConnectEvents
    {
        OnTokenResponseReceived = ctx =>
        {
            
            var idToken = ctx.TokenEndpointResponse?.IdToken;
            if (!string.IsNullOrWhiteSpace(idToken) && ctx.Principal?.Identity is ClaimsIdentity id)
            {
                // Avoid duplicating if the handler runs again.
                if (!id.HasClaim(c => c.Type == "id_token"))
                    id.AddClaim(new Claim("id_token", idToken));
            }
            return Task.CompletedTask;
        },
        OnTokenValidated = async ctx =>
        {
            var email = ctx.Principal?.FindFirstValue("email");
            if (string.IsNullOrEmpty(email)) return;

            // Récupère les rôles Keycloak depuis le token (claim "role")
            var rolesKeycloak = ctx.Principal?.FindAll("role").Select(c => c.Value).ToList()
                                ?? new List<string>();
            var estAdmin = rolesKeycloak.Contains("Admin");

            using var scope = ctx.HttpContext.RequestServices.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
            var roleAttendu = estAdmin ? RoleUtilisateur.Admin : RoleUtilisateur.Candidat;

            if (user == null)
            {
                // Nouvel utilisateur : créé avec le bon rôle
                db.Users.Add(new User
                {
                    Email = email,
                    Nom = ctx.Principal?.FindFirstValue("family_name") ?? "Unknown",
                    Prenom = ctx.Principal?.FindFirstValue("given_name") ?? "Unknown",
                    PasswordHash = Guid.NewGuid().ToString(),
                    Role = roleAttendu
                });
                await db.SaveChangesAsync();
            }
            else if (user.Role != roleAttendu)
            {
                // Utilisateur existant : on met à jour son rôle si changé côté Keycloak
                user.Role = roleAttendu;
                await db.SaveChangesAsync();
            }
        },

        OnRedirectToIdentityProviderForSignOut = async ctx =>
        {
            var idToken = await ctx.HttpContext.GetTokenAsync("id_token");
            ctx.ProtocolMessage.PostLogoutRedirectUri = "http://localhost:80/";
            if (!string.IsNullOrEmpty(idToken))
                ctx.ProtocolMessage.IdTokenHint = idToken;
        },

        OnRemoteFailure = ctx =>
        {
            ctx.Response.Redirect("http://localhost:5000/api/auth/login");
            ctx.HandleResponse();
            return Task.CompletedTask;
        }
    };
})

// ===========
// JWT BEARER
// ===========
.AddJwtBearer("Bearer", options =>
{
    options.Authority = keycloakConfig["Authority"];
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    //options.Audience = keycloakConfig["ClientId"];
options.MapInboundClaims = false; 

    options.BackchannelHttpHandler = new HostRewritingHandler("localhost:8080", "keycloak:8080");
    
    if (!string.IsNullOrEmpty(keycloakConfig["MetadataAddress"]))
    {
        options.MetadataAddress = keycloakConfig["MetadataAddress"];
    }

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false, // Désactivé car l'issuer Keycloak diffère entre Docker (keycloak:8080) et le frontend (localhost:8080)
        ValidateAudience = false,
        ValidAudience = keycloakConfig["ClientId"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        NameClaimType = "preferred_username",

        RoleClaimType = "role"
    };
});

// ===== AUTHORIZATION =====
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireRole("Admin"));
    options.AddPolicy("User", policy => policy.RequireRole("User", "Admin"));
});

// ===== CORS =====
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost", "http://localhost:80")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddHttpClient();
builder.Services.AddScoped<KeycloakAdminService>();
builder.Services.AddScoped<ICoverLetterAiClient, CoverLetterAiClient>();
builder.Services.AddScoped<ICoverLetterService, CoverLetterService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton<IWebHostEnvironment>(builder.Environment);

// ===== OpenAPI (.NET 10) =====
builder.Services.AddOpenApi();

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

//app.UseHttpsRedirection();
app.UseCors();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/", () => Results.Ok("API is running"));

// Warm-up Chromium en arrière-plan pour que la 1ère génération PDF soit rapide
_ = Task.Run(() => PdfGenerationService.WarmUpAsync());

app.Run();