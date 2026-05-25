using API.data;
using API.dtos.Cv;
using API.dtos.User.Dashboard;
using API.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace API.controllers;

[ApiController]
[Route("api/dashboard/user")]
[Authorize(AuthenticationSchemes = "Cookies,Bearer")]
public class DashboardUserController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public DashboardUserController(ApplicationDbContext db)
    {
        _db = db;
    }

    private async Task<User?> GetCurrentUser()
    {
        var email = User.FindFirstValue("email");
        if (string.IsNullOrEmpty(email)) return null;

        return await _db.Users
            .Include(u => u.Profil)
                .ThenInclude(p => p.Competences)
            .Include(u => u.LettresMotivation)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var nbCv = await _db.CvPdf
            .CountAsync(p => _db.CvsPersonnalises.Any(c => c.Id == p.CvId && c.UserId == user.Id));

        if (nbCv == 0)
        {
            nbCv = await _db.CvsPersonnalises.CountAsync(c => c.UserId == user.Id);
        }

        var nbLettres = user.LettresMotivation.Count;
        var nbCompetences = user.Profil?.Competences.Count ?? 0;

        var gapSessions = await _db.GapSessions
            .Where(s => s.UserId == user.Id)
            .ToListAsync();

        var scoreCvMoyen = gapSessions.Count > 0
            ? gapSessions.Average(s => s.ScoreCompatibilite)
            : 0;

        var cvsPersonnalises = await _db.CvsPersonnalises
            .Where(c => c.UserId == user.Id)
            .ToListAsync();

        var topCompetencesCv = ExtraireTopCompetences(cvsPersonnalises, user.Profil);

        var roadmaps = await _db.Roadmaps
            .Include(r => r.Test)
            .Where(r => r.UserId == user.Id)
            .ToListAsync();

        var tests = roadmaps.Select(r => r.Test).Where(t => t != null).ToList();

        var scoreTestsMoyen = tests.Count > 0
            ? tests.Average(t => t!.Score ?? 0)
            : 0;

        var tauxReussite = tests.Count > 0
            ? (double)tests.Count(t => (t!.Score ?? 0) >= 60) / tests.Count * 100
            : 0;

        var competencesFaibles = roadmaps
            .Where(r => r.Test != null && (r.Test.Score ?? 0) < 50)
            .Select(r => r.NomCompetence)
            .Distinct()
            .ToList();

        string recommendation;
        if (nbCv == 0 && tests.Count == 0 && topCompetencesCv.Count == 0)
        {
            recommendation = "Commence par compléter ton profil et passer quelques tests.";
        }
        else if (scoreTestsMoyen < 50)
        {
            recommendation = "Tu dois renforcer tes bases techniques avant de continuer.";
        }
        else if (scoreCvMoyen < 60)
        {
            recommendation = "Améliore ton CV pour augmenter ton taux de réponse.";
        }
        else if (competencesFaibles.Count > 0)
        {
            recommendation = $"Travaille surtout : {string.Join(", ", competencesFaibles.Take(2))}";
        }
        else
        {
            recommendation = "Très bon profil ! Continue comme ça 🚀";
        }

        return Ok(new DashboardDto
        {
            NbCv = nbCv,
            NbLettres = nbLettres,
            NbTests = tests.Count,
            NbRoadmaps = roadmaps.Count,
            NbCompetences = nbCompetences,

            ScoreCvMoyen = scoreCvMoyen,
            ScoreTestsMoyen = scoreTestsMoyen,
            TauxReussiteTests = tauxReussite,

            TopCompetencesCv = topCompetencesCv,
            CompetencesFaibles = competencesFaibles,
            Recommendation = recommendation
        });
    }

    private static List<string> ExtraireTopCompetences(
        IEnumerable<CvPersonnalise> cvsPersonnalises,
        Profil? profil)
    {
        var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var cv in cvsPersonnalises)
        {
            if (string.IsNullOrWhiteSpace(cv.ContenuJson)) continue;
            try
            {
                var contenu = JsonSerializer.Deserialize<CvContenuDto>(cv.ContenuJson, JsonOptions);
                if (contenu?.Competences == null) continue;

                foreach (var comp in contenu.Competences.Where(c => c.Visible && !string.IsNullOrWhiteSpace(c.Nom)))
                {
                    var nom = comp.Nom.Trim();
                    counts[nom] = counts.GetValueOrDefault(nom) + 1;
                }
            }
            catch (JsonException)
            {
            }
        }

        if (counts.Count > 0)
        {
            return counts
                .OrderByDescending(kv => kv.Value)
                .ThenBy(kv => kv.Key)
                .Take(5)
                .Select(kv => kv.Key)
                .ToList();
        }

        return (profil?.Competences ?? [])
            .Select(c => c.Nom)
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Take(5)
            .ToList();
    }
}
