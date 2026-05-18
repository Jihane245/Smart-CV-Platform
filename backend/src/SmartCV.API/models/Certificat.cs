using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.models;

public class Certificat
{
    [Key]
    public int Id { get; set; }
    
    public int ProfilId { get; set; }
    [ForeignKey("ProfilId")]
    public Profil? Profil { get; set; }
    
    [Required][MaxLength(200)]
    public string Nom { get; set; } = string.Empty;
    
    [Required][MaxLength(100)]
    public string Organisme { get; set; } = string.Empty;
    
    [Required]
    public DateTime DateObtention { get; set; }
    
    public DateTime? DateExpiration { get; set; }
    
    [MaxLength(50)]
    public string? Niveau { get; set; }          // ← nullable
    
    [Url]
    public string? LienVerification { get; set; } // ← nullable
    
    [MaxLength(500)]
    public string? Description { get; set; }      // ← nullable
    
    [MaxLength(100)]
    public string? Identifiant { get; set; }      // ← nullable
    
    public bool EstValide { get; set; } = true;
    
    [MaxLength(200)]
    public string? ImageUrl { get; set; }         // ← nullable (c'est celui qui plante)
}
