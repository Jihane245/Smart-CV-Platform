using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using API.models;
using API.models.Enums;

namespace API.models;

public class Certificat
{
    [Key]
    public int Id { get; set; }
    
    // Relation avec Profil (un profil peut avoir plusieurs certificats)
    public int ProfilId { get; set; }
    
    [ForeignKey("ProfilId")]
    public Profil Profil { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Nom { get; set; }  // ex: "Microsoft Azure Fundamentals"
    
    [Required]
    [MaxLength(100)]
    public string Organisme { get; set; }  // ex: "Microsoft", "Cisco", "Google"
    
    [Required]
    public DateTime DateObtention { get; set; }
    
    public DateTime? DateExpiration { get; set; }  // Certains certificats expirent
    
    [MaxLength(50)]
    public string Niveau { get; set; }  // ex: "Associate", "Expert", "Professional"
    
    [Url]
    public string LienVerification { get; set; }  // URL pour vérifier l'authenticité
    
    [MaxLength(500)]
    public string Description { get; set; }  // Description optionnelle
    
    [MaxLength(100)]
    public string Identifiant { get; set; }  // Numéro de certificat / Credential ID
    
    public bool EstValide { get; set; } = true;  // Par défaut vrai, faux si expiré
    
    [MaxLength(200)]
    public string ImageUrl { get; set; }  // Logo ou badge du certificat
}
