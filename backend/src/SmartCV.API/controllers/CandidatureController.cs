using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.data;
using API.models;
using API.models.Enums;
using System.Security.Claims;
using API.dtos.Candidature;

namespace API.Controllers;

[ApiController]
[Route("api/candidatures")]
[Authorize]
public class CandidatureController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public CandidatureController(ApplicationDbContext db)
    {
        _db = db;
    }
    

    private int GetUserId()
    {
        // On vérifie "email" et ClaimTypes.Email pour être sûr de récupérer l'information
        var email = User.FindFirst("email")?.Value ?? User.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(email))
            throw new UnauthorizedAccessException("Email manquant dans le token");

        var user = _db.Users.FirstOrDefault(u => u.Email == email);
        if (user == null)
            throw new UnauthorizedAccessException($"Utilisateur introuvable pour l'email: {email}");

        return user.Id;
    }


    [HttpGet]
    public async Task<IActionResult> GetMesCandidatures()
    {
        var userId = GetUserId();
        var list = await _db.Candidatures
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.DateEnvoi)
            .Select(c => new {
                c.Id,
                c.Entreprise,
                c.Poste,
                c.DateEnvoi,
                Statut = c.Statut.ToString(),
                c.Notes
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Ajouter([FromBody] CandidatureAjoutDto dto)
    {
        var userId = GetUserId();

        var nouvelle = new Candidature
        {
            UserId = userId,
            Entreprise = dto.Entreprise,
            Poste = dto.Poste,
            DateEnvoi = dto.DateEnvoi,
            Statut = StatutCandidature.enregistrée,  // statut par défaut
            Notes = dto.Notes
        };

        _db.Candidatures.Add(nouvelle);
        await _db.SaveChangesAsync();

        return Ok(new { id = nouvelle.Id, message = "Candidature ajoutée" });
    }

    [HttpPut("{id}/statut")]
    public async Task<IActionResult> ChangerStatut(int id, [FromBody] StatutDto dto)
    {
        var userId = GetUserId();
        var candidature = await _db.Candidatures
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (candidature == null)
            return NotFound(new { message = "Candidature non trouvée" });

        // Convertir le texte reçu en enum
        candidature.Statut = Enum.Parse<StatutCandidature>(dto.Statut);
        await _db.SaveChangesAsync();

        return Ok(new { message = $"Statut mis à jour : {dto.Statut}" });
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> Supprimer(int id)
    {
        var userId = GetUserId();
        var candidature = await _db.Candidatures
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (candidature == null)
            return NotFound(new { message = "Candidature non trouvée" });

        _db.Candidatures.Remove(candidature);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Candidature supprimée" });
    }
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var candidatures = await _db.Candidatures
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var total = candidatures.Count;
        var nonArchivees = candidatures.Count(c => c.Statut != StatutCandidature.archivée);
        var acceptees = candidatures.Count(c => c.Statut == StatutCandidature.acceptée);
        var refusees = candidatures.Count(c => c.Statut == StatutCandidature.refusée);
        var enCours = candidatures.Count(c => 
            c.Statut != StatutCandidature.acceptée && 
            c.Statut != StatutCandidature.refusée && 
            c.Statut != StatutCandidature.archivée);

        var stats = new
        {
            total = total,
            actives = nonArchivees,
            acceptees = acceptees,
            refusees = refusees,
            enCours = enCours,
            tauxAcceptation = total > 0 ? Math.Round((double)acceptees / total * 100, 1) : 0,
            parStatut = new
            {
                enregistree = candidatures.Count(c => c.Statut == StatutCandidature.enregistrée),
                envoyee = candidatures.Count(c => c.Statut == StatutCandidature.envoyée),
                recue = candidatures.Count(c => c.Statut == StatutCandidature.reçue),
                enCoursExamen = candidatures.Count(c => c.Statut == StatutCandidature.en_cours_d_examen),
                entretien = candidatures.Count(c => c.Statut == StatutCandidature.entretien),
                acceptee = acceptees,
                refusee = refusees,
                archivee = candidatures.Count(c => c.Statut == StatutCandidature.archivée)
            }
        };

        return Ok(stats);
    }
}
