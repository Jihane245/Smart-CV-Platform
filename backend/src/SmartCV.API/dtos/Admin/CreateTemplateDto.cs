namespace API.dtos;

public class CreateTemplateDto
{
    public string Nom { get; set; } = string.Empty;
    public string Couleur { get; set; } = string.Empty;
    public List<string>? Lignes { get; set; }
     public TemplateStructureDto? Structure { get; set; }
}