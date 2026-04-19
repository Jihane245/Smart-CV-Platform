namespace API.dtos;

public class StatDto
{
    public string Label { get; set; } = string.Empty;
    public int Valeur { get; set; }
    public int Delta { get; set; }
    public string Couleur { get; set; } = string.Empty;
    public List<int> Historique { get; set; } = new();
}