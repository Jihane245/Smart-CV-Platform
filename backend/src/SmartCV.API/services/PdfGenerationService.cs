public interface IPdfGenerationService
{
    Task<byte[]> GenererPdf(int cvId);
}

public class PdfGenerationService : IPdfGenerationService
{
    public async Task<byte[]> GenererPdf(int cvId)
    {
        // Récupération des données du CV
        // Construction du document PDF avec QuestPDF
        // Retour du fichier en byte[]
    }
}