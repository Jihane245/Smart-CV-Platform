 namespace API.dtos;

  public class TemplateStructureDto
  {
      // Liste de toutes les sections du template
      public List<TemplateSectionDto> Sections { get; set; } = new();
  }
