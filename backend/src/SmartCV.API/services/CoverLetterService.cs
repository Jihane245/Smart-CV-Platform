using API.data;
using API.dtos.CoverLetter;
using API.models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace API.services;

public class CoverLetterService : ICoverLetterService
{
    private readonly ApplicationDbContext _db;
    private readonly ICoverLetterAiClient _aiClient;
    private readonly IPdfGenerationService _pdfService;

    private readonly string _wwwrootPath;

    public CoverLetterService(
        ApplicationDbContext db,
        ICoverLetterAiClient aiClient,
        IPdfGenerationService pdfService,
        IWebHostEnvironment env)
    {
        _db = db;
        _aiClient = aiClient;
        _pdfService = pdfService;
        _wwwrootPath = env.WebRootPath      // resolves to wwwroot/
            ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
    }

    public async Task<LettreMotivation> GenerateCoverLetterAsync(CoverLetterGenerateDto request)
    {
        var user = await _db.Users
            .Include(u => u.Profil)
                .ThenInclude(p => p.Competences)
            .Include(u => u.Profil)
                .ThenInclude(p => p.Experiences)
            .Include(u => u.Profil)
                .ThenInclude(p => p.Formations)
            .Include(u => u.Profil)
                .ThenInclude(p => p.Certificats)
            .FirstOrDefaultAsync(u => u.Id == request.UserId);

        if (user == null)
            throw new InvalidOperationException("Utilisateur introuvable.");

        if (user.Profil == null)
            throw new InvalidOperationException("Le profil utilisateur est requis pour générer une lettre de motivation.");

        Offre offre;
        AnalyseOffre analyse;

        if (request.OffreId.HasValue)
        {
            offre = await _db.Offres.FirstOrDefaultAsync(o => o.Id == request.OffreId.Value);
            if (offre == null)
                throw new InvalidOperationException("Offre introuvable.");

            analyse = await _db.AnalysesOffre
                .FirstOrDefaultAsync(a => a.OffreId == request.OffreId.Value && a.ProfilId == user.Profil.Id)
                ?? await _db.AnalysesOffre.Where(a => a.OffreId == request.OffreId.Value).OrderByDescending(a => a.DateAnalyse).FirstOrDefaultAsync();

            if (analyse == null)
                throw new InvalidOperationException("Analyse de l'offre introuvable. La lettre de motivation nécessite l'analyse existante.");
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.OffreTexte) && request.OffreImage == null)
                throw new InvalidOperationException("Offre texte ou image requis pour la génération manuelle.");

            offre = new Offre
            {
                Titre = string.IsNullOrWhiteSpace(request.OffreTitre) ? "Offre saisie manuellement" : request.OffreTitre,
                Entreprise = string.IsNullOrWhiteSpace(request.OffreEntreprise) ? "Entreprise inconnue" : request.OffreEntreprise,
                Description = string.IsNullOrWhiteSpace(request.OffreTexte) ? string.Empty : request.OffreTexte,
                Exigences = string.Empty,
                TypeContrat = string.Empty,
                UrlOffre = string.Empty,
                DatePublication = DateTime.UtcNow,
                DateExpiration = null
            };

            var competencesProfil = user.Profil.Competences?.Select(c => c.Nom).Where(n => !string.IsNullOrWhiteSpace(n)).ToList() ?? new List<string>();

            if (!string.IsNullOrWhiteSpace(request.OffreTexte))
            {
                analyse = await _aiClient.AnalyzeOfferTextAsync(request.OffreTexte, competencesProfil);
            }
            else if (request.OffreImage != null)
            {
                using var stream = request.OffreImage.OpenReadStream();
                var length = (int)request.OffreImage.Length;
                var bytes = new byte[length];
                await stream.ReadAsync(bytes.AsMemory(0, length));
                analyse = await _aiClient.AnalyzeOfferImageAsync(bytes, request.OffreImage.ContentType ?? "image/jpeg");
            }
            else
            {
                throw new InvalidOperationException("Impossible de traiter l'offre manuelle. Texte ou image requis.");
            }

            _db.Offres.Add(offre);
            await _db.SaveChangesAsync();

            analyse.OffreId = offre.Id;
            analyse.ProfilId = user.Profil.Id;
            analyse.DateAnalyse = DateTime.UtcNow;

            _db.AnalysesOffre.Add(analyse);
            await _db.SaveChangesAsync();
        }

        var contenu = await _aiClient.GenerateCoverLetterAsync(user, offre, analyse);
        if (string.IsNullOrWhiteSpace(contenu))
            throw new InvalidOperationException("Le service d'IA a renvoyé un contenu vide.");

        var lettre = new LettreMotivation
        {
            UserId = request.UserId,
            OffreId = request.OffreId ?? offre.Id,
            Contenu = contenu,
            DateGeneration = DateTime.UtcNow
        };

        _db.LettresMotivation.Add(lettre);
        await _db.SaveChangesAsync();
        return lettre;
    }

    public async Task<LettreMotivation?> GetCoverLetterAsync(int id)
    {
        return await _db.LettresMotivation
            .Include(l => l.Offre)
            .Include(l => l.User)
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    public async Task<IEnumerable<LettreMotivation>> GetUserCoverLettersAsync(int userId)
    {
        return await _db.LettresMotivation
            .Include(l => l.Offre)
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.DateGeneration)
            .ToListAsync();
    }

    public async Task<LettreMotivation?> UpdateCoverLetterAsync(int id, string contenu)
    {
        var lettre = await _db.LettresMotivation.FirstOrDefaultAsync(l => l.Id == id);
        if (lettre == null)
            return null;

        lettre.Contenu = contenu;
        await _db.SaveChangesAsync();
        return lettre;
    }

    public async Task<(byte[] Bytes, string FileName)> GeneratePdfAsync(int id)
    {
        var lettre = await _db.LettresMotivation
            .Include(l => l.User)
            .Include(l => l.Offre)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lettre == null)
            throw new InvalidOperationException("Lettre de motivation introuvable.");

        var fileName = $"lettre_motivation_{id}.pdf";
        var relativePath = Path.Combine("pdfs", fileName);          // stored in DB
        var absolutePath = Path.Combine(_wwwrootPath, relativePath); // disk path

        // ── Cache hit: file already exists on disk and path is recorded ──────────
        if (!string.IsNullOrEmpty(lettre.FilePath) && File.Exists(absolutePath))
        {
            var cached = await File.ReadAllBytesAsync(absolutePath);
            return (cached, fileName);
        }

        // ── Cache miss: generate, persist, update DB ──────────────────────────────
        var htmlContent = BuildHtmlForLetter(lettre);
        var pdfBytes = await _pdfService.GenererPdfDepuisHtml(htmlContent);

        var directory = Path.GetDirectoryName(absolutePath)!;
        Directory.CreateDirectory(directory);                        // idempotent
        await File.WriteAllBytesAsync(absolutePath, pdfBytes);

        lettre.FilePath = relativePath;                              // track in DB
        await _db.SaveChangesAsync();

        return (pdfBytes, fileName);
    }

    private static string BuildHtmlForLetter(LettreMotivation lettre)
    {
        var userName = WebUtility.HtmlEncode($"{lettre.User?.Prenom} {lettre.User?.Nom}");
        var offreTitle = WebUtility.HtmlEncode(lettre.Offre?.Titre ?? string.Empty);
        var offreEntreprise = WebUtility.HtmlEncode(lettre.Offre?.Entreprise ?? string.Empty);
        var contenu = WebUtility.HtmlEncode(lettre.Contenu ?? string.Empty)
            .Replace("\n", "<br />");

        return $"<html><head><meta charset=\"UTF-8\"><title>Lettre de motivation</title></head><body>" +
               $"<h1>Lettre de motivation</h1>" +
               $"<p><strong>Candidat :</strong> {userName}</p>" +
               $"<p><strong>Offre :</strong> {offreTitle} - {offreEntreprise}</p>" +
               $"<hr/>" +
               $"<div>{contenu}</div>" +
               $"</body></html>";
    }
}
