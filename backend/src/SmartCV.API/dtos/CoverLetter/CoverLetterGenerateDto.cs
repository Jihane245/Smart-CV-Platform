using System.ComponentModel.DataAnnotations;

namespace API.dtos.CoverLetter;

public class CoverLetterGenerateDto
{
    [Required]
    public int UserId { get; set; }

    [Required]
    public int OffreId { get; set; }
}
