using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.models;

public class SectionDynamique
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public int ProfilId { get; set; }
    [ForeignKey("ProfilId")]
    public Profil? Profil { get; set; }

    [Required][MaxLength(100)]
    public string Titre { get; set; } = string.Empty;

    public int Ordre { get; set; }

    public ICollection<LigneDynamique> Lignes { get; set; } = [];
}