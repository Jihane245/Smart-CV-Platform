using API.data;
using API.models;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace API.services;

public class CoverLetterService : ICoverLetterService
{
    private readonly ApplicationDbContext _db;
    private readonly ICoverLetterAiClient _aiClient;
    private readonly IPdfGenerationService _pdfService;

    public CoverLetterService(
        ApplicationDbContext db,
        ICoverLetterAiClient aiClient,
        IPdfGenerationService pdfService)
    {
        _db = db;
        _aiClient = aiClient;
        _pdfService = pdfService;
    }

    public async Task<LettreMotivation> GenerateCoverLetterAsync(int userId, int offreId)
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
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            throw new InvalidOperationException("Utilisateur introuvable.");

        if (user.Profil == null)
            throw new InvalidOperationException("Le profil utilisateur est requis pour générer une lettre de motivation.");

        var offre = await _db.Offres.FirstOrDefaultAsync(o => o.Id == offreId);
        if (offre == null)
            throw new InvalidOperationException("Offre introuvable.");

        var analyse = await _db.AnalysesOffre
            .FirstOrDefaultAsync(a => a.OffreId == offreId && a.ProfilId == user.Profil.Id)
            ?? await _db.AnalysesOffre.Where(a => a.OffreId == offreId).OrderByDescending(a => a.DateAnalyse).FirstOrDefaultAsync();

        if (analyse == null)
            throw new InvalidOperationException("Analyse de l'offre introuvable. La lettre de motivation nécessite l'analyse existante.");

        var contenu = await _aiClient.GenerateCoverLetterAsync(user, offre, analyse);
        if (string.IsNullOrWhiteSpace(contenu))
            throw new InvalidOperationException("Le service d'IA a renvoyé un contenu vide.");

        var lettre = new LettreMotivation
        {
            UserId = userId,
            OffreId = offreId,
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

    public async Task<byte[]> GeneratePdfAsync(int id)
    {
        var lettre = await _db.LettresMotivation
            .Include(l => l.User)
            .Include(l => l.Offre)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lettre == null)
            throw new InvalidOperationException("Lettre de motivation introuvable.");

        var htmlContent = BuildHtmlForLetter(lettre);
        return await _pdfService.GenererPdfDepuisHtml(htmlContent);
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
