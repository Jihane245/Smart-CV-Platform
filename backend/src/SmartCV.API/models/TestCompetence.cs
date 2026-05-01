using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace API.models;

public enum NiveauTest { Debutant, Moyen, Expert }
public enum StatutParcours { EnCours, Valide, Echoue }

public class TestCompetence
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }
    [ForeignKey("UserId")]
    public User? User { get; set; }

    [Required]
    public string NomCompetence { get; set; } = string.Empty;

    // Questions JSON générées par l'IA
    public string QuestionsJson { get; set; } = string.Empty;

    // Réponses du user JSON
    public string? ReponsesJson { get; set; }

    // Score obtenu 0-100
    public int? Score { get; set; }

    // Niveau détecté après évaluation
    public NiveauTest? NiveauDetecte { get; set; }

    public StatutParcours Statut { get; set; } = StatutParcours.EnCours;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}