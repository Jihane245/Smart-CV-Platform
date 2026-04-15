using API.models;

namespace API.dtos.Profil;

public class CompetenceDto
{
    public int IdComp { get; set; }
    public string Nom { get; set; }
    public NiveauEnum Niveau { get; set; }
    public string Categorie { get; set; }
}