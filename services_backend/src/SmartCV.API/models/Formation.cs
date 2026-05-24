using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.models;

public class Formation
{
    [Key]
    public int IdFrmt { get; set; }
    
    public int ProfilId { get; set; }
    [ForeignKey("ProfilId")]
    public Profil Profil { get; set; }
    
    public string Diplome { get; set; }
    public string Etablissement { get; set; }
    public int Annee { get; set; }
    public string Mention { get; set; }
}
