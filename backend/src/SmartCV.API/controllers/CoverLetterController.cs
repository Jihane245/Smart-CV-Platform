using API.data;
using API.dtos.CoverLetter;
using API.models;
using API.models.Enums;
using API.services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/coverletter")]
[Authorize(AuthenticationSchemes = "Cookies,Bearer")]
public class CoverLetterController : ControllerBase
{
    private readonly ICoverLetterService _service;
    private readonly ApplicationDbContext _db;

    public CoverLetterController(ICoverLetterService service, ApplicationDbContext db)
    {
        _service = service;
        _db = db;
    }

    private async Task<User?> GetCurrentUserAsync()
    {
        var email = User.FindFirstValue("email");
        if (string.IsNullOrEmpty(email))
            return null;

        return await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    private static CoverLetterResponseDto MapToDto(LettreMotivation lettre) => new()
    {
        Id = lettre.Id,
        UserId = lettre.UserId,
        OffreId = lettre.OffreId,
        Contenu = lettre.Contenu,
        DateGeneration = lettre.DateGeneration,
        FilePath = lettre.FilePath
    };

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] CoverLetterGenerateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var currentUser = await GetCurrentUserAsync();
        if (currentUser == null)
            return Unauthorized();

        // Si UserId est absent → on prend le user courant.
        // Si présent et différent → uniquement les Admin peuvent agir au nom d'un autre.
        if (!dto.UserId.HasValue)
        {
            dto.UserId = currentUser.Id;
        }
        else if (dto.UserId.Value != currentUser.Id && currentUser.Role != RoleUtilisateur.Admin)
        {
            return Forbid();
        }

        try
        {
            var lettre = await _service.GenerateCoverLetterAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = lettre.Id }, MapToDto(lettre));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("generate-from-upload")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> GenerateFromUpload(
        [FromForm] string offreText,
        [FromForm] IFormFile? cvPdf,
        [FromForm] string? offreTitre,
        [FromForm] string? offreEntreprise,
        [FromServices] IPdfTextExtractor pdfExtractor,
        [FromServices] ICoverLetterAiClient aiClient)
    {
        if (string.IsNullOrWhiteSpace(offreText))
            return BadRequest(new { message = "Le texte de l'offre est requis." });

        var currentUser = await GetCurrentUserAsync();
        if (currentUser == null) return Unauthorized();

        string cvText;

        if (cvPdf != null && cvPdf.Length > 0)
        {
            // CAS A : PDF fourni → extraction du texte via PdfPig
            var contentType = cvPdf.ContentType ?? string.Empty;
            if (!contentType.Contains("pdf", StringComparison.OrdinalIgnoreCase)
                && !cvPdf.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Format CV non supporté (PDF requis)." });

            try
            {
                using var stream = cvPdf.OpenReadStream();
                cvText = pdfExtractor.ExtractText(stream);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Lecture du PDF impossible : {ex.Message}" });
            }

            if (string.IsNullOrWhiteSpace(cvText))
                return BadRequest(new { message = "Impossible d'extraire du texte du PDF." });
        }
        else
        {
            // CAS B : pas de PDF → on construit un texte de CV depuis le profil DB de l'utilisateur
            var userWithProfil = await _db.Users
                .Include(u => u.Profil).ThenInclude(p => p.Competences)
                .Include(u => u.Profil).ThenInclude(p => p.Experiences)
                .Include(u => u.Profil).ThenInclude(p => p.Formations)
                .Include(u => u.Profil).ThenInclude(p => p.Certificats)
                .FirstOrDefaultAsync(u => u.Id == currentUser.Id);

            if (userWithProfil?.Profil == null)
                return BadRequest(new { message = "Aucun CV (PDF) fourni et aucun profil utilisateur disponible." });

            cvText = BuildCvTextFromProfil(userWithProfil);

            if (string.IsNullOrWhiteSpace(cvText))
                return BadRequest(new { message = "Profil utilisateur trop vide pour générer une lettre." });
        }

        try
        {
            var contenu = await aiClient.GenerateCoverLetterFromRawTextAsync(
                cvText, offreText, offreTitre, offreEntreprise);

            if (string.IsNullOrWhiteSpace(contenu))
                return StatusCode(502, new { message = "Le service IA a renvoyé un contenu vide." });

            return Ok(new
            {
                contenu,
                dateGeneration = DateTime.UtcNow,
                source = cvPdf != null && cvPdf.Length > 0 ? "pdf" : "profil"
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(502, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    private static string BuildCvTextFromProfil(User user)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"Nom : {user.Prenom} {user.Nom}");
        if (!string.IsNullOrWhiteSpace(user.Email)) sb.AppendLine($"Email : {user.Email}");

        var p = user.Profil;
        if (p == null) return sb.ToString();

        if (!string.IsNullOrWhiteSpace(p.Titre)) sb.AppendLine($"Titre : {p.Titre}");
        if (!string.IsNullOrWhiteSpace(p.Telephone)) sb.AppendLine($"Téléphone : {p.Telephone}");
        if (!string.IsNullOrWhiteSpace(p.Adresse)) sb.AppendLine($"Adresse : {p.Adresse}");
        if (!string.IsNullOrWhiteSpace(p.LinkedIn)) sb.AppendLine($"LinkedIn : {p.LinkedIn}");
        if (!string.IsNullOrWhiteSpace(p.Description))
        {
            sb.AppendLine();
            sb.AppendLine("Profil :");
            sb.AppendLine(p.Description);
        }

        if (p.Competences != null && p.Competences.Any())
        {
            sb.AppendLine();
            sb.AppendLine("Compétences :");
            sb.AppendLine(string.Join(", ", p.Competences.Select(c => c.Nom)));
        }

        if (p.Experiences != null && p.Experiences.Any())
        {
            sb.AppendLine();
            sb.AppendLine("Expériences :");
            foreach (var e in p.Experiences)
            {
                var dateFin = e.DateFin?.ToString("yyyy-MM") ?? "Présent";
                sb.AppendLine($"- {e.Poste} chez {e.Entreprise} ({e.DateDebut:yyyy-MM} → {dateFin})");
                if (!string.IsNullOrWhiteSpace(e.Description))
                    sb.AppendLine($"  {e.Description}");
            }
        }

        if (p.Formations != null && p.Formations.Any())
        {
            sb.AppendLine();
            sb.AppendLine("Formations :");
            foreach (var f in p.Formations)
                sb.AppendLine($"- {f.Diplome} — {f.Etablissement} ({f.Annee})");
        }

        if (p.Certificats != null && p.Certificats.Any())
        {
            sb.AppendLine();
            sb.AppendLine("Certificats :");
            foreach (var c in p.Certificats)
                sb.AppendLine($"- {c.Nom} — {c.Organisme}");
        }

        return sb.ToString();
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var lettre = await _service.GetCoverLetterAsync(id);
        if (lettre == null)
            return NotFound();

        var currentUser = await GetCurrentUserAsync();
        if (currentUser == null)
            return Unauthorized();

        if (lettre.UserId != currentUser.Id && currentUser.Role != RoleUtilisateur.Admin)
            return Forbid();

        return Ok(MapToDto(lettre));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CoverLetterUpdateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var currentUser = await GetCurrentUserAsync();
        if (currentUser == null)
            return Unauthorized();

        var lettre = await _service.GetCoverLetterAsync(id);
        if (lettre == null)
            return NotFound();

        if (lettre.UserId != currentUser.Id && currentUser.Role != RoleUtilisateur.Admin)
            return Forbid();

        var updated = await _service.UpdateCoverLetterAsync(id, dto.Contenu);
        if (updated == null)
            return NotFound();

        return Ok(MapToDto(updated));
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetForUser(int userId)
    {
        var currentUser = await GetCurrentUserAsync();
        if (currentUser == null)
            return Unauthorized();

        if (userId != currentUser.Id && currentUser.Role != RoleUtilisateur.Admin)
            return Forbid();

        var lettres = await _service.GetUserCoverLettersAsync(userId);
        return Ok(lettres.Select(MapToDto));
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> DownloadPdf(int id)
    {
        var currentUser = await GetCurrentUserAsync();
        if (currentUser == null)
            return Unauthorized();

        var lettre = await _service.GetCoverLetterAsync(id);
        if (lettre == null)
            return NotFound();

        if (lettre.UserId != currentUser.Id && currentUser.Role != RoleUtilisateur.Admin)
            return Forbid();

        try
        {
            var pdfBytes = await _service.GeneratePdfAsync(id);
            return File(pdfBytes, "application/pdf", $"lettre_motivation_{id}.pdf");
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("generate-and-save")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> GenerateAndSave(
        [FromForm] string offreText,
        [FromForm] IFormFile? cvPdf,
        [FromForm] string? offreTitre,
        [FromForm] string? offreEntreprise,
        [FromServices] IPdfTextExtractor pdfExtractor)
    {
        if (string.IsNullOrWhiteSpace(offreText))
            return BadRequest(new { message = "Le texte de l'offre est requis." });

        var currentUser = await GetCurrentUserAsync();
        if (currentUser == null) return Unauthorized();

        var dto = new CoverLetterGenerateDto
        {
            UserId = currentUser.Id,
            OffreTexte = offreText,
            OffreTitre = offreTitre,
            OffreEntreprise = offreEntreprise,
        };

        // If PDF provided, attach extracted text as a hint via a transient Cv-like text
        // We reuse OffreTexte path — the service creates the Offre from text anyway.
        // For the CV side: if PDF provided, we extract and store as a temp field.
        // Since GenerateCoverLetterAsync uses the DB profile, we pre-populate it
        // only when a PDF is given by passing cvText via a new optional DTO field.
        
        if (cvPdf != null && cvPdf.Length > 0)
        {
            var ct = cvPdf.ContentType ?? string.Empty;
            if (!ct.Contains("pdf", StringComparison.OrdinalIgnoreCase)
                && !cvPdf.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Format CV non supporté (PDF requis)." });

            try
            {
                using var stream = cvPdf.OpenReadStream();
                dto.CvTexte = pdfExtractor.ExtractText(stream);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Lecture du PDF impossible : {ex.Message}" });
            }

            if (string.IsNullOrWhiteSpace(dto.CvTexte))
                return BadRequest(new { message = "Impossible d'extraire du texte du PDF." });
        }

        try
        {
            var lettre = await _service.GenerateCoverLetterAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = lettre.Id }, MapToDto(lettre));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
