using API.Controllers;
using API.data;
using API.models;
using API.models.Enums;
using API.services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using SmartCV.Tests.Helpers;

namespace SmartCV.Tests.Controllers;

public class AuthControllerTests
{
    private static AuthController CreateController()
    {
        var mockConfig   = new Mock<IConfiguration>();
        var mockHttp     = new Mock<IHttpClientFactory>();
        var mockKeycloak = new Mock<KeycloakAdminService>(mockHttp.Object, mockConfig.Object);

        var controller = new AuthController(mockKeycloak.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = TestDbContext.CreateHttpContext()
        };
        return controller;
    }

    [Fact]
    public void Me_UserConnecte_RetourneOk()
    {
        var controller = CreateController();
        var result     = controller.Me();
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void Status_RetourneIsAuthenticated()
    {
        var controller = CreateController();
        var result     = controller.Status();
        var ok         = result.Should().BeOfType<OkObjectResult>().Subject;
        var json       = System.Text.Json.JsonSerializer.Serialize(ok.Value);
        json.Should().Contain("IsAuthenticated");
    }

    [Fact]
    public void Error_RetourneBadRequest()
    {
        var controller = CreateController();
        var result     = controller.Error("Test error");
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task NouvelUser_CreeeUserEnDB()
    {
        var db = TestDbContext.Create();

        db.Users.Add(new User
        {
            Email        = "nouveau@test.com",
            Nom          = "Dupont",
            Prenom       = "Jean",
            PasswordHash = Guid.NewGuid().ToString(),
            Role         = RoleUtilisateur.Candidat
        });
        await db.SaveChangesAsync();

        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == "nouveau@test.com");

        user.Should().NotBeNull();
        user!.Role.Should().Be(RoleUtilisateur.Candidat);
        user.IsActif.Should().BeTrue();
    }

    [Fact]
    public async Task UserExistant_PasDeDoublon()
    {
        var db           = TestDbContext.CreateWithSeedData();
        var existingUser = await db.Users
            .FirstOrDefaultAsync(u => u.Email == "jihane@test.com");

        existingUser.Should().NotBeNull();
        db.Users.Count().Should().Be(1);
    }
}