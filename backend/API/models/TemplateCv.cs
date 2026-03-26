using System.ComponentModel.DataAnnotations;

namespace API.models;

public class TemplateCv
{
    [Key]
    public int IdTemp { get; set; }
    
    [Required]
    public string Nom { get; set; }
    
    public string Format { get; set; }  // "1form" dans diagramme
    
    [Url]
    public string ApercuUrl { get; set; }
    
    // Relations
    public ICollection<Cv> Cvs { get; set; }
}