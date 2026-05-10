using PuppeteerSharp;
using API.data;
using API.models;

namespace API.services;

public interface IPdfGenerationService
{
    Task<byte[]> GenererPdfDepuisHtml(string htmlContent);
    Task<CvPdf> SauvegarderPdf(int cvId, byte[] pdfBytes);
}

public class PdfGenerationService : IPdfGenerationService
{
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;

    public PdfGenerationService(ApplicationDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    public async Task<byte[]> GenererPdfDepuisHtml(string htmlContent)
    {
        // Télécharger Chromium
        //await new BrowserFetcher().DownloadAsync();
        // ✅ Remplacer par
        var chromePath = Environment.GetEnvironmentVariable("CHROME_EXECUTABLE_PATH")
            ?? "/usr/bin/google-chrome-stable";

        
        using var browser = await Puppeteer.LaunchAsync(new LaunchOptions
        {
            Headless = true,
            ExecutablePath = chromePath,          // ✅ ajouter
            Args = new[]
            {
                "--no-sandbox",
                "--disable-setuid-sandbox",       // ✅ ajouter
                "--disable-dev-shm-usage",        // ✅ ajouter
                "--disable-gpu"                   // ✅ ajouter
            }
        });
        
        using var page = await browser.NewPageAsync();
        await page.SetContentAsync(htmlContent);
        
        // Version corrigée : utiliser PaperFormat.A4 directement
        var pdfBytes = await page.PdfDataAsync(new PdfOptions
        {
            Format = PuppeteerSharp.Media.PaperFormat.A4,
            PrintBackground = true
        });
        
        return pdfBytes;
    }

    public async Task<CvPdf> SauvegarderPdf(int cvId, byte[] pdfBytes)
    {
        var fileName = $"cv_{cvId}_{DateTime.Now:yyyyMMddHHmmss}.pdf";
        
        var pdfFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "pdfs");
        if (!Directory.Exists(pdfFolder))
            Directory.CreateDirectory(pdfFolder);
        
        var filePath = Path.Combine(pdfFolder, fileName);
        await File.WriteAllBytesAsync(filePath, pdfBytes);
        
        var pdfUrl = $"/pdfs/{fileName}";
        
        var cvPdf = new CvPdf
        {
            CvId = cvId,
            CloudUrl = pdfUrl,
            FileName = fileName,
            DateCreation = DateTime.UtcNow
        };
        
        // Correction : vérifier si le DbSet existe
        _db.Set<CvPdf>().Add(cvPdf);
        await _db.SaveChangesAsync();
        
        return cvPdf;
    }
}