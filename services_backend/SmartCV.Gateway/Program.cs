  using Microsoft.AspNetCore.Authentication.JwtBearer;
  using Microsoft.IdentityModel.Tokens;

  var builder = WebApplication.CreateBuilder(args);

  // ===== YARP Reverse Proxy =====
  builder.Services.AddReverseProxy()
      .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

  // ===== JWT Auth (validation Keycloak) =====
  var keycloak = builder.Configuration.GetSection("Keycloak");
  builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
      .AddJwtBearer(options =>
      {
          options.Authority = keycloak["Authority"];
          options.MetadataAddress = keycloak["MetadataAddress"];
          options.RequireHttpsMetadata = false;
          options.MapInboundClaims = false;
          options.TokenValidationParameters = new TokenValidationParameters
          {
              ValidateIssuer = false,
              ValidateAudience = false,
              ValidateLifetime = true,
              ClockSkew = TimeSpan.Zero,
              RoleClaimType = "role"
          };
      });

  builder.Services.AddAuthorization();

  // ===== CORS pour Angular =====
  builder.Services.AddCors(opt => opt.AddDefaultPolicy(p => p
      .WithOrigins("http://localhost", "http://localhost:4200", "https://cevia.duckdns.org")
      .AllowAnyHeader()
      .AllowAnyMethod()
      .AllowCredentials()));

  var app = builder.Build();

  app.UseCors();
  app.UseAuthentication();
  app.UseAuthorization();

  app.MapReverseProxy();
  app.MapGet("/", () => "Gateway YARP is running");
  app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

  app.Run();