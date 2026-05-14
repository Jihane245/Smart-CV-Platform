using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using API.models.Enums;

namespace API.models;

public class Candidature
{
    [Key]
    public int Id { get; set; }
    
    public int UserId { get; set; }
    [ForeignKey("UserId")]
    public User User { get; set; }
    
    public int? CVId { get; set; }
    [ForeignKey("CVId")]
    public Cv? Cv { get; set; }
    
    [Required]
    public string Entreprise { get; set; } = string.Empty;
    
    [Required]
    public string Poste { get; set; } = string.Empty;
    
    public DateTime DateEnvoi { get; set; }
    public StatutCandidature Statut { get; set; }
    
    [MaxLength(2000)]
    public string? Notes { get; set; }
    
    public DateTime DateModification { get; set; } = DateTime.UtcNow;
}
