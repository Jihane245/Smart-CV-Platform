using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.models;

public class LigneDynamique
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SectionId { get; set; }
    [ForeignKey("SectionId")]
    public SectionDynamique? Section { get; set; }

    [MaxLength(200)]
    public string? Detail { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public int Ordre { get; set; }
}
