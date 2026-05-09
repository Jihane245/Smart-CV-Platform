
namespace API.models;
public class CvPdf
{
    public int Id { get; set; }
    public int CvId { get; set; }
    public string CloudUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    // Nom et prénom capturés depuis le contenu du CV au moment de l'export
    // (= ce qui apparaît réellement dans le PDF généré).
    public string? Prenom { get; set; }
    public string? Nom { get; set; }

    public CvPersonnalise? Cv { get; set; }
}
