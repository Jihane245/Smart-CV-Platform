
namespace API.models;
public class CvPdf
{
    public int Id { get; set; }
    public int CvId { get; set; }
    public string CloudUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
    
    public Cv Cv { get; set; }
}