using API.data;
using API.dtos.User.Dashboard;
using API.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.controllers;

[ApiController]
[Route("api/dashboard/user")]
[Authorize(AuthenticationSchemes = "Cookies,Bearer")]
public class DashboardUserController : ControllerBase
{
    private readonly ApplicationDbContext _db;

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
            .Include(u => u.Cvs)
            .Include(u => u.LettresMotivation)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var nbCv = user.Cvs.Count;
        var nbLettres = user.LettresMotivation.Count;
        var nbCompetences = user.Profil?.Competences.Count ?? 0;

        var scoreCvMoyen = user.Cvs.Any()
            ? user.Cvs.Average(c => c.ScoreCompatibilite)
            : 0;

        var roadmaps = await _db.Roadmaps
            .Include(r => r.Test)
            .Where(r => r.UserId == user.Id)
            .ToListAsync();

        var tests = roadmaps.Select(r => r.Test).Where(t => t != null).ToList();

        var scoreTestsMoyen = tests.Any()
            ? tests.Average(t => t!.Score ?? 0)
            : 0;

        var tauxReussite = tests.Any()
            ? (double)tests.Count(t => (t!.Score ?? 0) >= 60) / tests.Count * 100
            : 0;

        var topCompetencesCv = user.Cvs
            .Where(c => !string.IsNullOrEmpty(c.SkillsDetectes))
            .SelectMany(c => c.SkillsDetectes.Split(',', StringSplitOptions.RemoveEmptyEntries))
            .GroupBy(x => x.Trim())
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => g.Key)
            .ToList();

        var competencesFaibles = roadmaps
            .Where(r => r.Test != null && (r.Test.Score ?? 0) < 50)
            .Select(r => r.NomCompetence)
            .Distinct()
            .ToList();

        string recommendation;

        if (nbCv == 0 && nbTests == 0 && !topCompetencesCv.Any())
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
        else if (competencesFaibles.Any())
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
}