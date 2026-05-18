namespace API.dtos.GapSession;

// ─── Create ──────────────────────────────────────────────────────────────────

public class CreateGapSessionRequest
{
    /// <summary>
    /// Full or summarised offer text. For image uploads, send the AI resume text.
    /// </summary>
    public string TexteOffre { get; set; } = string.Empty;

    /// <summary>Optional job title inferred by the frontend (may be empty).</summary>
    public string? TitreOffre { get; set; }

    /// <summary>Optional company name inferred by the frontend (may be empty).</summary>
    public string? Entreprise { get; set; }

    public int ScoreCompatibilite { get; set; }

    public List<GapSkillRequest> CompetencesManquantes { get; set; } = [];
}

public class GapSkillRequest
{
    public string NomCompetence { get; set; } = string.Empty;
    /// <summary>"haute" | "renforcer" | "evaluer"</summary>
    public string Priorite { get; set; } = "evaluer";
}

// ─── Link roadmap to skill ────────────────────────────────────────────────────

public class LinkRoadmapRequest
{
    public int RoadmapId { get; set; }
}

// ─── Response — list item ─────────────────────────────────────────────────────

public class GapSessionSummaryDto
{
    public int Id { get; set; }
    public string TexteOffre { get; set; } = string.Empty;
    public string? TitreOffre { get; set; }
    public string? Entreprise { get; set; }
    public int ScoreCompatibilite { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalSkills { get; set; }
    public int SkillsTermines { get; set; }
    public int SkillsEnCours { get; set; }
}

// ─── Response — full detail ───────────────────────────────────────────────────

public class GapSessionDetailDto
{
    public int Id { get; set; }
    public string TexteOffre { get; set; } = string.Empty;
    public string? TitreOffre { get; set; }
    public string? Entreprise { get; set; }
    public int ScoreCompatibilite { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<GapSessionSkillDto> Skills { get; set; } = [];
}

public class GapSessionSkillDto
{
    public int Id { get; set; }
    public string NomCompetence { get; set; } = string.Empty;
    public string Priorite { get; set; } = string.Empty;

    // Null when roadmap not yet started
    public int? RoadmapId { get; set; }

    // Populated when roadmap exists
    public string? Phase { get; set; }
    public string? PhaseLibelle { get; set; }
    public int? Progression { get; set; }
    public bool? Completee { get; set; }
    public int? TestScore { get; set; }
    public string? NiveauDepart { get; set; }
}