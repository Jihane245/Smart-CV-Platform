using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using API.data;
using API.models;
using API.services;

namespace API.Controllers;

[ApiController]
[Route("api/cv")]
public class CvExportController : ControllerBase
{
    private readonly IPdfGenerationService _pdfService;
    private readonly ApplicationDbContext _db;

    public CvExportController(IPdfGenerationService pdfService, ApplicationDbContext db)
    {
        _pdfService = pdfService;
        _db = db;
    }

    /// <summary>Liste tous les PDFs générés par l'utilisateur courant.</summary>
    [HttpGet("pdfs/me")]
    [Authorize]
    public async Task<IActionResult> GetMesPdfs()
    {
        var email = User.FindFirstValue("email");
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return Unauthorized();

        var pdfs = await _db.Set<CvPdf>()
            .Where(p => _db.CvsPersonnalises
                .Any(c => c.Id == p.CvId && c.UserId == user.Id))
            .OrderByDescending(p => p.DateCreation)
            .Select(p => new
            {
                p.Id,
                p.CvId,
                p.FileName,
                p.CloudUrl,
                p.DateCreation,
                p.Prenom,
                p.Nom,
                NomTemplate = _db.CvsPersonnalises
                    .Where(c => c.Id == p.CvId)
                    .Select(c => c.Template != null ? c.Template.Nom : "")
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(pdfs);
    }

    /// <summary>Exporte un CV en PDF à partir du HTML généré par le frontend.</summary>
    [HttpPost("{id}/export-pdf")]
    public async Task<IActionResult> ExportPdf(int id, [FromBody] ExportPdfRequest request)
    {
        if (string.IsNullOrEmpty(request.HtmlContent))
            return BadRequest(new { message = "Le contenu HTML est requis" });

        try
        {
            var pdfBytes = await _pdfService.GenererPdfDepuisHtml(request.HtmlContent);
            var fileName = $"cv_{id}_{DateTime.Now:yyyyMMddHHmmss}.pdf";
            await _pdfService.SauvegarderPdf(id, pdfBytes, request.Prenom, request.Nom);
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Erreur lors de la génération du PDF: {ex.Message}" });
        }
    }
}

public class ExportPdfRequest
{
    public string HtmlContent { get; set; } = string.Empty;
    public string? Prenom { get; set; }
    public string? Nom { get; set; }
}
