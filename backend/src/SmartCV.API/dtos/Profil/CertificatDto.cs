namespace API.dtos.Profil;

public class CertificatDto
{
    public int Id { get; set; }
    public string Nom { get; set; }
    public string Organisme { get; set; }
    public DateTime DateObtention { get; set; }
    public DateTime? DateExpiration { get; set; }
    public string Niveau { get; set; }
    public string LienVerification { get; set; }
    public string Description { get; set; }
    public string Identifiant { get; set; }
}
