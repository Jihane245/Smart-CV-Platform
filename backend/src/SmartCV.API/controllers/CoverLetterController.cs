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
[Authorize(AuthenticationSchemes = "Bearer")]
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

        if (dto.UserId != currentUser.Id && currentUser.Role != RoleUtilisateur.Admin)
            return Forbid();

        try
        {
            var lettre = await _service.GenerateCoverLetterAsync(dto.UserId, dto.OffreId);
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
}
