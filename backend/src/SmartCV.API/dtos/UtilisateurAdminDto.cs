namespace API.dtos;

public class UtilisateurAdminDto
{
    public int Id { get; set; }
    public string Initiales { get; set; }
    public string CouleurAvatar { get; set; }
    public string Nom { get; set; }
    public string Role { get; set; }
    public string Email { get; set; }
    public int CvGeneres { get; set; }
    public string InscritLe { get; set; }
    public bool Actif { get; set; }
}