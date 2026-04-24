using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.data;
using API.models;
using API.models.Enums;
using API.dtos;
using System.Text.Json;

namespace API.Controllers;

[ApiController]
[Route("api/admin")]
  [Authorize(Policy = "Admin", AuthenticationSchemes = "Cookies,Bearer")] 
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

        // Les 12 mois de l'année en cours (Jan → Déc)
        var mois = Enumerable.Range(1, 12)
            .Select(i => new DateTime(maintenant.Year, i, 1))
            .ToList();

        // === Historique des utilisateurs (EXCLUT les admins) ===
        var historiqueUsers = new List<int>();
        foreach (var m in mois)
        {
            var count = await _db.Users
                .Where(u => u.Role != RoleUtilisateur.Admin)
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
                Valeur     = await _db.Users.Where(u => u.Role != RoleUtilisateur.Admin).CountAsync(),
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
        // Exclure les admins de la liste
        var query = _db.Users.Where(u => u.Role != RoleUtilisateur.Admin).AsQueryable();

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
      var templates = await _db.Templates.ToListAsync();

      var result = templates.Select(t => new TemplateDto
      {
          Id      = t.IdTemp,
          Nom     = t.Nom,
          Couleur = t.Couleur ?? t.Format ?? "#000000",
          Lignes  = new List<string> { "#cccccc", "#dddddd", "#eeeeee" },
          Structure = ParseStructure(t.StructureJson)
      }).ToList();

      return Ok(result);
  }
    // GET /api/admin/templates/{id}
  [HttpGet("templates/{id}")]
  public async Task<IActionResult> GetTemplate(int id)
  {
      var t = await _db.Templates.FindAsync(id);
      if (t == null)
          return NotFound(new { message = "Template non trouvé" });

      return Ok(new TemplateDto
      {
          Id        = t.IdTemp,
          Nom       = t.Nom,
          Couleur   = t.Couleur ?? t.Format ?? "#000000",
          Lignes    = new List<string> { "#cccccc", "#dddddd", "#eeeeee" },
          Structure = ParseStructure(t.StructureJson)
      });
  }

    // POST /api/admin/templates
  // POST /api/admin/templates
  [HttpPost("templates")]
  public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateDto dto)
  {
      var template = new TemplateCv
      {
          Nom       = dto.Nom,
          Format    = dto.Couleur,
          Couleur   = dto.Couleur,
          ApercuUrl = "https://placeholder.com/preview.png",
          Lignes    = dto.Lignes != null
                        ? string.Join(",", dto.Lignes)
                        : "#cccccc,#dddddd,#eeeeee",
          StructureJson = dto.Structure != null
                            ? JsonSerializer.Serialize(dto.Structure)
                            : null
      };

      _db.Templates.Add(template);
      await _db.SaveChangesAsync();

      return Ok(new TemplateDto
      {
          Id        = template.IdTemp,
          Nom       = template.Nom,
          Couleur   = template.Couleur ?? "#000000",
          Lignes    = dto.Lignes ?? new List<string> { "#cccccc", "#dddddd", "#eeeeee" },
          Structure = dto.Structure
      });
  }
 // PUT /api/admin/templates/{id}
  [HttpPut("templates/{id}")]
  public async Task<IActionResult> UpdateTemplate(int id, [FromBody] UpdateTemplateDto dto)
  {
      var template = await _db.Templates.FindAsync(id);
      if (template == null)
          return NotFound(new { message = "Template non trouvé" });

      template.Nom           = dto.Nom;
      template.Couleur       = dto.Couleur;
      template.Format        = dto.Couleur;
      template.StructureJson = dto.Structure != null
                                 ? JsonSerializer.Serialize(dto.Structure)
                                 : null;

      await _db.SaveChangesAsync();

      return Ok(new TemplateDto
      {
          Id        = template.IdTemp,
          Nom       = template.Nom,
          Couleur   = template.Couleur ?? "#000000",
          Lignes    = new List<string> { "#cccccc", "#dddddd", "#eeeeee" },
          Structure = dto.Structure
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
     private static TemplateStructureDto? ParseStructure(string? json)
      {
          if (string.IsNullOrEmpty(json)) return null;
          try
          {
              return JsonSerializer.Deserialize<TemplateStructureDto>(
                  json,
                  new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
              );
          }
          catch
          {
              return null;
          }
      }
}
