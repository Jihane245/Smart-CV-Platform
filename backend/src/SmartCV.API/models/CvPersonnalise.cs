using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.models;

public class CvPersonnalise
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }
    [ForeignKey("UserId")]
    public User? User { get; set; }

    public int TemplateId { get; set; }
    [ForeignKey("TemplateId")]
    public TemplateCv? Template { get; set; }

    // Styles choisis par le user
    public string? CouleurPrimaire { get; set; }
    public string? CouleurSecondaire { get; set; }
    public string? CouleurTexte { get; set; }
    public string? Police { get; set; }
    public string? TaillePolice { get; set; }

    // Contenu modifié par le user (JSON)
    public string? ContenuJson { get; set; }

    // Langue choisie
    public string Langue { get; set; } = "fr";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}