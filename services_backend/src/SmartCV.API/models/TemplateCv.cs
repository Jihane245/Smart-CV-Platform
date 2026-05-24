using System.ComponentModel.DataAnnotations;

namespace API.models;

public class TemplateCv
{
    [Key]
    public int IdTemp { get; set; }
    
    [Required]
    public string Nom { get; set; }
    
    public string Format { get; set; }
    
    [Url]
    public string ApercuUrl { get; set; }

    public string Couleur { get; set; }  

    public string Lignes { get; set; }   
     public string? StructureJson { get; set; }
    
    public ICollection<Cv> Cvs { get; set; }
}
