using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.models;

public class Profil
{
    [Key]
    public int Id { get; set; }
    
    public int UserId { get; set; }
    [ForeignKey("UserId")]
    public User? User { get; set; }
    
    [MaxLength(200)]
    public string? Titre { get; set; }        // ← ? ajouté
    
    [Phone]
    public string? Telephone { get; set; }    // ← ? ajouté
    
    public string? Adresse { get; set; }      // ← ? ajouté
    
    [Url]
    public string? LinkedIn { get; set; }     // ← ? ajouté
    
    [MaxLength(2000)]
    public string? Description { get; set; }  // ← ? ajouté
    [MaxLength(500)]
    public string? PhotoUrl { get; set; }
    
    public ICollection<Competence> Competences { get; set; } = [];
    public ICollection<Experience> Experiences { get; set; } = [];
    public ICollection<Formation> Formations { get; set; } = [];
    public ICollection<Certificat> Certificats { get; set; } = [];
    public ICollection<SectionDynamique> Sections { get; set; } = [];
}