using API.models;

namespace API.services;

public interface ICoverLetterAiClient
{
    Task<string> GenerateCoverLetterAsync(User user, Offre offre, AnalyseOffre analyseOffre, Cv? cv = null);
    Task<AnalyseOffre> AnalyzeOffreAsync(Offre offre, Profil profil);
    Task<string> GenerateCoverLetterFromRawTextAsync(string cvText, string offreText, string? offreTitre, string? offreEntreprise);
}
