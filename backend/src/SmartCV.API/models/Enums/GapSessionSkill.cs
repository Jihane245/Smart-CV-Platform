using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.models;

/// <summary>
/// One skill within a GapSession. Tracks the skill's name, its priority label,
/// and — once the user starts the upgrade flow — links to its Roadmap.
/// </summary>
public class GapSessionSkill
{
    [Key]
    public int Id { get; set; }

    public int GapSessionId { get; set; }
    [ForeignKey("GapSessionId")]
    public GapSession? GapSession { get; set; }

    [Required]
    public string NomCompetence { get; set; } = string.Empty;

    /// <summary>"haute" | "renforcer" | "evaluer"</summary>
    public string Priorite { get; set; } = "evaluer";

    /// <summary>
    /// Set once the user generates a roadmap for this skill.
    /// Nullable — skill may still be pending.
    /// </summary>
    public int? RoadmapId { get; set; }
    [ForeignKey("RoadmapId")]
    public Roadmap? Roadmap { get; set; }
}