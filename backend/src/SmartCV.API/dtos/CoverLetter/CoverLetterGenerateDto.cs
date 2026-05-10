using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace API.dtos.CoverLetter;

public class CoverLetterGenerateDto
{
    [Required]
    public int UserId { get; set; }

    // Cas 1 : offre déjà en base
    public int? OffreId { get; set; }

    // Cas 2 : offre manuelle en texte ou image
    public string? OffreTexte { get; set; }
    public string? OffreTitre { get; set; }
    public string? OffreEntreprise { get; set; }
    public IFormFile? OffreImage { get; set; }

    // CV optionnel
    public int? CvId { get; set; }
    public IFormFile? CvFile { get; set; }
}
