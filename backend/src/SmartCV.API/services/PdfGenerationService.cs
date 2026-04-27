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
        // Télécharger Chromium (une seule fois, au premier démarrage)
        await new BrowserFetcher().DownloadAsync();
        
        using var browser = await Puppeteer.LaunchAsync(new LaunchOptions 
        { 
            Headless = true,
            Args = new[] { "--no-sandbox" }
        });
        
        using var page = await browser.NewPageAsync();
        await page.SetContentAsync(htmlContent);
        
        var pdfBytes = await page.PdfDataAsync(new PdfOptions
        {
            Format = PaperFormat.A4,
            PrintBackground = true,
            MarginOptions = new MarginOptions
            {
                Top = "20px",
                Bottom = "20px",
                Left = "20px",
                Right = "20px"
            }
        });
        
        return pdfBytes;
    }

    public async Task<CvPdf> SauvegarderPdf(int cvId, byte[] pdfBytes)
    {
        var fileName = $"cv_{cvId}_{DateTime.Now:yyyyMMddHHmmss}.pdf";
        
        // Dossier de stockage
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
        
        _db.CvPdfs.Add(cvPdf);
        await _db.SaveChangesAsync();
        
        return cvPdf;
    }
}