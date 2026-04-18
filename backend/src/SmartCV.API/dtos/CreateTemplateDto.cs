namespace API.dtos
{
    public class CreateTemplateDto
    {
        public string Nom { get; set; } = string.Empty;
        public string Couleur { get; set; } = "#000000";
        public List<string>? Lignes { get; set; }
    }
}