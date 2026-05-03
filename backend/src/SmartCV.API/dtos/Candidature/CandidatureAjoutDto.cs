namespace API.dtos.Candidature;

public class CandidatureAjoutDto
{
    public string Entreprise { get; set; } = "";
    public string Poste { get; set; } = "";
    public DateTime DateEnvoi { get; set; }
    public string? Notes { get; set; }
}