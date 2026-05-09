using System.ComponentModel.DataAnnotations;

namespace API.dtos.CoverLetter;

public class CoverLetterUpdateDto
{
    [Required]
    [MaxLength(10000)]
    public string Contenu { get; set; } = string.Empty;
}
