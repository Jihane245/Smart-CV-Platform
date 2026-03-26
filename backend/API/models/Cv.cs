using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using API.models;

namespace API.models;

public enum StatutCVEnum
{
    BROUILLON,
    VALIDER,
    TELECHARGER
}

public class Cv
{
    [Key]
    public int IdCv { get; set; }
    
    public int UserId { get; set; }
    
    [ForeignKey("UserId")]
    public User User { get; set; }
    
    public int? OffreId { get; set; } 
    
    [ForeignKey("OffreId")]
    public Offre Offre { get; set; }
    
    public string KeyWords { get; set; }
    
    public string SkillsDetectes { get; set; }  
    
    public float ScoreCompatibilite { get; set; }
    
    public DateTime DateAnalyse { get; set; }
    
    public string Exigences { get; set; }
    
    public StatutCVEnum Statut { get; set; }
    
    public int? TemplateId { get; set; }
    
    [ForeignKey("TemplateId")]
    public TemplateCv Template { get; set; }
    public ICollection<Candidature> Candidatures { get; set; } = new List<Candidature>();
    public AnalyseOffre AnalyseOffre { get; set; }
}
