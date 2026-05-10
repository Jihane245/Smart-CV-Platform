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

    public async Task<string> GenerateCoverLetterAsync(User user, Offre offre, AnalyseOffre analyseOffre, Cv? cv = null)
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
                offre.Id,
                offre.Titre,
                offre.Entreprise,
                offre.Description,
                offre.Exigences,
                offre.TypeContrat,
                offre.UrlOffre,
                offre.DatePublication,
                offre.DateExpiration
            },

            analyse = new
            {
                analyseOffre.MotsClesExtraits,
                analyseOffre.CompetencesRequises,
                analyseOffre.CompetencesMatch,
                analyseOffre.CompetencesManquantes,
                analyseOffre.ScoreCompatibilite,
                analyseOffre.Resume,
                analyseOffre.Recommandations
            },

            cv = cv == null ? null : (object)new
            {
                id = cv.IdCv,
                keyWords = cv.KeyWords,
                skillsDetectes = cv.SkillsDetectes,
                scoreCompatibilite = cv.ScoreCompatibilite,
                exigences = cv.Exigences,
                templateId = cv.TemplateId
            }
        };

        var content = new StringContent(
            JsonSerializer.Serialize(request),
            Encoding.UTF8,
            "application/json"
        );

        var response = await client.PostAsync($"{BaseUrl}/api/coverletter/generate", content);

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

    public async Task<AnalyseOffre> AnalyzeOffreAsync(Offre offre, Profil profil)
    {
        if (string.IsNullOrWhiteSpace(BaseUrl))
            throw new InvalidOperationException("IA_SERVICE_URL is not configured.");

        var client = _httpFactory.CreateClient();
        var payload = new
        {
            texte = offre.Description ?? string.Empty,
            profil_competences = profil.Competences?.Select(c => c.Nom).ToList() ?? new List<string>()
        };
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var resp = await client.PostAsync($"{BaseUrl}/analyze/text", content);
        var body = await resp.Content.ReadAsStringAsync();
        if (!resp.IsSuccessStatusCode)
            throw new InvalidOperationException($"AI analyse error: {resp.StatusCode} - {body}");

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        return new AnalyseOffre
        {
            MotsClesExtraits = JsonArrayToList(root, "mots_cles_extraits"),
            CompetencesRequises = JsonArrayToList(root, "competences_requises"),
            CompetencesMatch = JsonArrayToList(root, "competences_match"),
            CompetencesManquantes = JsonArrayToList(root, "competences_manquantes"),
            ScoreCompatibilite = root.TryGetProperty("score_compatibilite", out var s) && s.ValueKind == JsonValueKind.Number ? s.GetSingle() : 0,
            Resume = root.TryGetProperty("resume", out var r) ? r.GetString() ?? "" : "",
            Recommandations = root.TryGetProperty("recommandations", out var rec) && rec.ValueKind == JsonValueKind.String
                ? rec.GetString() ?? ""
                : (rec.ValueKind == JsonValueKind.Object ? rec.GetRawText() : "")
        };
    }

    public async Task<string> GenerateCoverLetterFromRawTextAsync(string cvText, string offreText, string? offreTitre, string? offreEntreprise)
    {
        if (string.IsNullOrWhiteSpace(BaseUrl))
            throw new InvalidOperationException("IA_SERVICE_URL is not configured.");

        var client = _httpFactory.CreateClient();
        var payload = new
        {
            cv_text = cvText,
            offre_text = offreText,
            offre_titre = offreTitre,
            offre_entreprise = offreEntreprise
        };
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var resp = await client.PostAsync($"{BaseUrl}/coverletter/generate-raw", content);
        var body = await resp.Content.ReadAsStringAsync();
        if (!resp.IsSuccessStatusCode)
            throw new InvalidOperationException($"AI service error: {resp.StatusCode} - {body}");

        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("contenu", out var c))
                return c.GetString() ?? string.Empty;
            if (doc.RootElement.TryGetProperty("content", out var c2))
                return c2.GetString() ?? string.Empty;
        }
        catch (JsonException)
        {
            // fallback texte brut
        }
        return body.Trim();
    }

    private static List<string> JsonArrayToList(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out var el) || el.ValueKind != JsonValueKind.Array)
            return new List<string>();
        return el.EnumerateArray()
            .Select(x => x.ValueKind == JsonValueKind.String ? (x.GetString() ?? "") : x.GetRawText())
            .ToList();
    }
}
