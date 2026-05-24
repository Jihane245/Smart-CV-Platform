using API.Controllers;
using API.data;
using API.dtos;
using API.services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using SmartCV.Tests.Helpers;
using API.models;
using API.models.Enums;

namespace SmartCV.Tests.Controllers;

public class AdminControllerTests
{
    // HELPER POUR CRÉER LE CONTROLLEUR ADMIN
    private static AdminController CreateController(
        ApplicationDbContext? customDb = null)
    {
        var db = customDb ?? TestDbContext.Create();
        
        // Utiliser une instance réelle de KeycloakAdminService (pas mock)
        // Pour les tests unitaires, on peut passer null et gérer dans le controller
        // Une meilleure approche : créer un vrai service avec des mocks IHttpClientFactory
        var keycloakService = new KeycloakAdminService(
            Mock.Of<IHttpClientFactory>(),
            Mock.Of<Microsoft.Extensions.Configuration.IConfiguration>()
        );

        var controller = new AdminController(
            db,
            keycloakService,
            Mock.Of<Microsoft.Extensions.Logging.ILogger<AdminController>>());

        // Utiliser le helper existant pour l'utilisateur ADMIN
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = TestDbContext.CreateAdminHttpContext()
        };

        return controller;
    }

    // ========== HELPER POUR AJOUTER DES UTILISATEURS DE TEST ==========
    private static async Task<ApplicationDbContext> CreateDbWithMultipleUsers()
    {
        var db = TestDbContext.Create();

        var users = new List<User>
        {
            new() { Id = 1, Email = "candidat1@test.com", Nom = "Dupont", Prenom = "Jean", Role = RoleUtilisateur.Candidat, IsActif = true, CreatedAt = DateTime.UtcNow.AddMonths(-3) },
            new() { Id = 2, Email = "candidat2@test.com", Nom = "Martin", Prenom = "Sophie", Role = RoleUtilisateur.Candidat, IsActif = false, CreatedAt = DateTime.UtcNow.AddMonths(-2) },
            new() { Id = 4, Email = "admin@system.com", Nom = "Admin", Prenom = "System", Role = RoleUtilisateur.Admin, IsActif = true, CreatedAt = DateTime.UtcNow }
        };

        // Hash factice pour tous
        foreach (var u in users)
            u.PasswordHash = "fakehash123";

        db.Users.AddRange(users);
        await db.SaveChangesAsync();

        return db;
    }

    // ========== 1. TESTS POUR GetStats ==========

    [Fact]
    public async Task GetStats_RetourneTroisStatistiques()
    {
        // ARRANGE
        var db = await CreateDbWithMultipleUsers();
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.GetStats();

        // ASSERT
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var stats = okResult.Value.Should().BeAssignableTo<List<StatDto>>().Subject;
        stats.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetStats_ExclutLesAdminsDuCompteUtilisateurs()
    {
        // ARRANGE
        var db = await CreateDbWithMultipleUsers();
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.GetStats();

        // ASSERT
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var stats = okResult.Value.Should().BeAssignableTo<List<StatDto>>().Subject;
        
        var usersStat = stats.First(s => s.Label.Contains("UTILISATEURS"));
        usersStat.Valeur.Should().Be(2);
    }

    // ========== 2. TESTS POUR GetUtilisateurs ==========

    [Fact]
    public async Task GetUtilisateurs_RetourneListeSansAdmins()
    {
        // ARRANGE
        var db = await CreateDbWithMultipleUsers();
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.GetUtilisateurs(null);

        // ASSERT
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var users = okResult.Value.Should().BeAssignableTo<List<UtilisateurAdminDto>>().Subject;
        
        users.Should().HaveCount(2);
        users.All(u => u.Role != "Admin").Should().BeTrue();
    }

    [Fact]
    public async Task GetUtilisateurs_AvecRecherche_FiltreCorrectement()
    {
        // ARRANGE
        var db = await CreateDbWithMultipleUsers();
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.GetUtilisateurs("Dupont");

        // ASSERT
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var users = okResult.Value.Should().BeAssignableTo<List<UtilisateurAdminDto>>().Subject;
        
        users.Should().HaveCount(1);
        users.First().Nom.Should().Contain("Dupont");
    }

    [Fact]
    public async Task GetUtilisateurs_RechercheSansResultat_RetourneListeVide()
    {
        // ARRANGE
        var db = await CreateDbWithMultipleUsers();
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.GetUtilisateurs("Inexistant");

        // ASSERT
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var users = okResult.Value.Should().BeAssignableTo<List<UtilisateurAdminDto>>().Subject;
        
        users.Should().BeEmpty();
    }

    // ========== 3. TESTS POUR GetUtilisateur ==========

    [Fact]
    public async Task GetUtilisateur_IdExistant_RetourneUtilisateur()
    {
        // ARRANGE
        var db = await CreateDbWithMultipleUsers();
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.GetUtilisateur(1);

        // ASSERT
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetUtilisateur_IdInexistant_RetourneNotFound()
    {
        // ARRANGE
        var db = await CreateDbWithMultipleUsers();
        var controller = CreateController(customDb: db);

        // ACT
        var result = await controller.GetUtilisateur(999);

        // ASSERT
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    // ========== 4. TESTS POUR DeleteUtilisateur ==========

    [Fact]
    public async Task DeleteUtilisateur_IdExistant_SupprimeUtilisateur()
    {
        var db = await CreateDbWithMultipleUsers();
        var controller = CreateController(customDb: db);

        var result = await controller.DeleteUtilisateur(1);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
        (await db.Users.FindAsync(1)).Should().BeNull();
    }

    [Fact]
    public async Task DeleteUtilisateur_IdInexistant_RetourneNotFound()
    {
        var db = await CreateDbWithMultipleUsers();
        var controller = CreateController(customDb: db);

        var result = await controller.DeleteUtilisateur(999);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteUtilisateur_Admin_RetourneBadRequest()
    {
        var db = await CreateDbWithMultipleUsers();
        var controller = CreateController(customDb: db);

        var result = await controller.DeleteUtilisateur(4);

        result.Should().BeOfType<BadRequestObjectResult>();
        (await db.Users.FindAsync(4)).Should().NotBeNull();
    }
}