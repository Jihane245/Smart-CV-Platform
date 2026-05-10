using API.models;
using System.Collections.Generic;

namespace API.services;

public interface ICoverLetterAiClient
{
    Task<string> GenerateCoverLetterAsync(User user, Offre offre, AnalyseOffre analyseOffre);
    Task<AnalyseOffre> AnalyzeOfferTextAsync(string offreTexte, IEnumerable<string> profilCompetences);
    Task<AnalyseOffre> AnalyzeOfferImageAsync(byte[] imageBytes, string contentType);
}
