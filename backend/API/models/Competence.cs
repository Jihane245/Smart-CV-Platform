using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using API.models;
using API.models.Enums;

namespace API.models;

public enum NiveauEnum
{
    Debutant,
    Intermediaire,
    Avance,
    Expert
}

public class Competence
{
    [Key]
    public int IdComp { get; set; }
    
    public int ProfilId { get; set; }
    
    [ForeignKey("ProfilId")]
    public Profil Profil { get; set; }
    
    [Required]
    public string Nom { get; set; }
    
    public NiveauEnum Niveau { get; set; }
    
    public string Categorie { get; set; }
}
