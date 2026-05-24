using API.data;
using API.dtos.GapSession;
using API.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.controllers;

[ApiController]
[Route("api/gap-sessions")]
[Authorize]
public class GapSessionController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public GapSessionController(ApplicationDbContext db)
    {
        _db = db;
    }

    private async Task<User?> GetCurrentUser()
    {
        var email = User.FindFirstValue("email");
        if (string.IsNullOrEmpty(email)) return null;
        return await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    // ─── POST /api/gap-sessions ───────────────────────────────────────────────
    // Called from generate-cv step 2 when user clicks "Combler les écarts"
    // or when they download the PDF (so gaps are always persisted).

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGapSessionRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        if (request.CompetencesManquantes.Count == 0)
            return BadRequest(new { message = "Aucune compétence manquante à enregistrer." });

        var session = new GapSession
        {
            UserId             = user.Id,
            TexteOffre         = request.TexteOffre.Length > 500
                                    ? request.TexteOffre[..500]
                                    : request.TexteOffre,
            TitreOffre         = request.TitreOffre,
            Entreprise         = request.Entreprise,
            ScoreCompatibilite = request.ScoreCompatibilite,
        };

        foreach (var s in request.CompetencesManquantes)
        {
            session.Skills.Add(new GapSessionSkill
            {
                NomCompetence = s.NomCompetence,
                Priorite      = s.Priorite,
            });
        }

        _db.GapSessions.Add(session);
        await _db.SaveChangesAsync();

        return Ok(new { sessionId = session.Id });
    }

    // ─── GET /api/gap-sessions ────────────────────────────────────────────────
    // Returns a summary list for the Historique page, newest first.

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var sessions = await _db.GapSessions
            .Include(s => s.Skills)
                .ThenInclude(sk => sk.Roadmap)
                    .ThenInclude(r => r!.Test)
            .Where(s => s.UserId == user.Id)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var result = sessions.Select(s => new GapSessionSummaryDto
        {
            Id                 = s.Id,
            TexteOffre         = s.TexteOffre,
            TitreOffre         = s.TitreOffre,
            Entreprise         = s.Entreprise,
            ScoreCompatibilite = s.ScoreCompatibilite,
            CreatedAt          = s.CreatedAt,
            TotalSkills        = s.Skills.Count,
            SkillsTermines     = s.Skills.Count(sk => sk.Roadmap?.Completee == true),
            SkillsEnCours      = s.Skills.Count(sk => sk.RoadmapId != null && sk.Roadmap?.Completee != true),
        });

        return Ok(result);
    }

    // ─── GET /api/gap-sessions/{id} ───────────────────────────────────────────
    // Full detail with per-skill roadmap state — used when resuming from historique.

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDetail(int id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var session = await _db.GapSessions
            .Include(s => s.Skills)
                .ThenInclude(sk => sk.Roadmap)
                    .ThenInclude(r => r!.Test)
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == user.Id);

        if (session == null) return NotFound(new { message = "Session introuvable." });

        var dto = new GapSessionDetailDto
        {
            Id                 = session.Id,
            TexteOffre         = session.TexteOffre,
            TitreOffre         = session.TitreOffre,
            Entreprise         = session.Entreprise,
            ScoreCompatibilite = session.ScoreCompatibilite,
            CreatedAt          = session.CreatedAt,
            Skills             = session.Skills.Select(sk => MapSkill(sk)).ToList(),
        };

        return Ok(dto);
    }

    // ─── PATCH /api/gap-sessions/{sessionId}/skills/{skillId}/roadmap ─────────
    // Called by the frontend once a roadmap has been generated for a skill,
    // to link the roadmap back to its parent GapSessionSkill.

    [HttpPatch("{sessionId}/skills/{skillId}/roadmap")]
    public async Task<IActionResult> LinkRoadmap(
        int sessionId,
        int skillId,
        [FromBody] LinkRoadmapRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var skill = await _db.GapSessionSkills
            .Include(sk => sk.GapSession)
            .FirstOrDefaultAsync(sk =>
                sk.Id == skillId &&
                sk.GapSessionId == sessionId &&
                sk.GapSession!.UserId == user.Id);

        if (skill == null) return NotFound(new { message = "Compétence de session introuvable." });

        // Verify the roadmap belongs to this user
        var roadmapExists = await _db.Roadmaps
            .AnyAsync(r => r.Id == request.RoadmapId && r.UserId == user.Id);
        if (!roadmapExists) return NotFound(new { message = "Roadmap introuvable." });

        skill.RoadmapId = request.RoadmapId;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Roadmap liée à la compétence." });
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private static GapSessionSkillDto MapSkill(GapSessionSkill sk)
    {
        if (sk.Roadmap == null)
        {
            return new GapSessionSkillDto
            {
                Id            = sk.Id,
                NomCompetence = sk.NomCompetence,
                Priorite      = sk.Priorite,
                RoadmapId     = null,
            };
        }

        var r = sk.Roadmap;

        // Mirror the phase logic from CompetenceUpgradeController.GetRoadmapDetails
        string phase;
        string phaseLibelle;
        int progression;

        if (r.Completee)
        {
            phase        = "Validee";
            phaseLibelle = "Compétence validée";
            progression  = 100;
        }
        else if (r.Test?.Statut == StatutParcours.Echoue)
        {
            phase        = "TestFinalEchoue";
            phaseLibelle = "Test final échoué";
            progression  = 70;
        }
        else if (r.RoadmapSuivie)
        {
            phase        = "PreteAuTestFinal";
            phaseLibelle = "Prête pour le test final";
            progression  = 75;
        }
        else
        {
            phase        = "AParcourir";
            phaseLibelle = "Roadmap à parcourir";
            progression  = r.TestId > 0 ? 25 : 0;
        }

        return new GapSessionSkillDto
        {
            Id            = sk.Id,
            NomCompetence = sk.NomCompetence,
            Priorite      = sk.Priorite,
            RoadmapId     = sk.RoadmapId,
            Phase         = phase,
            PhaseLibelle  = phaseLibelle,
            Progression   = progression,
            Completee     = r.Completee,
            TestScore     = r.Test?.Score,
            NiveauDepart  = r.NiveauDepart.ToString(),
        };
    }
}