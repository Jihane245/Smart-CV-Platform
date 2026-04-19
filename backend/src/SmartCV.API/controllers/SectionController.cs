using API.data;
using API.dtos.Profil;
using API.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.controllers;

[ApiController]
[Route("api/profil/me/sections")]
[Authorize]
public class SectionController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SectionController(ApplicationDbContext db)
    {
        _db = db;
    }

    // ─── Helper ─────────────────────────────────────────────────────────────────

    private async Task<Profil?> GetCurrentProfil()
    {
        var email = User.FindFirstValue("email");
        if (string.IsNullOrEmpty(email)) return null;

        var user = await _db.Users
            .Include(u => u.Profil)
            .FirstOrDefaultAsync(u => u.Email == email);

        return user?.Profil;
    }

    private static SectionResponseDto MapSection(SectionDynamique s) => new()
    {
        Id     = s.Id,
        Titre  = s.Titre,
        Ordre  = s.Ordre,
        Lignes = s.Lignes?
            .OrderBy(l => l.Ordre)
            .Select(l => new LigneResponseDto
            {
                Id          = l.Id,
                Detail      = l.Detail,
                Description = l.Description,
                Ordre       = l.Ordre
            }).ToList() ?? []
    };

    // ─── Sections ────────────────────────────────────────────────────────────────

    /// <summary>Récupérer toutes les sections du profil</summary>
    [HttpGet]
    public async Task<IActionResult> GetSections()
    {
        var profil = await GetCurrentProfil();
        if (profil == null) return Unauthorized();

        var sections = await _db.SectionsDynamiques
            .Include(s => s.Lignes)
            .Where(s => s.ProfilId == profil.Id)
            .OrderBy(s => s.Ordre)
            .ToListAsync();

        return Ok(sections.Select(MapSection));
    }

    /// <summary>Créer une nouvelle section</summary>
    [HttpPost]
    public async Task<IActionResult> CreateSection([FromBody] CreateSectionDto dto)
    {
        var profil = await GetCurrentProfil();
        if (profil == null) return Unauthorized();

        var section = new SectionDynamique
        {
            ProfilId = profil.Id,
            Titre    = dto.Titre,
            Ordre    = dto.Ordre
        };

        _db.SectionsDynamiques.Add(section);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSections), MapSection(section));
    }

    /// <summary>Modifier le titre et l'ordre d'une section</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSection(Guid id, [FromBody] UpdateSectionDto dto)
    {
        var profil = await GetCurrentProfil();
        if (profil == null) return Unauthorized();

        var section = await _db.SectionsDynamiques
            .FirstOrDefaultAsync(s => s.Id == id && s.ProfilId == profil.Id);
        if (section == null) return NotFound();

        section.Titre = dto.Titre;
        section.Ordre = dto.Ordre;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Supprimer une section et toutes ses lignes</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSection(Guid id)
    {
        var profil = await GetCurrentProfil();
        if (profil == null) return Unauthorized();

        var section = await _db.SectionsDynamiques
            .Include(s => s.Lignes)
            .FirstOrDefaultAsync(s => s.Id == id && s.ProfilId == profil.Id);
        if (section == null) return NotFound();

        _db.SectionsDynamiques.Remove(section); // lignes supprimées en cascade
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Lignes ──────────────────────────────────────────────────────────────────

    /// <summary>Ajouter une ligne à une section</summary>
    [HttpPost("{id:guid}/lignes")]
    public async Task<IActionResult> AddLigne(Guid id, [FromBody] CreateLigneDto dto)
    {
        var profil = await GetCurrentProfil();
        if (profil == null) return Unauthorized();

        var section = await _db.SectionsDynamiques
            .FirstOrDefaultAsync(s => s.Id == id && s.ProfilId == profil.Id);
        if (section == null) return NotFound();

        var ligne = new LigneDynamique
        {
            SectionId   = section.Id,
            Detail      = dto.Detail,
            Description = dto.Description,
            Ordre       = dto.Ordre
        };

        _db.LignesDynamiques.Add(ligne);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSections), new LigneResponseDto
        {
            Id          = ligne.Id,
            Detail      = ligne.Detail,
            Description = ligne.Description,
            Ordre       = ligne.Ordre
        });
    }

    /// <summary>Modifier une ligne</summary>
    [HttpPut("{id:guid}/lignes/{ligneId:guid}")]
    public async Task<IActionResult> UpdateLigne(Guid id, Guid ligneId, [FromBody] UpdateLigneDto dto)
    {
        var profil = await GetCurrentProfil();
        if (profil == null) return Unauthorized();

        // Vérifier que la section appartient au profil
        var sectionExists = await _db.SectionsDynamiques
            .AnyAsync(s => s.Id == id && s.ProfilId == profil.Id);
        if (!sectionExists) return NotFound();

        var ligne = await _db.LignesDynamiques
            .FirstOrDefaultAsync(l => l.Id == ligneId && l.SectionId == id);
        if (ligne == null) return NotFound();

        ligne.Detail      = dto.Detail;
        ligne.Description = dto.Description;
        ligne.Ordre       = dto.Ordre;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Supprimer une ligne</summary>
    [HttpDelete("{id:guid}/lignes/{ligneId:guid}")]
    public async Task<IActionResult> DeleteLigne(Guid id, Guid ligneId)
    {
        var profil = await GetCurrentProfil();
        if (profil == null) return Unauthorized();

        var sectionExists = await _db.SectionsDynamiques
            .AnyAsync(s => s.Id == id && s.ProfilId == profil.Id);
        if (!sectionExists) return NotFound();

        var ligne = await _db.LignesDynamiques
            .FirstOrDefaultAsync(l => l.Id == ligneId && l.SectionId == id);
        if (ligne == null) return NotFound();

        _db.LignesDynamiques.Remove(ligne);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}