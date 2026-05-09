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
