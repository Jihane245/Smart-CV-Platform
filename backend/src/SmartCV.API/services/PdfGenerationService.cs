using PuppeteerSharp;
using API.data;
using API.models;

namespace API.services;

public interface IPdfGenerationService
{
    Task<byte[]> GenererPdfDepuisHtml(string htmlContent);
    Task<CvPdf> SauvegarderPdf(int cvId, byte[] pdfBytes, string? prenom = null, string? nom = null);
}

public class PdfGenerationService : IPdfGenerationService
{
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;

    // Browser Chromium partagé entre toutes les requêtes — lancé 1 fois, réutilisé.
    private static IBrowser? _browser;
    private static readonly SemaphoreSlim _browserLock = new(1, 1);

    public PdfGenerationService(ApplicationDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // Warm-up à appeler au démarrage de l'app pour pré-lancer Chromium
    public static Task WarmUpAsync() => GetBrowserAsync();

    private static async Task<IBrowser> GetBrowserAsync()
    {
        if (_browser is { IsConnected: true }) return _browser;

        await _browserLock.WaitAsync();
        try
        {
            if (_browser is { IsConnected: true }) return _browser;

            // Vérifie/télécharge Chromium si absent (no-op s'il est déjà téléchargé)
            await new BrowserFetcher().DownloadAsync();

            _browser = await Puppeteer.LaunchAsync(new LaunchOptions
            {
                Headless = true,
                Args = new[] { "--no-sandbox" }
            });
            return _browser;
        }
        finally
        {
            _browserLock.Release();
        }
    }

    public async Task<byte[]> GenererPdfDepuisHtml(string htmlContent)
    {
        var browser = await GetBrowserAsync();
        await using var page = await browser.NewPageAsync();
        await page.SetContentAsync(htmlContent);

        return await page.PdfDataAsync(new PdfOptions
        {
            Format = PuppeteerSharp.Media.PaperFormat.A4,
            PrintBackground = true
        });
    }

    public async Task<CvPdf> SauvegarderPdf(int cvId, byte[] pdfBytes, string? prenom = null, string? nom = null)
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
            DateCreation = DateTime.UtcNow,
            Prenom = string.IsNullOrWhiteSpace(prenom) ? null : prenom.Trim(),
            Nom = string.IsNullOrWhiteSpace(nom) ? null : nom.Trim(),
        };

        _db.Set<CvPdf>().Add(cvPdf);
        await _db.SaveChangesAsync();

        return cvPdf;
    }
}
