namespace API.dtos;

public class UtilisateurAdminDto
{
    public string Id { get; set; } = string.Empty;
    public string Initiales { get; set; } = string.Empty;
    public string CouleurAvatar { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int CvGeneres { get; set; }
    public string InscritLe { get; set; } = string.Empty;
    public bool Actif { get; set; }
}
