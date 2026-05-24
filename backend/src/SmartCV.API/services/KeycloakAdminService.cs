using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

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
    private string AdminRealm => _config["Keycloak:AdminRealm"] ?? "master";
    private string ClientId => _config["Keycloak:AdminClientId"] ?? "";
    private string ClientSecret => _config["Keycloak:AdminClientSecret"] ?? "";

    private async Task<HttpClient> CreateAuthenticatedClientAsync()
    {
        var client = _httpFactory.CreateClient();

        if (!string.IsNullOrWhiteSpace(ClientId) && !string.IsNullOrWhiteSpace(ClientSecret))
        {
            var serviceToken = await TryClientCredentialsTokenAsync(client);
            if (!string.IsNullOrEmpty(serviceToken))
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", serviceToken);
                if (await CanManageUsersAsync(client))
                    return client;
                client.DefaultRequestHeaders.Authorization = null;
            }
        }

        var adminToken = await TryAdminPasswordTokenAsync(client);
        if (string.IsNullOrEmpty(adminToken))
        {
            throw new InvalidOperationException(
                "Keycloak admin authentication failed. Configure admin client or admin user credentials."
            );
        }

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        return client;
    }

    private async Task<string?> TryClientCredentialsTokenAsync(HttpClient client)
    {
        var resp = await client.PostAsync(
            $"{BaseUrl}/realms/{AdminRealm}/protocol/openid-connect/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials",
                ["client_id"] = ClientId,
                ["client_secret"] = ClientSecret,
            })
        );

        if (!resp.IsSuccessStatusCode)
            return null;

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("access_token").GetString();
    }

    private async Task<string?> TryAdminPasswordTokenAsync(HttpClient client)
    {
        var username = _config["Keycloak:AdminUser"];
        var password = _config["Keycloak:AdminPassword"];
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            return null;

        var resp = await client.PostAsync(
            $"{BaseUrl}/realms/master/protocol/openid-connect/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "password",
                ["client_id"] = "admin-cli",
                ["username"] = username,
                ["password"] = password,
            })
        );

        if (!resp.IsSuccessStatusCode)
            return null;

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("access_token").GetString();
    }

    private async Task<bool> CanManageUsersAsync(HttpClient client)
    {
        var resp = await client.GetAsync($"{BaseUrl}/admin/realms/{Realm}/users?max=1");
        return resp.IsSuccessStatusCode;
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
        if (userId == null)
            return false;

        var getResp = await client.GetAsync($"{BaseUrl}/admin/realms/{Realm}/users/{userId}");
        if (!getResp.IsSuccessStatusCode)
            return false;

        var userNode = JsonNode.Parse(await getResp.Content.ReadAsStringAsync())?.AsObject();
        if (userNode == null)
            return false;

        userNode["enabled"] = enabled;

        var putResp = await client.PutAsync(
            $"{BaseUrl}/admin/realms/{Realm}/users/{userId}",
            new StringContent(userNode.ToJsonString(), Encoding.UTF8, "application/json")
        );

        return putResp.IsSuccessStatusCode;
    }

    public async Task<bool> DeleteUserAsync(string email)
    {
        var client = await CreateAuthenticatedClientAsync();
        var userId = await FindUserIdByEmailAsync(client, email);
        if (userId == null) return true; // already gone

        var resp = await client.DeleteAsync($"{BaseUrl}/admin/realms/{Realm}/users/{userId}");
        return resp.IsSuccessStatusCode;
    }

    public async Task<bool> SendUpdatePasswordEmailAsync(string email)
    {
        var client = await CreateAuthenticatedClientAsync();
        var userId = await FindUserIdByEmailAsync(client, email);
        if (userId == null) return true; // do not reveal existence

        var resp = await client.PutAsync(
            $"{BaseUrl}/admin/realms/{Realm}/users/{userId}/execute-actions-email",
            new StringContent("[\"UPDATE_PASSWORD\"]", Encoding.UTF8, "application/json")
        );

        return resp.IsSuccessStatusCode;
    }

    public async Task<bool> ResetPasswordAsync(string email, string newPassword)
    {
        var client = await CreateAuthenticatedClientAsync();
        var userId = await FindUserIdByEmailAsync(client, email);
        if (userId == null) return false;

        var payload = JsonSerializer.Serialize(new
        {
            type      = "password",
            value     = newPassword,
            temporary = false,
        });

        var response = await client.PutAsync(
            $"{BaseUrl}/admin/realms/{Realm}/users/{userId}/reset-password",
            new StringContent(payload, Encoding.UTF8, "application/json")
        );
        return response.IsSuccessStatusCode;
    }
    
}
