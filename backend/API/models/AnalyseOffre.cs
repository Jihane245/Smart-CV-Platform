using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using API.models;


namespace API.models;
public class AnalyseOffre
{
    [Key]
    public int Id { get; set; }
    
    public int OffreId { get; set; }
    
    [ForeignKey("OffreId")]
    public Offre Offre { get; set; }
    
    public int? ProfilId { get; set; }
    
    [ForeignKey("ProfilId")]
    public Profil Profil { get; set; }
    
    // RÉSULTATS DE L'ANALYSE (extraits par l'IA)
    public List<string> MotsClesExtraits { get; set; }  
    
    public List<string> CompetencesRequises { get; set; }
    
    public List<string> CompetencesMatch { get; set; }
    
    public List<string> CompetencesManquantes { get; set; }
    
    public float ScoreCompatibilite { get; set; }
    
    public string Resume { get; set; }
    
    public string Recommandations { get; set; }
    
    public DateTime DateAnalyse { get; set; } = DateTime.UtcNow;
    
    public bool APostule { get; set; } = false;
}
