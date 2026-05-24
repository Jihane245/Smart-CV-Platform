using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.HttpOverrides;
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
builder.Services.AddScoped<ICoverLetterAiClient, CoverLetterAiClient>();
builder.Services.AddScoped<ICoverLetterService, CoverLetterService>();
builder.Services.AddScoped<IPdfTextExtractor, PdfTextExtractor>();

// ===== Forwarded Headers (derrière Caddy) =====
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// ===== DB =====
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ===== Keycloak config =====
var keycloakConfig = builder.Configuration.GetSection("Keycloak");

// ===== App URLs config =====
var frontendUrl = builder.Configuration["App:FrontendUrl"] ?? "http://localhost";
var backendUrl = builder.Configuration["App:BackendUrl"] ?? "http://localhost:5000";

// =======================================================
// AUTHENTICATION (OIDC + JWT)
// =======================================================
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
// ===== Cookie =====
.AddCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
})
// ===== OpenID Connect =====
.AddOpenIdConnect(OpenIdConnectDefaults.AuthenticationScheme, options =>
{
    // ✅ HostRewritingHandler supprimé — Keycloak accessible via IP Tailscale directement

    options.Authority = keycloakConfig["Authority"];
    options.MetadataAddress = keycloakConfig["MetadataAddress"];
    options.ClientId = keycloakConfig["ClientId"];
    options.ClientSecret = keycloakConfig["ClientSecret"];
    options.ResponseType = OpenIdConnectResponseType.Code;

    options.SaveTokens = true;
    options.RequireHttpsMetadata = false;
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
                if (!id.HasClaim(c => c.Type == "id_token"))
                    id.AddClaim(new Claim("id_token", idToken));
            }
            return Task.CompletedTask;
        },
        OnTokenValidated = async ctx =>
        {
            var email = ctx.Principal?.FindFirstValue("email");
            if (string.IsNullOrEmpty(email)) return;

            var rolesKeycloak = ctx.Principal?.FindAll("role").Select(c => c.Value).ToList()
                                ?? new List<string>();
            var estAdmin = rolesKeycloak.Contains("Admin");

            using var scope = ctx.HttpContext.RequestServices.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var user = await db.Users.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == email.ToLower());
            var roleAttendu = estAdmin ? RoleUtilisateur.Admin : RoleUtilisateur.Candidat;

            if (user == null)
            {
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
            else
            {
                if (!user.IsActif)
                {
                    var config = ctx.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
                    var frontendUrl = (config["FRONTEND_URL"] ?? "http://localhost").TrimEnd('/');
                    ctx.HandleResponse();
                    ctx.Response.Redirect($"{frontendUrl}/connexion?authError=account_disabled");
                    return;
                }

                if (user.Role != roleAttendu)
                {
                    user.Role = roleAttendu;
                    await db.SaveChangesAsync();
                }
            }
        },

        OnRedirectToIdentityProviderForSignOut = async ctx =>
        {
            var config = ctx.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var frontendUrl = config["FRONTEND_URL"];
            if (string.IsNullOrWhiteSpace(frontendUrl)) frontendUrl = "http://localhost";
            frontendUrl = frontendUrl.TrimEnd('/');

            var idToken = await ctx.HttpContext.GetTokenAsync("id_token");
            ctx.ProtocolMessage.PostLogoutRedirectUri = $"{frontendUrl}/connexion";

            if (!string.IsNullOrEmpty(idToken))
                ctx.ProtocolMessage.IdTokenHint = idToken;
        },

        OnRemoteFailure = ctx =>
        {
            // ✅ URL dynamique depuis config
            ctx.Response.Redirect($"{frontendUrl}/api/auth/login");
            ctx.HandleResponse();
            return Task.CompletedTask;
        }
    };
})
.AddJwtBearer("Bearer", options =>
{
    // ✅ depuis config, pas hardcodé
    options.Authority = keycloakConfig["Authority"];
    options.RequireHttpsMetadata = false;
    options.Audience = keycloakConfig["ClientId"];

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
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
        // ✅ CORS dynamique depuis config
        policy.WithOrigins(
            frontendUrl,
            "http://localhost",
            "http://localhost:80"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

builder.Services.AddHttpClient();
builder.Services.AddScoped<KeycloakAdminService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSingleton<IWebHostEnvironment>(builder.Environment);

// ===== OpenAPI =====
builder.Services.AddOpenApi();

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var app = builder.Build();

// ===== Forwarded Headers DOIT être en premier =====
app.UseForwardedHeaders();

// ===== Migrations automatiques avec fallback =====
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        var pendingMigrations = db.Database.GetPendingMigrations().ToList();
        if (pendingMigrations.Any())
        {
            Console.WriteLine($"📦 Application de {pendingMigrations.Count()} migrations : {string.Join(", ", pendingMigrations)}");
            db.Database.Migrate();
            Console.WriteLine("✅ Migrations appliquées avec succès");
        }
        else
        {
            Console.WriteLine("✅ Aucune migration en attente. Base de données à jour.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Erreur de migration: {ex.Message}");
        Console.WriteLine("⚠️ Démarrage forcé de l'application sans appliquer les migrations.");
        Console.WriteLine("⚠️ Certaines fonctionnalités pourraient être affectées si le modèle et la base ne sont pas synchronisés.");
    }
}

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

_ = Task.Run(() => PdfGenerationService.WarmUpAsync());

app.Run();