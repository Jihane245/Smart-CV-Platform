using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using API.models;

namespace API.services;

public class CoverLetterAiClient : ICoverLetterAiClient
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;

    public CoverLetterAiClient(IHttpClientFactory httpFactory, IConfiguration config)
    {
        _httpFactory = httpFactory;
        _config = config;
    }

    private string BaseUrl => (_config["IA_SERVICE_URL"] ?? string.Empty).TrimEnd('/');

    public async Task<string> GenerateCoverLetterAsync(User user, Offre offre, AnalyseOffre analyseOffre)
    {
        if (string.IsNullOrWhiteSpace(BaseUrl))
            throw new InvalidOperationException("IA_SERVICE_URL is not configured.");

        var client = _httpFactory.CreateClient();

        var request = new
        {
            user = new
            {
                id = user.Id,
                nom = user.Nom,
                prenom = user.Prenom,
                email = user.Email,
                profil = new
                {
                    titre = user.Profil?.Titre,
                    telephone = user.Profil?.Telephone,
                    adresse = user.Profil?.Adresse,
                    linkedIn = user.Profil?.LinkedIn,
                    description = user.Profil?.Description,

                    competences = user.Profil?.Competences?
                        .Select(c => c.Nom)
                        .ToList() ?? new List<string>(),

                    experiences = user.Profil?.Experiences?
                        .Select(e => new
                        {
                            e.Poste,
                            e.Entreprise,
                            e.DateDebut,
                            e.DateFin,
                            e.Description
                        })
                        .Cast<object>()
                        .ToList() ?? new List<object>(),

                    formations = user.Profil?.Formations?
                        .Select(f => new
                        {
                            f.Diplome,
                            f.Etablissement,
                            f.Annee,
                            f.Mention
                        })
                        .Cast<object>()
                        .ToList() ?? new List<object>(),

                    certificats = user.Profil?.Certificats?
                        .Select(c => new
                        {
                            c.Nom,
                            c.Organisme,
                            c.DateObtention,
                            c.DateExpiration,
                            c.Niveau
                        })
                        .Cast<object>()
                        .ToList() ?? new List<object>()
                }
            },

            offre = new
            {
                id = offre.Id,
                titre = offre.Titre,
                entreprise = offre.Entreprise,
                description = offre.Description,
                exigences = offre.Exigences,
                type_contrat = offre.TypeContrat,
                url_offre = offre.UrlOffre,
                date_publication = offre.DatePublication,
                date_expiration = offre.DateExpiration
            },

            analyse = new
            {
                mots_cles_extraits = analyseOffre.MotsClesExtraits,
                competences_requises = analyseOffre.CompetencesRequises,
                competences_match = analyseOffre.CompetencesMatch,
                competences_manquantes = analyseOffre.CompetencesManquantes,
                score_compatibilite = analyseOffre.ScoreCompatibilite,
                resume = analyseOffre.Resume,
                recommandations = analyseOffre.Recommandations
            }
        };

        var content = new StringContent(
            JsonSerializer.Serialize(request),
            Encoding.UTF8,
            "application/json"
        );

        var response = await client.PostAsync($"{BaseUrl}/coverletter/generate", content);

        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"AI service error: {response.StatusCode} - {body}"
            );
        }

        try
        {
            var document = JsonDocument.Parse(body);

            if (document.RootElement.TryGetProperty("contenu", out var contenuProp))
                return contenuProp.GetString() ?? string.Empty;

            if (document.RootElement.TryGetProperty("content", out var contentProp))
                return contentProp.GetString() ?? string.Empty;
        }
        catch (JsonException)
        {
            // fallback si texte brut
        }

        return body.Trim();
    }

    public async Task<AnalyseOffre> AnalyzeOfferTextAsync(string offreTexte, IEnumerable<string> profilCompetences)
    {
        if (string.IsNullOrWhiteSpace(BaseUrl))
            throw new InvalidOperationException("IA_SERVICE_URL is not configured.");

        var client = _httpFactory.CreateClient();

        var requestBody = new
        {
            texte = offreTexte,
            profil_competences = profilCompetences
        };

        var content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json"
        );

        var response = await client.PostAsync($"{BaseUrl}/analyze/text", content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"AI analyze error: {response.StatusCode} - {body}");

        return ParseAnalyzeResponse(body);
    }

    public async Task<AnalyseOffre> AnalyzeOfferImageAsync(byte[] imageBytes, string contentType)
    {
        if (string.IsNullOrWhiteSpace(BaseUrl))
            throw new InvalidOperationException("IA_SERVICE_URL is not configured.");

        var client = _httpFactory.CreateClient();
        using var formContent = new MultipartFormDataContent();
        formContent.Add(new StringContent("[]"), "profil_competences");

        var imageContent = new ByteArrayContent(imageBytes);
        imageContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        formContent.Add(imageContent, "image", "offre_image");

        var response = await client.PostAsync($"{BaseUrl}/analyze/image", formContent);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"AI analyze error: {response.StatusCode} - {body}");

        return ParseAnalyzeResponse(body);
    }

    private static AnalyseOffre ParseAnalyzeResponse(string body)
    {
        using var document = JsonDocument.Parse(body);
        var root = document.RootElement;

        var hardSkills = ReadStringArray(root, "hard_skills");
        var outils = ReadStringArray(root, "outils");
        var competencesMatch = ReadStringArray(root, "competences_match");
        var competencesManquantes = ReadStringArray(root, "competences_manquantes");
        var recommandations = root.TryGetProperty("recommandations", out var recProp)
            ? NormalizeRecommendations(recProp)
            : string.Empty;

        return new AnalyseOffre
        {
            MotsClesExtraits = hardSkills.Concat(outils).Distinct().ToList(),
            CompetencesRequises = hardSkills.Concat(outils).Distinct().ToList(),
            CompetencesMatch = competencesMatch,
            CompetencesManquantes = competencesManquantes,
            ScoreCompatibilite = GetFloatValue(root, "score_compatibilite"),
            Resume = root.TryGetProperty("resume", out var resumeProp) ? resumeProp.GetString() ?? string.Empty : string.Empty,
            Recommandations = recommandations,
            DateAnalyse = DateTime.UtcNow
        };
    }

    private static List<string> ReadStringArray(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var prop) || prop.ValueKind != JsonValueKind.Array)
            return new List<string>();

        var result = new List<string>();
        foreach (var item in prop.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.String)
                result.Add(item.GetString() ?? string.Empty);
        }

        return result.Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
    }

    private static float GetFloatValue(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var prop))
            return 0f;

        if (prop.ValueKind == JsonValueKind.Number)
        {
            if (prop.TryGetSingle(out var value))
                return value;
            if (prop.TryGetDouble(out var dbl))
                return (float)dbl;
        }

        if (prop.ValueKind == JsonValueKind.String && float.TryParse(prop.GetString(), out var parsed))
            return parsed;

        return 0f;
    }

    private static string NormalizeRecommendations(JsonElement recProp)
    {
        if (recProp.ValueKind == JsonValueKind.String)
            return recProp.GetString() ?? string.Empty;

        if (recProp.ValueKind == JsonValueKind.Object)
            return JsonSerializer.Serialize(recProp);

        return string.Empty;
    }
}
