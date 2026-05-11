 using System.ComponentModel.DataAnnotations;

  namespace API.dtos.CoverLetter;

  public class CoverLetterGenerateDto
  {
      // Optionnel : si absent, le backend prend le user courant (JWT).
      // Ne peut être différent du user courant que si l'appelant est Admin.
      public int? UserId { get; set; }

      // L'un des deux est requis (validation côté service)
      public int? OffreId { get; set; }
      public string? OffreTexte { get; set; }
      public string? OffreTitre { get; set; }
      public string? OffreEntreprise { get; set; }

      // Optionnel : si fourni, la lettre s'appuie sur ce CV
      public int? CvId { get; set; }
  }