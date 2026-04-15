namespace API.dtos.Profil;

public class ProfilResponseDto
{
    public int Id { get; set; }
    public string Titre { get; set; }
    public string Telephone { get; set; }
    public string Adresse { get; set; }
    public string LinkedIn { get; set; }
    public string Description { get; set; }
    public List<CompetenceDto> Competences { get; set; }
    public List<ExperienceDto> Experiences { get; set; }
    public List<FormationDto> Formations { get; set; }
    public List<CertificatDto> Certificats { get; set; }
}