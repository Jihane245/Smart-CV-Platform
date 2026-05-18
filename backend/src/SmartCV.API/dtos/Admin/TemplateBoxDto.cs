namespace API.dtos;

public class TemplateBoxDto
{
    // Identifiant logique du box dans le layout :
    //   "header" | "main" | "sidebar" | "left" | "right"
    public string Id { get; set; } = string.Empty;

    // Libellé affiché à l'admin dans l'éditeur (ex : "Bandeau", "Colonne gauche")
    public string Label { get; set; } = string.Empty;

    // Style visuel du box (couleur de fond, texte, padding...)
    public TemplateBoxStyleDto Style { get; set; } = new();

    // Composants CV placés dans ce box, dans l'ordre d'affichage
    public List<TemplateComponentDto> Components { get; set; } = new();
}

public class TemplateBoxStyleDto
{
    public string? Background { get; set; }
    public string? TextColor { get; set; }
    public string? AccentColor { get; set; }
    public string? Padding { get; set; }
}
