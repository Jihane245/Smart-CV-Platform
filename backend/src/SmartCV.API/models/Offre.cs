using System.ComponentModel.DataAnnotations;

namespace API.models;

public class Offre
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string Titre { get; set; }
    public string Entreprise { get; set; }
    
    [MaxLength(5000)]
    public string Description { get; set; }
    
    public string Exigences { get; set; }
    public string TypeContrat { get; set; }
    public DateTime DatePublication { get; set; }
    public DateTime? DateExpiration { get; set; }
    public string? UrlOffre { get; set; }
    
    public ICollection<AnalyseOffre> Analyses { get; set; }
    public ICollection<LettreMotivation> LettresMotivation { get; set; }
    public ICollection<Candidature> Candidatures { get; set; }
}
