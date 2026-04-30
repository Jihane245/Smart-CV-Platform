using API.data;
using API.dtos.Cv;
using API.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace API.controllers;

[ApiController]
[Route("api/cv")]
[Authorize]
public class CvPersonnaliseController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public CvPersonnaliseController(ApplicationDbContext db)
    {
        _db = db;
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

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
            .Include(u => u.Profil)
                .ThenInclude(p => p.Sections)
                    .ThenInclude(s => s.Lignes)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    private static string BuildCssVariables(CvPersonnalise cv)
    {
        var policeMap = new Dictionary<string, string>
        {
            ["inter"]        = "'Inter', sans-serif",
            ["roboto"]       = "'Roboto', sans-serif",
            ["merriweather"] = "'Merriweather', serif",
            ["playfair"]     = "'Playfair Display', serif",
            ["opensans"]     = "'Open Sans', sans-serif"
        };

        var tailleMap = new Dictionary<string, string>
        {
            ["sm"] = "13px",
            ["md"] = "15px",
            ["lg"] = "17px"
        };

        var font = policeMap.GetValueOrDefault(cv.Police ?? "inter", "'Inter', sans-serif");
        var size = tailleMap.GetValueOrDefault(cv.TaillePolice ?? "md", "15px");

        return $":root {{\n" +
               $"  --cv-color-primary:   {cv.CouleurPrimaire ?? "#6b8068"};\n" +
               $"  --cv-color-secondary: {cv.CouleurSecondaire ?? "#f5f5f0"};\n" +
               $"  --cv-color-text:      {cv.CouleurTexte ?? "#1a1a1a"};\n" +
               $"  --cv-font-family:     {font};\n" +
               $"  --cv-font-size:       {size};\n" +
               $"}}";
    }

    private static string NiveauLabel(string niveau, string lang) =>
        (niveau, lang) switch
        {
            ("Debutant",      "en") => "Beginner",
            ("Intermediaire", "en") => "Intermediate",
            ("Avance",        "en") => "Advanced",
            ("Expert",        "en") => "Expert",
            ("Debutant",       _)   => "Débutant",
            ("Intermediaire",  _)   => "Intermédiaire",
            ("Avance",         _)   => "Avancé",
            _                       => niveau
        };

    // Construire contenu depuis profil (état initial)
    private static CvContenuDto BuildContenuFromProfil(User user, string lang)
    {
        var profil = user.Profil;
        return new CvContenuDto
        {
            Profil = new CvProfilEditDto
            {
                Titre       = profil?.Titre,
                Description = profil?.Description,
                Telephone   = profil?.Telephone,
                Adresse     = profil?.Adresse,
                LinkedIn    = profil?.LinkedIn
            },
            Competences = profil?.Competences?.Select(c => new CvCompetenceEditDto
            {
                Id        = c.IdComp,
                Nom       = c.Nom,
                Niveau    = NiveauLabel(c.Niveau.ToString(), lang),
                Categorie = c.Categorie,
                Visible   = true
            }).ToList() ?? [],

            Experiences = profil?.Experiences?.Select(e => new CvExperienceEditDto
            {
                Id          = e.IdExp,
                Poste       = e.Poste,
                Entreprise  = e.Entreprise,
                DateDebut   = e.DateDebut.ToString("MMM yyyy"),
                DateFin     = e.DateFin.HasValue
                              ? e.DateFin.Value.ToString("MMM yyyy")
                              : (lang == "en" ? "Present" : "Présent"),
                Description = e.Description,
                Visible     = true
            }).ToList() ?? [],

            Formations = profil?.Formations?.Select(f => new CvFormationEditDto
            {
                Id            = f.IdFrmt,
                Diplome       = f.Diplome,
                Etablissement = f.Etablissement,
                Annee         = f.Annee,
                Mention       = f.Mention,
                Visible       = true
            }).ToList() ?? [],

            Certificats = profil?.Certificats?.Select(c => new CvCertificatEditDto
            {
                Id            = c.Id,
                Nom           = c.Nom,
                Organisme     = c.Organisme,
                DateObtention = c.DateObtention.ToString("MMM yyyy"),
                Niveau        = c.Niveau,
                Visible       = true
            }).ToList() ?? [],

            SectionsDynamiques = profil?.Sections?
                .OrderBy(s => s.Ordre)
                .Select(s => new CvSectionEditDto
                {
                    Id      = s.Id,
                    Titre   = s.Titre,
                    Ordre   = s.Ordre,
                    Visible = true,
                    Lignes  = s.Lignes.OrderBy(l => l.Ordre).Select(l => new CvLigneEditDto
                    {
                        Id          = l.Id,
                        Detail      = l.Detail,
                        Description = l.Description,
                        Ordre       = l.Ordre
                    }).ToList()
                }).ToList() ?? []
        };
    }

    private CvPersonnaliseResponseDto MapToResponse(CvPersonnalise cv, CvContenuDto contenu) => new()
    {
        Id          = cv.Id,
        TemplateId  = cv.TemplateId,
        NomTemplate = cv.Template?.Nom ?? string.Empty,
        Langue      = cv.Langue,
        UpdatedAt   = cv.UpdatedAt,
        Styles      = new StylesCvDto
        {
            CouleurPrimaire   = cv.CouleurPrimaire   ?? "#6b8068",
            CouleurSecondaire = cv.CouleurSecondaire ?? "#f5f5f0",
            CouleurTexte      = cv.CouleurTexte      ?? "#1a1a1a",
            Police            = cv.Police            ?? "inter",
            TaillePolice      = cv.TaillePolice      ?? "md",
            CssVariables      = BuildCssVariables(cv)
        },
        Contenu = contenu
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>Créer un CV personnalisé depuis un template</summary>
    [HttpPost]
    public async Task<IActionResult> CreateCv([FromBody] CreateCvPersonnaliseDto dto)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var template = await _db.Templates.FindAsync(dto.TemplateId);
        if (template == null) return NotFound("Template introuvable.");

        var lang = dto.Langue == "en" ? "en" : "fr";

        // Construire le contenu initial depuis le profil
        var contenu = BuildContenuFromProfil(user, lang);
        var contenuJson = JsonSerializer.Serialize(contenu);

        var cv = new CvPersonnalise
        {
            UserId           = user.Id,
            TemplateId       = dto.TemplateId,
            Langue           = lang,
            CouleurPrimaire  = dto.CouleurPrimaire  ?? template.Couleur ?? "#6b8068",
            CouleurSecondaire= dto.CouleurSecondaire ?? "#f5f5f0",
            CouleurTexte     = dto.CouleurTexte     ?? "#1a1a1a",
            Police           = dto.Police           ?? "inter",
            TaillePolice     = dto.TaillePolice     ?? "md",
            ContenuJson      = contenuJson
        };

        _db.CvsPersonnalises.Add(cv);
        await _db.SaveChangesAsync();

        await _db.Entry(cv).Reference(c => c.Template).LoadAsync();

        return CreatedAtAction(nameof(GetCv), new { id = cv.Id }, MapToResponse(cv, contenu));
    }

    /// <summary>Récupérer tous les CVs personnalisés du user</summary>
    [HttpGet]
    public async Task<IActionResult> GetMyCvs()
    {
        var email = User.FindFirstValue("email");
        var user  = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return Unauthorized();

        var cvs = await _db.CvsPersonnalises
            .Include(c => c.Template)
            .Where(c => c.UserId == user.Id)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();

        var result = cvs.Select(cv =>
        {
            var contenu = string.IsNullOrEmpty(cv.ContenuJson)
                ? new CvContenuDto()
                : JsonSerializer.Deserialize<CvContenuDto>(cv.ContenuJson,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                  ?? new CvContenuDto();
            return MapToResponse(cv, contenu);
        });

        return Ok(result);
    }

    /// <summary>Récupérer un CV personnalisé par ID</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCv(int id)
    {
        var email = User.FindFirstValue("email");
        var user  = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return Unauthorized();

        var cv = await _db.CvsPersonnalises
            .Include(c => c.Template)
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == user.Id);

        if (cv == null) return NotFound("CV introuvable.");

        var contenu = string.IsNullOrEmpty(cv.ContenuJson)
            ? new CvContenuDto()
            : JsonSerializer.Deserialize<CvContenuDto>(cv.ContenuJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
              ?? new CvContenuDto();

        return Ok(MapToResponse(cv, contenu));
    }

    /// <summary>Modifier le contenu du CV (textes, visibilité des sections)</summary>
    [HttpPut("{id}/contenu")]
    public async Task<IActionResult> UpdateContenu(int id, [FromBody] CvContenuDto dto)
    {
        var email = User.FindFirstValue("email");
        var user  = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return Unauthorized();

        var cv = await _db.CvsPersonnalises
            .Include(c => c.Template)
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == user.Id);
        if (cv == null) return NotFound("CV introuvable.");

        cv.ContenuJson = JsonSerializer.Serialize(dto);
        cv.UpdatedAt   = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(MapToResponse(cv, dto));
    }

    /// <summary>Modifier les styles du CV (couleurs, police)</summary>
    [HttpPut("{id}/styles")]
    public async Task<IActionResult> UpdateStyles(int id, [FromBody] UpdateStylesDto dto)
    {
        var email = User.FindFirstValue("email");
        var user  = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return Unauthorized();

        var cv = await _db.CvsPersonnalises
            .Include(c => c.Template)
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == user.Id);
        if (cv == null) return NotFound("CV introuvable.");

        if (dto.CouleurPrimaire   != null) cv.CouleurPrimaire   = dto.CouleurPrimaire;
        if (dto.CouleurSecondaire != null) cv.CouleurSecondaire = dto.CouleurSecondaire;
        if (dto.CouleurTexte      != null) cv.CouleurTexte      = dto.CouleurTexte;
        if (dto.Police            != null) cv.Police            = dto.Police;
        if (dto.TaillePolice      != null) cv.TaillePolice      = dto.TaillePolice;
        if (dto.Langue            != null) cv.Langue            = dto.Langue;

        cv.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var contenu = string.IsNullOrEmpty(cv.ContenuJson)
            ? new CvContenuDto()
            : JsonSerializer.Deserialize<CvContenuDto>(cv.ContenuJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
              ?? new CvContenuDto();

        return Ok(MapToResponse(cv, contenu));
    }

    /// <summary>Supprimer un CV personnalisé</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCv(int id)
    {
        var email = User.FindFirstValue("email");
        var user  = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return Unauthorized();

        var cv = await _db.CvsPersonnalises
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == user.Id);
        if (cv == null) return NotFound("CV introuvable.");

        _db.CvsPersonnalises.Remove(cv);
        await _db.SaveChangesAsync();
        return NoContent();
    }
    /// <summary>Réinitialiser le contenu depuis le profil actuel</summary>
[HttpPost("{id}/reset")]
public async Task<IActionResult> ResetFromProfil(int id)
{
    var user = await GetCurrentUser();
    if (user == null) return Unauthorized();

    var cv = await _db.CvsPersonnalises
        .Include(c => c.Template)
        .FirstOrDefaultAsync(c => c.Id == id && c.UserId == user.Id);
    if (cv == null) return NotFound("CV introuvable.");

    var contenu = BuildContenuFromProfil(user, cv.Langue);
    cv.ContenuJson = JsonSerializer.Serialize(contenu);
    cv.UpdatedAt   = DateTime.UtcNow;

    await _db.SaveChangesAsync();
    return Ok(MapToResponse(cv, contenu));
}
}