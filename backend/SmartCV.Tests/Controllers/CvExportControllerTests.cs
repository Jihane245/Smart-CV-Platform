using System.Security.Claims;
using API.Controllers;
using API.data;
using API.models;
using API.services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using SmartCV.Tests.Helpers;

namespace SmartCV.Tests.Controllers;

public class CvExportControllerTests
{
    // ========== HELPER POUR CRÉER LE CONTROLLEUR ==========
    private static CvExportController CreateController(
        ApplicationDbContext? customDb = null,
        string userEmail = "jihane@test.com",
        IPdfGenerationService? customPdfService = null)
    {
        var db = customDb ?? TestDbContext.CreateWithSeedData();
        
        // Créer l'utilisateur s'il n'existe pas
        var existingUser = db.Users.FirstOrDefault(u => u.Email == userEmail);
        if (existingUser == null)
        {
            var newUser = new User
            {
                Email = userEmail,
                Nom = "Test",
                Prenom = "User",
                PasswordHash = "hash123",
                IsActif = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(newUser);
            db.SaveChanges();
        }

        // Mock du service PDF
        var pdfService = customPdfService ?? Mock.Of<IPdfGenerationService>();

        var controller = new CvExportController(pdfService, db);

        // Simuler un utilisateur connecté avec email
        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, userEmail),
            new("email", userEmail)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var user = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        return controller;
    }

    // ========== HELPER POUR CRÉER DES DONNÉES DE TEST ==========
    private static async Task<ApplicationDbContext> CreateDbWithCvs()
    {
        var db = TestDbContext.CreateWithSeedData();

        // Créer un CV personnalisé pour l'utilisateur Id=1
        // Note: CvPersonnalise n'a pas de propriété DateAnalyse
        var cvPersonnalise = new CvPersonnalise
        {
            Id = 1,
            UserId = 1,
            TemplateId = 1,
            Langue = "fr",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        db.CvsPersonnalises.Add(cvPersonnalise);
        await db.SaveChangesAsync();

        // Ajouter des PDFs associés à ce CV
        var pdfs = new List<CvPdf>
        {
            new CvPdf
            {
                Id = 1,
                CvId = 1,
                FileName = "cv_1_20250101120000.pdf",
                CloudUrl = "https://storage.com/cv_1.pdf",
                DateCreation = DateTime.UtcNow.AddDays(-5),
                Prenom = "Jihane",
                Nom = "Ghazrani"
            },
            new CvPdf
            {
                Id = 2,
                CvId = 1,
                FileName = "cv_1_20250102120000.pdf",
                CloudUrl = "https://storage.com/cv_2.pdf",
                DateCreation = DateTime.UtcNow.AddDays(-3),
                Prenom = "Jihane",
                Nom = "Ghazrani"
            }
        };

        db.Set<CvPdf>().AddRange(pdfs);
        await db.SaveChangesAsync();

        return db;
    }

    // ========== 1. TESTS POUR GetMesPdfs ==========

    [Fact]
    public async Task GetMesPdfs_UtilisateurConnecte_RetourneListe()
    {
        // ARRANGE
        var db = await CreateDbWithCvs();
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.GetMesPdfs();

        // ASSERT
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetMesPdfs_UtilisateurSansPdf_RetourneListeVide()
    {
        // ARRANGE
        var db = TestDbContext.CreateWithSeedData();
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.GetMesPdfs();

        // ASSERT
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetMesPdfs_UtilisateurNonExistant_RetourneUnauthorized()
    {
        // ARRANGE
        var db = TestDbContext.Create();
        var controller = new CvExportController(Mock.Of<IPdfGenerationService>(), db);
        
        var claims = new List<Claim>
        {
            new Claim("email", "inexistant@test.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        // ACT
        var result = await controller.GetMesPdfs();

        // ASSERT
        result.Should().BeOfType<UnauthorizedResult>();
    }

    // ========== 2. TESTS POUR ExportPdf ==========

    [Fact]
    public async Task ExportPdf_HtmlValide_RetourneFichierPdf()
    {
        // ARRANGE
        var mockPdfService = new Mock<IPdfGenerationService>();
        var pdfBytes = new byte[] { 1, 2, 3, 4, 5 };
        mockPdfService.Setup(x => x.GenererPdfDepuisHtml(It.IsAny<string>()))
            .ReturnsAsync(pdfBytes);
        mockPdfService.Setup(x => x.SauvegarderPdf(It.IsAny<int>(), It.IsAny<byte[]>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        var db = await CreateDbWithCvs();
        var controller = CreateController(customDb: db, customPdfService: mockPdfService.Object);
        
        var request = new ExportPdfRequest
        {
            HtmlContent = "<html><body><h1>Mon CV</h1></body></html>",
            Prenom = "Jihane",
            Nom = "Ghazrani"
        };

        // ACT
        var result = await controller.ExportPdf(1, request);

        // ASSERT
        var fileResult = result.Should().BeOfType<FileContentResult>().Subject;
        fileResult.ContentType.Should().Be("application/pdf");
        fileResult.FileContents.Should().BeEquivalentTo(pdfBytes);
        fileResult.FileDownloadName.Should().Contain(".pdf");
        
        mockPdfService.Verify(x => x.GenererPdfDepuisHtml(request.HtmlContent), Times.Once);
        mockPdfService.Verify(x => x.SauvegarderPdf(1, pdfBytes, request.Prenom, request.Nom), Times.Once);
    }

    [Fact]
    public async Task ExportPdf_HtmlVide_RetourneBadRequest()
    {
        // ARRANGE
        var controller = CreateController();
        var request = new ExportPdfRequest
        {
            HtmlContent = "",
            Prenom = "Jihane",
            Nom = "Ghazrani"
        };

        // ACT
        var result = await controller.ExportPdf(1, request);

        // ASSERT
        var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequest.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task ExportPdf_HtmlNull_RetourneBadRequest()
    {
        // ARRANGE
        var controller = CreateController();
        var request = new ExportPdfRequest
        {
            HtmlContent = null!,
            Prenom = "Jihane",
            Nom = "Ghazrani"
        };

        // ACT
        var result = await controller.ExportPdf(1, request);

        // ASSERT
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ExportPdf_ServicePdfLeveException_Retourne500()
    {
        // ARRANGE
        var mockPdfService = new Mock<IPdfGenerationService>();
        mockPdfService.Setup(x => x.GenererPdfDepuisHtml(It.IsAny<string>()))
            .ThrowsAsync(new Exception("Erreur de génération PDF"));

        var controller = CreateController(customPdfService: mockPdfService.Object);
        var request = new ExportPdfRequest
        {
            HtmlContent = "<html><body>Test</body></html>",
            Prenom = "Jihane",
            Nom = "Ghazrani"
        };

        // ACT
        var result = await controller.ExportPdf(1, request);

        // ASSERT
        var statusCodeResult = result.Should().BeOfType<ObjectResult>().Subject;
        statusCodeResult.StatusCode.Should().Be(500);
    }

    // ========== 3. TEST D'AUTHORISATION ==========

    [Fact]
    public async Task GetMesPdfs_NonConnecte_RetourneNonAutorise()
    {
        // ARRANGE
        var db = await CreateDbWithCvs();
        var controller = new CvExportController(Mock.Of<IPdfGenerationService>(), db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = TestDbContext.CreateUnauthenticatedHttpContext()
        };

        // ACT
        var result = await controller.GetMesPdfs();

        // ASSERT
        result.Should().BeOfType<UnauthorizedResult>();
    }
}