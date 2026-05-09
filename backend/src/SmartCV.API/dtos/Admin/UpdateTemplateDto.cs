  namespace API.dtos;

  public class UpdateTemplateDto
  {
      public string Nom { get; set; } = string.Empty;
      public string Couleur { get; set; } = string.Empty;
      public TemplateStructureDto? Structure { get; set; }
  }
