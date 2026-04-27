[ApiController]
[Route("api/cv")]
[Authorize]
public class CvController : ControllerBase
{
    [HttpGet("{cvId}/pdf")]
    public async Task<IActionResult> TelechargerPdf(int cvId)
    {
        var pdfBytes = await _pdfService.GenererPdf(cvId);
        return File(pdfBytes, "application/pdf", $"cv_{cvId}.pdf");
    }
}