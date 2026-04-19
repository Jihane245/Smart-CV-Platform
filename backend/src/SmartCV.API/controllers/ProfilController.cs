using API.data;
using API.dtos.Profil;
using API.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/profil")]
[Authorize]
public class ProfilController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ProfilController(ApplicationDbContext db)
    {
        _db = db;
    }

    // ─── Helper ────────────────────────────────────────────────────────────────

    private async Task<User?> GetCurrentUser()
    {
        var email = User.FindFirstValue("email");
        if (string.IsNullOrEmpty(email)) return null;

        return await _db.Users
            .Include(u => u.Profil)
                .ThenInclude(p => p.Competences)
            .Include(u => u.Profil)
                .ThenInclude(p => p.Experiences)
            .Include(u => u.Profil)
                .ThenInclude(p => p.Formations)
            .Include(u => u.Profil)
                .ThenInclude(p => p.Certificats)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    private static ProfilResponseDto MapToDto(Profil p) => new()
    {
        Id          = p.Id,
        Titre       = p.Titre,
        Telephone   = p.Telephone,
        Adresse     = p.Adresse,
        LinkedIn    = p.LinkedIn,
        Description = p.Description,
        Competences = p.Competences?.Select(c => new CompetenceDto
        {
            IdComp    = c.IdComp,
            Nom       = c.Nom,
            Niveau    = c.Niveau,
            Categorie = c.Categorie
        }).ToList() ?? [],
        Experiences = p.Experiences?.Select(e => new ExperienceDto
        {
            IdExp      = e.IdExp,
            Poste      = e.Poste,
            Entreprise = e.Entreprise,
            DateDebut  = e.DateDebut,
            DateFin    = e.DateFin,
            Description= e.Description
        }).ToList() ?? [],
        Formations = p.Formations?.Select(f => new FormationDto
        {
            IdFrmt        = f.IdFrmt,
            Diplome       = f.Diplome,
            Etablissement = f.Etablissement,
            Annee         = f.Annee,
            Mention       = f.Mention
        }).ToList() ?? [],
        Certificats = p.Certificats?.Select(c => new CertificatDto
        {
            Id               = c.Id,
            Nom              = c.Nom,
            Organisme        = c.Organisme,
            DateObtention    = c.DateObtention,
            DateExpiration   = c.DateExpiration,
            Niveau           = c.Niveau,
            LienVerification = c.LienVerification,
            Description      = c.Description,
            Identifiant      = c.Identifiant
        }).ToList() ?? []
    };

    // ─── Profil de base ─────────────────────────────────────────────────────────

    /// <summary>Récupère le profil complet de l'utilisateur connecté</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfil()
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        // Créer le profil automatiquement s'il n'existe pas encore
        if (user.Profil == null)
        {
            user.Profil = new Profil
            {
                UserId      = user.Id,
                Competences = [],
                Experiences = [],
                Formations  = [],
                Certificats = []
            };
            await _db.SaveChangesAsync();
        }

        return Ok(MapToDto(user.Profil));
    }

    /// <summary>Met à jour les informations de base du profil</summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfil([FromBody] UpdateProfilDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        if (user.Profil == null)
        {
            user.Profil = new Profil { UserId = user.Id };
            _db.Profils.Add(user.Profil);
        }

        user.Profil.Titre       = dto.Titre;
        user.Profil.Telephone   = dto.Telephone;
        user.Profil.Adresse     = dto.Adresse;
        user.Profil.LinkedIn    = dto.LinkedIn;
        user.Profil.Description = dto.Description;

        await _db.SaveChangesAsync();
        return Ok(MapToDto(user.Profil));
    }

    // ─── Compétences ────────────────────────────────────────────────────────────

    [HttpPost("me/competences")]
    public async Task<IActionResult> AddCompetence([FromBody] CompetenceDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();
        if (user.Profil == null) return BadRequest("Profil introuvable. Appelez GET /api/profil/me d'abord.");

        var competence = new Competence
        {
            ProfilId  = user.Profil.Id,
            Nom       = dto.Nom,
            Niveau    = dto.Niveau,
            Categorie = dto.Categorie
        };

        _db.Competences.Add(competence);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMyProfil), new CompetenceDto
        {
            IdComp    = competence.IdComp,
            Nom       = competence.Nom,
            Niveau    = competence.Niveau,
            Categorie = competence.Categorie
        });
    }

    [HttpPut("me/competences/{id}")]
    public async Task<IActionResult> UpdateCompetence(int id, [FromBody] CompetenceDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var competence = await _db.Competences
            .FirstOrDefaultAsync(c => c.IdComp == id && c.ProfilId == user.Profil!.Id);
        if (competence == null) return NotFound();

        competence.Nom       = dto.Nom;
        competence.Niveau    = dto.Niveau;
        competence.Categorie = dto.Categorie;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("me/competences/{id}")]
    public async Task<IActionResult> DeleteCompetence(int id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var competence = await _db.Competences
            .FirstOrDefaultAsync(c => c.IdComp == id && c.ProfilId == user.Profil!.Id);
        if (competence == null) return NotFound();

        _db.Competences.Remove(competence);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Expériences ─────────────────────────────────────────────────────────────

    [HttpPost("me/experiences")]
    public async Task<IActionResult> AddExperience([FromBody] ExperienceDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();
        if (user.Profil == null) return BadRequest("Profil introuvable.");

       var exp = new Experience
{
    ProfilId    = user.Profil.Id,
    Poste       = dto.Poste,
    Entreprise  = dto.Entreprise,
    DateDebut   = DateTime.SpecifyKind(dto.DateDebut, DateTimeKind.Utc),
    DateFin     = dto.DateFin.HasValue 
                  ? DateTime.SpecifyKind(dto.DateFin.Value, DateTimeKind.Utc) 
                  : null,
    Description = dto.Description
};

        _db.Experiences.Add(exp);
        await _db.SaveChangesAsync();
        dto.IdExp = exp.IdExp;
        return CreatedAtAction(nameof(GetMyProfil), dto);
    }

    [HttpPut("me/experiences/{id}")]
    public async Task<IActionResult> UpdateExperience(int id, [FromBody] ExperienceDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var exp = await _db.Experiences
            .FirstOrDefaultAsync(e => e.IdExp == id && e.ProfilId == user.Profil!.Id);
        if (exp == null) return NotFound();

        exp.Poste       = dto.Poste;
        exp.Entreprise  = dto.Entreprise;
        exp.DateDebut   = dto.DateDebut;
        exp.DateFin     = dto.DateFin;
        exp.Description = dto.Description;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("me/experiences/{id}")]
    public async Task<IActionResult> DeleteExperience(int id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var exp = await _db.Experiences
            .FirstOrDefaultAsync(e => e.IdExp == id && e.ProfilId == user.Profil!.Id);
        if (exp == null) return NotFound();

        _db.Experiences.Remove(exp);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Formations ──────────────────────────────────────────────────────────────

    [HttpPost("me/formations")]
    public async Task<IActionResult> AddFormation([FromBody] FormationDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();
        if (user.Profil == null) return BadRequest("Profil introuvable.");

        var formation = new Formation
        {
            ProfilId      = user.Profil.Id,
            Diplome       = dto.Diplome,
            Etablissement = dto.Etablissement,
            Annee         = dto.Annee,
            Mention       = dto.Mention
        };

        _db.Formations.Add(formation);
        await _db.SaveChangesAsync();
        dto.IdFrmt = formation.IdFrmt;
        return CreatedAtAction(nameof(GetMyProfil), dto);
    }

    [HttpPut("me/formations/{id}")]
    public async Task<IActionResult> UpdateFormation(int id, [FromBody] FormationDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var formation = await _db.Formations
            .FirstOrDefaultAsync(f => f.IdFrmt == id && f.ProfilId == user.Profil!.Id);
        if (formation == null) return NotFound();

        formation.Diplome       = dto.Diplome;
        formation.Etablissement = dto.Etablissement;
        formation.Annee         = dto.Annee;
        formation.Mention       = dto.Mention;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("me/formations/{id}")]
    public async Task<IActionResult> DeleteFormation(int id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var formation = await _db.Formations
            .FirstOrDefaultAsync(f => f.IdFrmt == id && f.ProfilId == user.Profil!.Id);
        if (formation == null) return NotFound();

        _db.Formations.Remove(formation);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Certificats ─────────────────────────────────────────────────────────────

    [HttpPost("me/certificats")]
    public async Task<IActionResult> AddCertificat([FromBody] CertificatDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();
        if (user.Profil == null) return BadRequest("Profil introuvable.");

        var cert = new Certificat
        {
            ProfilId         = user.Profil.Id,
            Nom              = dto.Nom,
            Organisme        = dto.Organisme,
            DateObtention    = dto.DateObtention,
            DateExpiration   = dto.DateExpiration,
            Niveau           = dto.Niveau,
            LienVerification = dto.LienVerification,
            Description      = dto.Description,
            Identifiant      = dto.Identifiant
        };

        _db.Certificats.Add(cert);
        await _db.SaveChangesAsync();
        dto.Id = cert.Id;
        return CreatedAtAction(nameof(GetMyProfil), dto);
    }

    [HttpPut("me/certificats/{id}")]
    public async Task<IActionResult> UpdateCertificat(int id, [FromBody] CertificatDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var cert = await _db.Certificats
            .FirstOrDefaultAsync(c => c.Id == id && c.ProfilId == user.Profil!.Id);
        if (cert == null) return NotFound();

        cert.Nom              = dto.Nom;
        cert.Organisme        = dto.Organisme;
        cert.DateObtention    = dto.DateObtention;
        cert.DateExpiration   = dto.DateExpiration;
        cert.Niveau           = dto.Niveau;
        cert.LienVerification = dto.LienVerification;
        cert.Description      = dto.Description;
        cert.Identifiant      = dto.Identifiant;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("me/certificats/{id}")]
    public async Task<IActionResult> DeleteCertificat(int id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var cert = await _db.Certificats
            .FirstOrDefaultAsync(c => c.Id == id && c.ProfilId == user.Profil!.Id);
        if (cert == null) return NotFound();

        _db.Certificats.Remove(cert);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}