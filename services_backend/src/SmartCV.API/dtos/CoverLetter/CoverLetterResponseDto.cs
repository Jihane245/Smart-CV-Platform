namespace API.dtos.CoverLetter;

public class CoverLetterResponseDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int OffreId { get; set; }
    public string Contenu { get; set; } = string.Empty;
    public DateTime DateGeneration { get; set; }
    public string? FilePath { get; set; }
}
