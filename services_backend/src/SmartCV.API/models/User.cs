using System.ComponentModel.DataAnnotations;
using API.models.Enums;

namespace API.models;

public class User
{
    [Key]
    public int Id { get; set; }
    
    [Required][MaxLength(100)]
    public string Nom { get; set; }
    
    [Required][MaxLength(100)]
    public string Prenom { get; set; }
    
    [Required][EmailAddress]
    public string Email { get; set; }
    
    [Required]
    public string PasswordHash { get; set; }
    
    public bool IsActif { get; set; } = true;
    public RoleUtilisateur Role { get; set; } = RoleUtilisateur.Candidat;
    
    public Profil Profil { get; set; }
    public ICollection<Cv> Cvs { get; set; }
    public ICollection<LettreMotivation> LettresMotivation { get; set; }
    public ICollection<Candidature> Candidatures { get; set; }
    public ICollection<Certificat> Certificats { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
