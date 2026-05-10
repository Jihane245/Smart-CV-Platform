namespace API.dtos.Competence;

// ─── Request ────────────────────────────────────────────

public class GapRequest
{
    public string TexteOffre { get; set; } = string.Empty;
}

// ─── Response ────────────────────────────────────────────

public class GapResponse
{
    public List<string> CompetencesManquantes { get; set; } = [];
    public List<string> CompetencesPresentes { get; set; } = [];
    public int ScoreCompatibilite { get; set; }
}

// ─── Test ────────────────────────────────────────────────

public class GenerateTestRequest
{
    public string NomCompetence { get; set; } = string.Empty;
}

public class QuestionDto
{
    public int Numero { get; set; }
    public string Enonce { get; set; } = string.Empty;
    public List<string> Options { get; set; } = [];
}

public class TestGeneratedDto
{
    public int TestId { get; set; }
    public string NomCompetence { get; set; } = string.Empty;
    public List<QuestionDto> Questions { get; set; } = [];
}

public class EvaluateTestRequest
{
    public int TestId { get; set; }
    public List<ReponseDto> Reponses { get; set; } = [];
}

public class ReponseDto
{
    public int Numero { get; set; }
    public string ReponseChoisie { get; set; } = string.Empty;
}

public class EvaluationResultDto
{
    public int TestId { get; set; }
    public int Score { get; set; }
    public string Niveau { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool RoadmapNecessaire { get; set; }
}

// ─── Roadmap ─────────────────────────────────────────────

public class RoadmapRequest
{
    public int TestId { get; set; }
}

public class EtapeRoadmapDto
{
    public int Ordre { get; set; }
    public string Type { get; set; } = string.Empty; // "video" | "doc" | "projet"
    public string Titre { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? Duree { get; set; }
}

public class RoadmapDto
{
    public int RoadmapId { get; set; }
    public string NomCompetence { get; set; } = string.Empty;
    public string NiveauDepart { get; set; } = string.Empty;
    public string ObjectifFinal { get; set; } = string.Empty;
    public List<EtapeRoadmapDto> Etapes { get; set; } = [];
}

// ─── Validation finale ────────────────────────────────────

public class ValidateRequest
{
    public int RoadmapId { get; set; }
    public List<ReponseDto> Reponses { get; set; } = [];
}

public class ValidateResultDto
{
    public int Score { get; set; }
    public string Niveau { get; set; } = string.Empty;
    public bool CompetenceAjoutee { get; set; }
    public string Message { get; set; } = string.Empty;
}

// ─── Détails complets d'une roadmap ───────────────────────────────────────────

/// <summary>
/// Phase actuelle dans le parcours d'apprentissage. Permet au front
/// d'afficher la bonne action attendue de l'utilisateur.
/// </summary>
public enum RoadmapPhase
{
    /// <summary>La roadmap vient d'être générée — l'utilisateur doit la parcourir.</summary>
    AParcourir,
    /// <summary>L'utilisateur a marqué la roadmap comme suivie — il peut passer le test final.</summary>
    PreteAuTestFinal,
    /// <summary>Le test final a échoué — refaire la roadmap puis retenter.</summary>
    TestFinalEchoue,
    /// <summary>Compétence validée et ajoutée au profil.</summary>
    Validee
}

public class TestInfoDto
{
    public int Id { get; set; }
    public string NomCompetence { get; set; } = string.Empty;
    public int? Score { get; set; }
    public string? NiveauDetecte { get; set; }
    public string Statut { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class RoadmapDetailsDto
{
    // Identification
    public int RoadmapId { get; set; }
    public int UserId { get; set; }
    public string NomCompetence { get; set; } = string.Empty;
    public string NiveauDepart { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Contenu pédagogique
    public List<EtapeRoadmapDto> Etapes { get; set; } = [];
    public int NombreEtapes { get; set; }

    // Drapeaux d'état bruts
    public bool RoadmapSuivie { get; set; }
    public bool Completee { get; set; }

    // Test associé (peut être null si supprimé)
    public TestInfoDto? Test { get; set; }

    // ─── État dérivé : où l'utilisateur en est ────────────────────────────────
    /// <summary>Phase actuelle (énuméré en string : "AParcourir", "PreteAuTestFinal", "TestFinalEchoue", "Validee").</summary>
    public string Phase { get; set; } = string.Empty;
    /// <summary>Étiquette utilisateur lisible pour la phase.</summary>
    public string PhaseLibelle { get; set; } = string.Empty;
    /// <summary>Action concrète attendue de l'utilisateur à l'instant t.</summary>
    public string ProchaineAction { get; set; } = string.Empty;
    /// <summary>Progression globale du parcours en pourcentage (0–100).</summary>
    public int Progression { get; set; }
    /// <summary>true si l'utilisateur peut lancer le test final.</summary>
    public bool PeutPasserTestFinal { get; set; }
    /// <summary>true si l'utilisateur peut repasser le test (après échec).</summary>
    public bool PeutReessayer { get; set; }
}
