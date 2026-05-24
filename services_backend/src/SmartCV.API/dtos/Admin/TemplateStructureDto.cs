 namespace API.dtos;

  public class TemplateStructureDto
  {
      // ─── Format LEGACY (sections + champs) — gardé pour rétro-compatibilité ───
      public List<TemplateSectionDto> Sections { get; set; } = new();

      // ─── Nouveau format BUILDER VISUEL ───
      // Identifiant du layout choisi par l'admin :
      //   "single-column" | "header-two-columns" | "sidebar-left" | "sidebar-right"
      public string? Layout { get; set; }

      // Couleur principale appliquée au template (sidebar, accents)
      public string? CouleurPrimaire { get; set; }

      // Boxes (zones) qui composent la mise en page du template
      public List<TemplateBoxDto>? Boxes { get; set; }
  }
