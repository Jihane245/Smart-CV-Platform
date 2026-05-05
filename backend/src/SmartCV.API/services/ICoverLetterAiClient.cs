using API.models;

namespace API.services;

public interface ICoverLetterAiClient
{
    Task<string> GenerateCoverLetterAsync(User user, Offre offre, AnalyseOffre analyseOffre);
}
