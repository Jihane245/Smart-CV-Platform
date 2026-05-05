using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API.data;
using API.dtos;
using System.Text.Json;

namespace API.Controllers;

[ApiController]
[Route("api/templates")]
[Authorize(AuthenticationSchemes = "Cookies,Bearer")]
public class TemplatesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public TemplatesController(ApplicationDbContext db)
    {
        _db = db;
    }

    // GET /api/templates
    [HttpGet]
    public async Task<IActionResult> GetTemplates()
    {
        var templates = await _db.Templates.ToListAsync();

        var result = templates.Select(t => new TemplateDto
        {
            Id        = t.IdTemp,
            Nom       = t.Nom,
            Couleur   = t.Couleur ?? t.Format ?? "#000000",
            Lignes    = new List<string> { "#cccccc", "#dddddd", "#eeeeee" },
            Structure = ParseStructure(t.StructureJson)
        }).ToList();

        return Ok(result);
    }

    // GET /api/templates/{id}
    [HttpGet("{id}")]
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
