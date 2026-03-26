using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using API.models;

namespace API.models;

public class Profil
{
    [Key]
    public int Id { get; set; }
    
    public int UserId { get; set; }
    
    [ForeignKey("UserId")]
    public User User { get; set; }
    
    [MaxLength(200)]
    public string Titre { get; set; }
    
    [Phone]
    public string Telephone { get; set; }
    
    public string Adresse { get; set; }
    
    [Url]
    public string LinkedIn { get; set; }
    
    [MaxLength(2000)]
    public string Description { get; set; }
    
    // Relations
    public ICollection<Competence> Competences { get; set; }
    public ICollection<Experience> Experiences { get; set; }
    public ICollection<Formation> Formations { get; set; }
    public ICollection<Certificat> Certificats{get; set;}
}
