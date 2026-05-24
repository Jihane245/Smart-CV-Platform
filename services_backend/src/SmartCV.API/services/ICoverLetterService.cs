using API.dtos.CoverLetter;
using API.models;

namespace API.services;

public interface ICoverLetterService
{
    Task<LettreMotivation> GenerateCoverLetterAsync(CoverLetterGenerateDto dto);
    Task<LettreMotivation?> GetCoverLetterAsync(int id);
    Task<IEnumerable<LettreMotivation>> GetUserCoverLettersAsync(int userId);
    Task<LettreMotivation?> UpdateCoverLetterAsync(int id, string contenu);
    Task<byte[]> GeneratePdfAsync(int id);
}
