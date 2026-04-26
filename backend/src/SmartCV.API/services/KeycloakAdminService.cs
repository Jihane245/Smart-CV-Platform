using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace API.services;

public class KeycloakAdminService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;

    public KeycloakAdminService(IHttpClientFactory httpFactory, IConfiguration config)
    {
        _httpFactory = httpFactory;
        _config = config;
    }

    private string BaseUrl => _config["Keycloak:AdminBaseUrl"] ?? "http://keycloak:8080";
    private string Realm   => _config["Keycloak:Realm"]        ?? "cv-platform";

    private async Task<HttpClient> CreateAuthenticatedClientAsync()
    {
        var client = _httpFactory.CreateClient();

        var tokenResponse = await client.PostAsync(
            $"{BaseUrl}/realms/master/protocol/openid-connect/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "password",
                ["client_id"]  = "admin-cli",
                ["username"]   = "admin",
                ["password"]   = "admin"
            })
        );

        if (!tokenResponse.IsSuccessStatusCode)
        {
            var err = await tokenResponse.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Keycloak admin token failed: {err}");
        }

        using var doc = JsonDocument.Parse(await tokenResponse.Content.ReadAsStringAsync());
        var token = doc.RootElement.GetProperty("access_token").GetString();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private async Task<string?> FindUserIdByEmailAsync(HttpClient client, string email)
    {
        var resp = await client.GetAsync(
            $"{BaseUrl}/admin/realms/{Realm}/users?email={Uri.EscapeDataString(email)}&exact=true"
        );

        if (!resp.IsSuccessStatusCode) return null;

        var body = await resp.Content.ReadAsStringAsync();
        if (!body.TrimStart().StartsWith("[")) return null;

        using var doc = JsonDocument.Parse(body);
        var users = doc.RootElement.EnumerateArray().ToList();
        if (users.Count == 0) return null;

        return users[0].GetProperty("id").GetString();
    }

    public async Task<bool> SetUserEnabledAsync(string email, bool enabled)
    {
        var client = await CreateAuthenticatedClientAsync();
        var userId = await FindUserIdByEmailAsync(client, email);
        if (userId == null) return false;

        var payload = JsonSerializer.Serialize(new { enabled });
        var resp = await client.PutAsync(
            $"{BaseUrl}/admin/realms/{Realm}/users/{userId}",
            new StringContent(payload, Encoding.UTF8, "application/json")
        );

        return resp.IsSuccessStatusCode;
    }

    public async Task<bool> DeleteUserAsync(string email)
    {
        var client = await CreateAuthenticatedClientAsync();
        var userId = await FindUserIdByEmailAsync(client, email);
        if (userId == null) return true; // already gone

        var resp = await client.DeleteAsync($"{BaseUrl}/admin/realms/{Realm}/users/{userId}");
        return resp.IsSuccessStatusCode;
    }
}
