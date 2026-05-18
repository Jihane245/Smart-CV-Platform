namespace API.dtos;

public class TemplateComponentDto
{
    // Identifiant unique de l'instance du composant dans le template
    public string Id { get; set; } = Guid.NewGuid().ToString();

    // Type du composant CV (clé du catalogue) :
    //   "infos-personnelles" | "photo" | "titre-poste" | "resume"
    //   | "experiences" | "formations" | "competences" | "langues"
    //   | "projets" | "certifications" | "centres-interet" | "references"
    //   | "texte-libre"
    public string Type { get; set; } = string.Empty;

    // Titre affiché dans le CV (ex: "Expérience professionnelle")
    // Peut être personnalisé par l'admin sinon valeur par défaut du catalogue.
    public string? Titre { get; set; }

    // Configuration libre du composant (visibilité de sous-champs, format de date, etc.)
    public Dictionary<string, object>? Config { get; set; }
}
