namespace API.dtos.Cv;

// ─── Contenu modifiable du CV ────────────────────────────────────────────────

public class CvContenuDto
{
    public CvProfilEditDto? Profil { get; set; }
    public List<CvCompetenceEditDto> Competences { get; set; } = [];
    public List<CvExperienceEditDto> Experiences { get; set; } = [];
    public List<CvFormationEditDto> Formations { get; set; } = [];
    public List<CvCertificatEditDto> Certificats { get; set; } = [];
    public List<CvSectionEditDto> SectionsDynamiques { get; set; } = [];
}

public class CvProfilEditDto
{
    public string? Titre { get; set; }
    public string? Description { get; set; }
    public string? Telephone { get; set; }
    public string? Adresse { get; set; }
    public string? LinkedIn { get; set; }
}

public class CvCompetenceEditDto
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Niveau { get; set; } = string.Empty;
    public string? Categorie { get; set; }
    public bool Visible { get; set; } = true;
}

public class CvExperienceEditDto
{
    public int Id { get; set; }
    public string Poste { get; set; } = string.Empty;
    public string? Entreprise { get; set; }
    public string DateDebut { get; set; } = string.Empty;
    public string? DateFin { get; set; }
    public string? Description { get; set; }
    public bool Visible { get; set; } = true;
}

public class CvFormationEditDto
{
    public int Id { get; set; }
    public string? Diplome { get; set; }
    public string? Etablissement { get; set; }
    public int Annee { get; set; }
    public string? Mention { get; set; }
    public bool Visible { get; set; } = true;
}

public class CvCertificatEditDto
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Organisme { get; set; } = string.Empty;
    public string DateObtention { get; set; } = string.Empty;
    public string? Niveau { get; set; }
    public bool Visible { get; set; } = true;
}

public class CvSectionEditDto
{
    public Guid Id { get; set; }
    public string Titre { get; set; } = string.Empty;
    public int Ordre { get; set; }
    public bool Visible { get; set; } = true;
    public List<CvLigneEditDto> Lignes { get; set; } = [];
}

public class CvLigneEditDto
{
    public Guid Id { get; set; }
    public string? Detail { get; set; }
    public string? Description { get; set; }
    public int Ordre { get; set; }
}

// ─── Requêtes ────────────────────────────────────────────────────────────────

public class CreateCvPersonnaliseDto
{
    public int TemplateId { get; set; }
    public string Langue { get; set; } = "fr";
    public string? CouleurPrimaire { get; set; }
    public string? CouleurSecondaire { get; set; }
    public string? CouleurTexte { get; set; }
    public string? Police { get; set; }
    public string? TaillePolice { get; set; }
}

public class UpdateStylesDto
{
    public string? CouleurPrimaire { get; set; }
    public string? CouleurSecondaire { get; set; }
    public string? CouleurTexte { get; set; }
    public string? Police { get; set; }
    public string? TaillePolice { get; set; }
    public string? Langue { get; set; }
}

// ─── Réponses ────────────────────────────────────────────────────────────────

public class CvPersonnaliseResponseDto
{
    public int Id { get; set; }
    public int TemplateId { get; set; }
    public string NomTemplate { get; set; } = string.Empty;
    public string Langue { get; set; } = "fr";
    public StylesCvDto Styles { get; set; } = new();
    public CvContenuDto Contenu { get; set; } = new();
    public DateTime UpdatedAt { get; set; }
}

public class StylesCvDto
{
    public string CouleurPrimaire { get; set; } = "#6b8068";
    public string CouleurSecondaire { get; set; } = "#f5f5f0";
    public string CouleurTexte { get; set; } = "#1a1a1a";
    public string Police { get; set; } = "inter";
    public string TaillePolice { get; set; } = "md";
    public string CssVariables { get; set; } = string.Empty;
}
