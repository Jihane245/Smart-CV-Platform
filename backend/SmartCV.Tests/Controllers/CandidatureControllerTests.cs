using System.Security.Claims;
using API.Controllers;
using API.data;
using API.dtos.Candidature;
using API.models;
using API.models.Enums;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using SmartCV.Tests.Helpers;

namespace SmartCV.Tests.Controllers;

public class CandidatureControllerTests
{
    // ========== HELPER POUR CRÉER LE CONTROLLEUR ==========
    private static CandidatureController CreateController(
        ApplicationDbContext? customDb = null,
        string userEmail = "jihane@test.com")
    {
        var db = customDb ?? TestDbContext.Create();
        
        // Créer l'utilisateur s'il n'existe pas en base
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
                Role = RoleUtilisateur.Candidat,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(newUser);
            db.SaveChanges();
        }

        var controller = new CandidatureController(db);

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
    private static async Task<ApplicationDbContext> CreateDbWithCandidatures()
    {
        var db = TestDbContext.CreateWithSeedData();

        // Ajouter des candidatures pour l'utilisateur existant (Id=1)
        var candidatures = new List<Candidature>
        {
            new()
            {
                Id = 1,
                UserId = 1,
                Entreprise = "TechCorp",
                Poste = "Développeur Full Stack",
                DateEnvoi = DateTime.UtcNow.AddDays(-10),
                Statut = StatutCandidature.envoyee,
                Notes = "Premier entretien prévu"
            },
            new()
            {
                Id = 2,
                UserId = 1,
                Entreprise = "StartupXYZ",
                Poste = "Dev React",
                DateEnvoi = DateTime.UtcNow.AddDays(-5),
                Statut = StatutCandidature.acceptee,
                Notes = "Offre reçue"
            },
            new()
            {
                Id = 3,
                UserId = 1,
                Entreprise = "BigCorp",
                Poste = "Tech Lead",
                DateEnvoi = DateTime.UtcNow.AddDays(-20),
                Statut = StatutCandidature.refusee,
                Notes = null
            }
        };

        db.Candidatures.AddRange(candidatures);
        await db.SaveChangesAsync();

        return db;
    }

    // ========== 1. TESTS POUR GetMesCandidatures ==========

    [Fact]
    public async Task GetMesCandidatures_UtilisateurConnecte_RetourneListe()
    {
        // ARRANGE
        var db = await CreateDbWithCandidatures();
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.GetMesCandidatures();

        // ASSERT
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetMesCandidatures_UtilisateurSansCandidature_RetourneListeVide()
    {
        // ARRANGE
        var db = TestDbContext.Create();
        
        // Créer un utilisateur qui n'a pas de candidatures
        var nouvelUtilisateur = new User
        {
            Id = 100,
            Email = "nouveau@test.com",
            Nom = "Nouveau",
            Prenom = "User",
            PasswordHash = "hash123",
            IsActif = true,
            Role = RoleUtilisateur.Candidat,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(nouvelUtilisateur);
        await db.SaveChangesAsync();
        
        var controller = CreateController(customDb: db, userEmail: "nouveau@test.com");

        // ACT
        var result = await controller.GetMesCandidatures();

        // ASSERT
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    // ========== 2. TESTS POUR Ajouter ==========

    [Fact]
    public async Task Ajouter_CandidatureValide_RetourneOk()
    {
        // ARRANGE
        var db = await CreateDbWithCandidatures();
        var controller = CreateController(customDb: db);
        var dto = new CandidatureAjoutDto
        {
            Entreprise = "Nouvelle Entreprise",
            Poste = "Dev Full Stack",
            DateEnvoi = DateTime.UtcNow,
            Notes = "À suivre"
        };

        // ACT
        var result = await controller.Ajouter(dto);

        // ASSERT
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Ajouter_DoublonEntreprisePoste_RetourneConflict()
    {
        var db = await CreateDbWithCandidatures();
        var controller = CreateController(customDb: db);
        var dto = new CandidatureAjoutDto
        {
            Entreprise = "  techcorp ",
            Poste = "Développeur Full Stack",
            DateEnvoi = DateTime.UtcNow,
        };

        var result = await controller.Ajouter(dto);

        result.Should().BeOfType<ConflictObjectResult>();
    }

    [Fact]
    public async Task Ajouter_UtilisateurNonExistant_RetourneUnauthorized()
    {
        // ARRANGE
        var db = TestDbContext.Create();
        // Utilisateur non existant en DB (pas créé via CreateController)
        var controller = new CandidatureController(db);
        
        // Simuler un utilisateur avec email inexistant
        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, "inexistant@test.com"),
            new("email", "inexistant@test.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var user = new ClaimsPrincipal(identity);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
        
        var dto = new CandidatureAjoutDto
        {
            Entreprise = "Test",
            Poste = "Test",
            DateEnvoi = DateTime.UtcNow
        };

        // ACT
        Func<Task> act = async () => await controller.Ajouter(dto);

        // ASSERT
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    // ========== 3. TESTS POUR ChangerStatut ==========

    [Fact]
    public async Task ChangerStatut_CandidatureExiste_RetourneOk()
    {
        // ARRANGE
        var db = await CreateDbWithCandidatures();
        var controller = CreateController(customDb: db);
        var dto = new StatutDto { Statut = "acceptée" };

        // ACT
        var result = await controller.ChangerStatut(1, dto);

        // ASSERT
        result.Should().BeOfType<OkObjectResult>();

        // Vérifier que le statut a bien changé
        var candidature = await db.Candidatures.FindAsync(1);
        candidature!.Statut.Should().Be(StatutCandidature.acceptee);
    }

    [Fact]
    public async Task ChangerStatut_CandidatureInexistante_RetourneNotFound()
    {
        // ARRANGE
        var db = await CreateDbWithCandidatures();
        var controller = CreateController(customDb: db);
        var dto = new StatutDto { Statut = "acceptée" };
        var idInexistant = 99999;

        // ACT
        var result = await controller.ChangerStatut(idInexistant, dto);

        // ASSERT
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task ChangerStatut_StatutInvalide_RetourneException()
    {
        // ARRANGE
        var db = await CreateDbWithCandidatures();
        var controller = CreateController(customDb: db);
        var dto = new StatutDto { Statut = "statut_invalide" };

        // ACT
        Func<Task> act = async () => await controller.ChangerStatut(1, dto);

        // ASSERT
        await act.Should().ThrowAsync<ArgumentException>();
    }

    // ========== 4. TESTS POUR Supprimer ==========

    [Fact]
    public async Task Supprimer_CandidatureExiste_RetourneOk()
    {
        // ARRANGE
        var db = await CreateDbWithCandidatures();
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.Supprimer(1);

        // ASSERT
        result.Should().BeOfType<OkObjectResult>();

        // Vérifier que la candidature a été supprimée
        var candidature = await db.Candidatures.FindAsync(1);
        candidature.Should().BeNull();
    }

    [Fact]
    public async Task Supprimer_CandidatureInexistante_RetourneNotFound()
    {
        // ARRANGE
        var db = await CreateDbWithCandidatures();
        var controller = CreateController(customDb: db);
        var idInexistant = 99999;

        // ACT
        var result = await controller.Supprimer(idInexistant);

        // ASSERT
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ========== 5. TESTS POUR GetStats ==========

    [Fact]
    public async Task GetStats_UtilisateurConnecte_RetourneStats()
    {
        // ARRANGE
        var db = await CreateDbWithCandidatures();
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.GetStats();

        // ASSERT
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetStats_CalculTauxAcceptation_Correct()
    {
        // ARRANGE
        var db = await CreateDbWithCandidatures();
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.GetStats();

        // ASSERT
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
        // Total = 3 candidatures, acceptée = 1 -> taux = 33.3
    }

    [Fact]
    public async Task GetStats_UtilisateurSansCandidature_RetourneZeros()
    {
        // ARRANGE
        var db = TestDbContext.CreateWithSeedData(); // User existe mais sans candidature
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.GetStats();

        // ASSERT
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    // ========== 6. TEST D'AUTHORISATION ==========

    [Fact]
    public async Task GetMesCandidatures_NonConnecte_RetourneUnauthorized()
    {
        // ARRANGE
        var db = await CreateDbWithCandidatures();
        var controller = new CandidatureController(db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = TestDbContext.CreateUnauthenticatedHttpContext()
        };

        // ACT
        Func<Task> act = async () => await controller.GetMesCandidatures();

        // ASSERT
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}