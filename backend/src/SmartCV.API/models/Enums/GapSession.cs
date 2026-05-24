using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.models;

/// <summary>
/// Represents one "Combler les écarts" session — a bundle of missing skills
/// detected for a specific job offer analysis. Created once when the user
/// clicks "Combler les écarts" or downloads their CV on step 2.
/// Each session owns N GapSessionSkills, each of which may link to a Roadmap.
/// </summary>
public class GapSession
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }
    [ForeignKey("UserId")]
    public User? User { get; set; }

    /// <summary>
    /// Truncated / summarised offer text used as display label in Historique.
    /// For image uploads this will be the AI-generated resume text.
    /// </summary>
    [Required]
    public string TexteOffre { get; set; } = string.Empty;

    /// <summary>
    /// Optional human-readable title extracted or inferred from the offer.
    /// Stored as plain text; frontend sends it if available.
    /// Hash ensures uniqueness
    /// </summary>
    public string? TitreOffre { get; set; }

    public string? OffreHash { get; set; }

    /// <summary>
    /// Optional company name extracted from the offer.
    /// </summary>
    public string? Entreprise { get; set; }

    /// <summary>
    /// Compatibility score (0–100) returned by the AI at analysis time.
    /// </summary>
    public int ScoreCompatibilite { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<GapSessionSkill> Skills { get; set; } = [];
}