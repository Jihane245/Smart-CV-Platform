using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.models;

public class Experience
{
    [Key]
    public int IdExp { get; set; }
    
    public int ProfilId { get; set; }
    [ForeignKey("ProfilId")]
    public Profil Profil { get; set; }
    
    [Required]
    public string Poste { get; set; }
    public string Entreprise { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime? DateFin { get; set; }
    
    [MaxLength(2000)]
    public string Description { get; set; }
}
