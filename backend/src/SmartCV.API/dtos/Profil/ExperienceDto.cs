namespace API.dtos.Profil;

public class ExperienceDto
{
    public int IdExp { get; set; }
    public string? Poste { get; set; }
    public string? Entreprise { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime? DateFin { get; set; }
    public string? Description { get; set; }
}
