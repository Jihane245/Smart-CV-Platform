using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.data;
using API.models;
using API.dtos.Admin;

namespace API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "Admin")]  
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public AdminController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("test")]
    [AllowAnonymous]
    public IActionResult Test()
    {
        return Ok(new { message = "AdminController fonctionne !" });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var maintenant = DateTime.UtcNow;
        
        // Les 7 derniers mois
        var mois = Enumerable.Range(0, 7)
            .Select(i => maintenant.AddMonths(-6 + i))
            .ToList();

        // === Historique des utilisateurs ===
        var historiqueUsers = new List<int>();
        foreach (var m in mois)
        {
            var count = await _db.Users
                .Where(u => u.CreatedAt.Year == m.Year && u.CreatedAt.Month == m.Month)
                .CountAsync();
            historiqueUsers.Add(count);
        }

        // === Historique des CVs ===
        var historiqueCvs = new List<int>();
        foreach (var m in mois)
        {
            var count = await _db.Cvs
                .Where(c => c.DateAnalyse.Year == m.Year && c.DateAnalyse.Month == m.Month)
                .CountAsync();
            historiqueCvs.Add(count);
        }

        // === Historique des candidatures ===
        var historiqueCandidatures = new List<int>();
        foreach (var m in mois)
        {
            var count = await _db.Candidatures
                .Where(c => c.DateEnvoi.Year == m.Year && c.DateEnvoi.Month == m.Month)
                .CountAsync();
            historiqueCandidatures.Add(count);
        }

        // Calcul du delta (différence entre dernier mois et mois précédent)
        var deltaUsers = historiqueUsers.Count >= 2 
            ? historiqueUsers[^1] - historiqueUsers[^2] 
            : historiqueUsers.LastOrDefault();

        // Construction de la réponse
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
                Delta      = historiqueCvs.Count >= 2 ? historiqueCvs[^1] - historiqueCvs[^2] : historiqueCvs.LastOrDefault(),
                Couleur    = "beige",
                Historique = historiqueCvs
            },
            new StatDto
            {
                Label      = "CANDIDATURES ENREGISTREES",
                Valeur     = await _db.Candidatures.CountAsync(),
                Delta      = historiqueCandidatures.Count >= 2 ? historiqueCandidatures[^1] - historiqueCandidatures[^2] : historiqueCandidatures.LastOrDefault(),
                Couleur    = "red",
                Historique = historiqueCandidatures
            }
        };

        return Ok(stats);
    }

    // Génère les initiales depuis prénom + nom (ex: "Jihane Ghazrani" → "JG")
    private static string GenererInitiales(string prenom, string nom)
    {
        var p = prenom?.FirstOrDefault().ToString().ToUpper() ?? "";
        var n = nom?.FirstOrDefault().ToString().ToUpper() ?? "";
        return $"{p}{n}";
    }

    // Génère une couleur déterministe depuis l'id
    private static string GenererCouleur(int id)
    {
        var couleurs = new[] { "#6b8068", "#8b7355", "#c17f6b", "#6b7a8d", "#8d6b8b" };
        return couleurs[id % couleurs.Length];
    }
    [HttpGet("utilisateurs")]
    public async Task<IActionResult> GetUtilisateurs([FromQuery] string? search)
    {
        var query = _db.Users.AsQueryable();

        // Si un terme de recherche est fourni, on filtre
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
                Id           = u.Id.ToString(),  // Convertir Guid en string
                Initiales    = GenererInitiales(u.Prenom, u.Nom),
                CouleurAvatar = GenererCouleur(u.Id),
                Nom          = $"{u.Prenom} {u.Nom}",
                Role         = u.Role.ToString(),  // Enum → string
                Email        = u.Email,
                CvGeneres    = u.Cvs.Count(),
                InscritLe    = u.CreatedAt.ToString("MMM yyyy"),  // "Jan 2025"
                Actif        = u.IsActif
            })
            .ToListAsync();

        return Ok(users);
    }

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

    [HttpDelete("utilisateurs/{id}")]
    public async Task<IActionResult> DeleteUtilisateur(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = "Utilisateur non trouvé" });

        // Sécurité : on ne supprime que les utilisateurs inactifs
        if (user.IsActif)
            return BadRequest(new { message = "Impossible de supprimer un utilisateur actif" });

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Utilisateur supprimé" });
    }

    // GET /api/admin/templates
    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates()
    {
        var templates = await _db.Templates
            .Select(t => new TemplateDto
            {
                Id     = t.IdTemp,
                Nom    = t.Nom,
                Couleur = t.Format ?? "#000000",
                Lignes = new List<string> { "#cccccc", "#dddddd", "#eeeeee" }  // Valeurs par défaut
            })
            .ToListAsync();

        return Ok(templates);
    }

    // POST /api/admin/templates
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

    // DELETE /api/admin/templates/:id
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
}