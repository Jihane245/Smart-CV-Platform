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
    
    public int CVId { get; set; }
    
    [ForeignKey("CVId")]
    public Cv Cv { get; set; }
    
    public int OffreId { get; set; }
    
    [ForeignKey("OffreId")]
    public Offre Offre { get; set; }
    
    public string Entreprise { get; set; }
    
    public string Poste { get; set; }
    
    public DateTime DateEnvoi { get; set; }
    
    public StatutCandidature Statut { get; set; }
    
    [MaxLength(2000)]
    public string Notes { get; set; }
}
