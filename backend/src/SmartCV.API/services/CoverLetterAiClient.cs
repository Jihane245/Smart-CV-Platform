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
}