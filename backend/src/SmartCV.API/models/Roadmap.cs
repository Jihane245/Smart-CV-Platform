using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.models;

public class Roadmap
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }
    [ForeignKey("UserId")]
    public User? User { get; set; }

    public int TestId { get; set; }
    [ForeignKey("TestId")]
    public TestCompetence? Test { get; set; }

    [Required]
    public string NomCompetence { get; set; } = string.Empty;

    public NiveauTest NiveauDepart { get; set; }

    // Étapes JSON générées par l'IA
    public string EtapesJson { get; set; } = string.Empty;

    public bool Completee { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool RoadmapSuivie { get; set; } = false;
}
