using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using API.services;

namespace API.Controllers;

[ApiController]
[Route("api/cv")]
//[Authorize]
public class CvExportController : ControllerBase
{
    private readonly IPdfGenerationService _pdfService;

    public CvExportController(IPdfGenerationService pdfService)
    {
        _pdfService = pdfService;
    }

    /// <summary>
    /// Exporte un CV en PDF à partir du HTML généré par le frontend
    /// </summary>
    /// <param name="id">ID du CV</param>
    /// <param name="request">Contient le HTML généré par le frontend</param>
    [HttpPost("{id}/export-pdf")]
    public async Task<IActionResult> ExportPdf(int id, [FromBody] ExportPdfRequest request)
    {
        if (string.IsNullOrEmpty(request.HtmlContent))
            return BadRequest(new { message = "Le contenu HTML est requis" });
        
        try
        {
            var pdfBytes = await _pdfService.GenererPdfDepuisHtml(request.HtmlContent);
            var fileName = $"cv_{id}_{DateTime.Now:yyyyMMddHHmmss}.pdf";
            
            // Sauvegarder l'historique
            await _pdfService.SauvegarderPdf(id, pdfBytes);
            
            // Retourner le PDF
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
}