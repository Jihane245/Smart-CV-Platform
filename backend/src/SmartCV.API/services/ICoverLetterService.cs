using API.models;

namespace API.services;

public interface ICoverLetterService
{
    Task<LettreMotivation> GenerateCoverLetterAsync(int userId, int offreId);
    Task<LettreMotivation?> GetCoverLetterAsync(int id);
    Task<IEnumerable<LettreMotivation>> GetUserCoverLettersAsync(int userId);
    Task<LettreMotivation?> UpdateCoverLetterAsync(int id, string contenu);
    Task<byte[]> GeneratePdfAsync(int id);
}
