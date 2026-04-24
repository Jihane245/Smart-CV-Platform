  public class TemplateFieldDto
  {
      // Nom technique (ex: "email", "poste")
      public string Nom { get; set; } = string.Empty;

      // Label affiché à l'utilisateur (ex: "Email", "Poste occupé")
      public string Label { get; set; } = string.Empty;

      // Type de champ : text, email, tel, date, long_text, list
      public string Type { get; set; } = "text";

      // Placeholder optionnel (ex: "Jean Dupont")
      public string? Placeholder { get; set; }

      // Longueur max optionnelle (null = illimité)
      public int? MaxLength { get; set; }

      // Si true, l'utilisateur DOIT remplir ce champ
      public bool Requis { get; set; }

      // Position du champ dans la section (1, 2, 3, ...)
      public int Ordre { get; set; }
  }
