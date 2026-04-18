using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.data;
using API.models;
using API.dtos;

namespace API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "Admin")]  // Tous les endpoints admin nécessitent le rôle Admin
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public AdminController(ApplicationDbContext db)
    {
        _db = db;
    }

    // =========================================================
    // GET /api/admin/stats
    // Retourne les 3 compteurs avec historique mensuel
    // =========================================================
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var now = DateTime.UtcNow;

        // Calcul des 7 derniers mois (Oct → Mar)
        var mois = Enumerable.Range(0, 7)
            .Select(i => now.AddMonths(-6 + i))
            .ToList();

        // Historique utilisateurs par mois
        var historiqueUsers = new List<int>();
        foreach (var m in mois)
        {
            var count = await _db.Users
                .Where(u => u.CreatedAt.Year == m.Year && u.CreatedAt.Month == m.Month)
                .CountAsync();
            historiqueUsers.Add(count);
        }

        // Historique CVs par mois
        var historiqueCvs = new List<int>();
        foreach (var m in mois)
        {
            var count = await _db.Cvs
                .Where(c => c.DateAnalyse.Year == m.Year && c.DateAnalyse.Month == m.Month)
                .CountAsync();
            historiqueCvs.Add(count);
        }

        // Historique candidatures par mois
        var historiqueCandidatures = new List<int>();
        foreach (var m in mois)
        {
            var count = await _db.Candidatures
                .Where(c => c.DateEnvoi.Year == m.Year && c.DateEnvoi.Month == m.Month)
                .CountAsync();
            historiqueCandidatures.Add(count);
        }

        var deltaUsers = historiqueUsers.Count >= 2
            ? historiqueUsers[^1] - historiqueUsers[^2]
            : historiqueUsers.LastOrDefault();
        var deltaCvs          = historiqueCvs.LastOrDefault();
        var deltaCandidatures = historiqueCandidatures.LastOrDefault();

        var stats = new List<StatDto>
        {
            new StatDto
            {
                Label      = "UTILISATEURS INSCRITS",
                Valeur     = await _db.Users.CountAsync(),
                Delta      = deltaUsers,
                Couleur    = "green",
                Historique = historiqueUsers
            },
            new StatDto
            {
                Label      = "CV GENERES",
                Valeur     = await _db.Cvs.CountAsync(),
                Delta      = deltaCvs,
                Couleur    = "beige",
                Historique = historiqueCvs
            },
            new StatDto
            {
                Label      = "CANDIDATURES ENREGISTREES",
                Valeur     = await _db.Candidatures.CountAsync(),
                Delta      = deltaCandidatures,
                Couleur    = "red",
                Historique = historiqueCandidatures
            }
        };

        return Ok(stats);
    }

    // =========================================================
    // GET /api/admin/utilisateurs?search=...
    // Liste des utilisateurs avec recherche par nom ou email
    // =========================================================
    [HttpGet("utilisateurs")]
    public async Task<IActionResult> GetUtilisateurs([FromQuery] string? search)
    {
        var query = _db.Users.AsQueryable();

        // Filtre par nom ou email si search est fourni
        if (!string.IsNullOrEmpty(search))
        {
            search = search.ToLower();
            query = query.Where(u =>
                u.Nom.ToLower().Contains(search) ||
                u.Prenom.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search));
        }

        var users = await query
            .Select(u => new UtilisateurAdminDto
            {
                Id           = u.Id,
                Initiales    = GenererInitiales(u.Prenom, u.Nom),
                CouleurAvatar = GenererCouleur(u.Id),
                Nom          = $"{u.Prenom} {u.Nom}",
                Role         = u.Role.ToString(),
                Email        = u.Email,
                CvGeneres    = u.Cvs.Count(),
                InscritLe    = u.CreatedAt.ToString("MMM yyyy"),
                Actif        = u.IsActif
            })
            .ToListAsync();

        return Ok(users);
    }

    // =========================================================
    // PUT /api/admin/utilisateurs/:id/actif
    // Activer ou désactiver un utilisateur
    // =========================================================
    [HttpPut("utilisateurs/{id}/actif")]
    public async Task<IActionResult> UpdateActif(int id, [FromBody] UpdateActifDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = "Utilisateur non trouvé" });

        user.IsActif = dto.Actif;
        await _db.SaveChangesAsync();

        return Ok(new { message = $"Utilisateur {(dto.Actif ? "activé" : "désactivé")}" });
    }

    // =========================================================
    // DELETE /api/admin/utilisateurs/:id
    // Supprimer un utilisateur (seulement si inactif)
    // =========================================================
    [HttpDelete("utilisateurs/{id}")]
    public async Task<IActionResult> DeleteUtilisateur(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = "Utilisateur non trouvé" });

        if (user.IsActif)
            return BadRequest(new { message = "Impossible de supprimer un utilisateur actif" });

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Utilisateur supprimé" });
    }

    // =========================================================
    // GET /api/admin/templates
    // Liste des templates CV
    // =========================================================
    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates()
    {
        var templates = await _db.Templates
            .Select(t => new TemplateDto
            {
                Id     = t.IdTemp,
                Nom    = t.Nom,
                Couleur = t.Format ?? "#000000",
                Lignes = new List<string> { "#cccccc", "#dddddd", "#eeeeee" }
            })
            .ToListAsync();

        return Ok(templates);
    }

    // =========================================================
    // POST /api/admin/templates
    // Créer un nouveau template CV
    // =========================================================
    [HttpPost("templates")]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateDto dto)
    {
        var template = new TemplateCv
        {
            Nom    = dto.Nom,
            Format = dto.Couleur
        };

        _db.Templates.Add(template);
        await _db.SaveChangesAsync();

        return Ok(new TemplateDto
        {
            Id      = template.IdTemp,
            Nom     = template.Nom,
            Couleur = template.Format ?? "#000000",
            Lignes  = dto.Lignes ?? new List<string> { "#cccccc", "#dddddd", "#eeeeee" }
        });
    }

    // =========================================================
    // DELETE /api/admin/templates/:id
    // Supprimer un template CV
    // =========================================================
    [HttpDelete("templates/{id}")]
    public async Task<IActionResult> DeleteTemplate(int id)
    {
        var template = await _db.Templates.FindAsync(id);
        if (template == null)
            return NotFound(new { message = "Template non trouvé" });

        _db.Templates.Remove(template);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Template supprimé" });
    }

    // =========================================================
    // HELPERS PRIVÉS
    // =========================================================

    // Génère les initiales depuis prénom + nom (ex: "JG")
    private static string GenererInitiales(string prenom, string nom)
    {
        var p = prenom?.FirstOrDefault().ToString().ToUpper() ?? "";
        var n = nom?.FirstOrDefault().ToString().ToUpper() ?? "";
        return $"{p}{n}";
    }

    // Génère une couleur déterministe depuis l'id (toujours la même pour le même user)
    private static string GenererCouleur(int id)
    {
        var couleurs = new[] { "#6b8068", "#8b7355", "#c17f6b", "#6b7a8d", "#8d6b8b" };
        return couleurs[id % couleurs.Length];
    }
}