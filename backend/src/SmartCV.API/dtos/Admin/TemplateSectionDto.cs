  namespace API.dtos;

  public class TemplateSectionDto
  {
      // Identifiant unique généré (ex: GUID)
      public string Id { get; set; } = Guid.NewGuid().ToString();

      // Titre de la section (ex: "Expériences", "Formation")
      public string Titre { get; set; } = string.Empty;

      // Position de la section dans le template (1, 2, 3, ...)
      public int Ordre { get; set; }

      // Couleur optionnelle de la section (ex: "#6b8068")
      public string? Couleur { get; set; }

      // Liste des champs contenus dans cette section
      public List<TemplateFieldDto> Champs { get; set; } = new();
  }