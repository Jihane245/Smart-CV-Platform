using API.controllers;
using API.data;
using API.dtos.Competence;
using API.models;
using API.models.Enums;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using SmartCV.Tests.Helpers;

namespace SmartCV.Tests.Controllers;

public class CompetenceUpgradeControllerTests
{
    // ─── Helper ─────────────────────────────────────────────────────────────────

    private static CompetenceUpgradeController CreateController(
        ApplicationDbContext db,
        string email = "jihane@test.com")
    {
        var mockHttp   = new Mock<IHttpClientFactory>();
        var mockConfig = new Mock<IConfiguration>();
        mockConfig.Setup(c => c["IA_SERVICE_URL"]).Returns("http://ia:8000");

        var controller = new CompetenceUpgradeController(db, mockHttp.Object, mockConfig.Object);
        controller.ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
        {
            HttpContext = TestDbContext.CreateHttpContext(email)
        };
        return controller;
    }

    // ─── Tests GetGaps ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetGaps_UserInconnu_RetourneUnauthorized()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db, "inconnu@test.com");

        var result = await controller.GetGaps(new GapRequest
        {
            TexteOffre = "Offre React Docker"
        });

        result.Should().BeOfType<UnauthorizedResult>();
    }

    // ─── Tests GenerateTest ──────────────────────────────────────────────────────

    [Fact]
    public async Task GenerateTest_UserInconnu_RetourneUnauthorized()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db, "inconnu@test.com");

        var result = await controller.GenerateTest(new GenerateTestRequest
        {
            NomCompetence = "Docker"
        });

        result.Should().BeOfType<UnauthorizedResult>();
    }

    // ─── Tests EvaluateTest ──────────────────────────────────────────────────────

    [Fact]
    public async Task EvaluateTest_TestInexistant_RetourneNotFound()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.EvaluateTest(new EvaluateTestRequest
        {
            TestId   = 999,
            Reponses = [new ReponseDto { Numero = 1, ReponseChoisie = "Option A" }]
        });

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task EvaluateTest_UserInconnu_RetourneUnauthorized()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db, "inconnu@test.com");

        var result = await controller.EvaluateTest(new EvaluateTestRequest
        {
            TestId   = 1,
            Reponses = []
        });

        result.Should().BeOfType<UnauthorizedResult>();
    }

    // ─── Tests GenerateRoadmap ───────────────────────────────────────────────────

    [Fact]
    public async Task GenerateRoadmap_TestInexistant_RetourneNotFound()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.GenerateRoadmap(new RoadmapRequest
        {
            TestId = 999
        });

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GenerateRoadmap_UserInconnu_RetourneUnauthorized()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db, "inconnu@test.com");

        var result = await controller.GenerateRoadmap(new RoadmapRequest
        {
            TestId = 1
        });

        result.Should().BeOfType<UnauthorizedResult>();
    }

    // ─── Tests GetMyRoadmaps ─────────────────────────────────────────────────────

    [Fact]
    public async Task GetMyRoadmaps_UserConnecte_RetourneListeRoadmaps()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.GetMyRoadmaps();

        var ok       = result.Should().BeOfType<OkObjectResult>().Subject;
        var roadmaps = ok.Value as IEnumerable<object>;
        roadmaps.Should().NotBeNull();
        roadmaps!.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetMyRoadmaps_UserInconnu_RetourneUnauthorized()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db, "inconnu@test.com");

        var result = await controller.GetMyRoadmaps();

        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task GetMyRoadmaps_UserSansRoadmap_RetourneListeVide()
    {
        var db = TestDbContext.Create();
        db.Users.Add(new User
        {
            Id           = 1,
            Nom          = "Test",
            Prenom       = "User",
            Email        = "jihane@test.com",
            PasswordHash = "hash",
            IsActif      = true,
            Role         = RoleUtilisateur.Candidat,  // ← using API.models.Enums
            CreatedAt    = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        var result     = await controller.GetMyRoadmaps();

        var ok       = result.Should().BeOfType<OkObjectResult>().Subject;
        var roadmaps = ok.Value as IEnumerable<object>;
        roadmaps!.Should().BeEmpty();
    }

    // ─── Tests ValidateFinal ─────────────────────────────────────────────────────

    [Fact]
    public async Task ValidateFinal_RoadmapInexistante_RetourneNotFound()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.ValidateFinal(new ValidateRequest
        {
            RoadmapId = 999,
            Reponses  = [new ReponseDto { Numero = 1, ReponseChoisie = "Option A" }]
        });

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task ValidateFinal_UserInconnu_RetourneUnauthorized()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db, "inconnu@test.com");

        var result = await controller.ValidateFinal(new ValidateRequest
        {
            RoadmapId = 1,
            Reponses  = []
        });

        result.Should().BeOfType<UnauthorizedResult>();
    }

    // ─── Tests MarquerRoadmapSuivie ──────────────────────────────────────────────

    [Fact]
    public async Task MarquerRoadmapSuivie_RoadmapExistante_RetourneOk()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.MarquerRoadmapSuivie(1);

        result.Should().BeOfType<OkObjectResult>();
        db.Roadmaps.First().RoadmapSuivie.Should().BeTrue();
    }

    [Fact]
    public async Task MarquerRoadmapSuivie_RoadmapInexistante_RetourneNotFound()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.MarquerRoadmapSuivie(999);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task MarquerRoadmapSuivie_UserInconnu_RetourneUnauthorized()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db, "inconnu@test.com");

        var result = await controller.MarquerRoadmapSuivie(1);

        result.Should().BeOfType<UnauthorizedResult>();
    }

    // ─── Tests RetestAfterRoadmap ────────────────────────────────────────────────

    [Fact]
    public async Task RetestAfterRoadmap_RoadmapInexistante_RetourneNotFound()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.RetestAfterRoadmap(999,
        [
            new ReponseDto { Numero = 1, ReponseChoisie = "Un outil de conteneurisation" }
        ]);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task RetestAfterRoadmap_UserInconnu_RetourneUnauthorized()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db, "inconnu@test.com");

        var result = await controller.RetestAfterRoadmap(1,
        [
            new ReponseDto { Numero = 1, ReponseChoisie = "Un outil de conteneurisation" }
        ]);

        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task RetestAfterRoadmap_RoadmapDejaComplete_RetourneBadRequest()
    {
        var db      = TestDbContext.CreateWithSeedData();
        var roadmap = await db.Roadmaps.FindAsync(1);
        roadmap!.Completee = true;
        await db.SaveChangesAsync();

        var controller = CreateController(db);

        var result = await controller.RetestAfterRoadmap(1,
        [
            new ReponseDto { Numero = 1, ReponseChoisie = "Un outil de conteneurisation" }
        ]);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ─── Tests logique évaluation locale ────────────────────────────────────────

    [Fact]
    public void EvaluationLocale_ToutesReponsesCorrectes_Score100()
    {
        var questions = new List<Dictionary<string, object>>
        {
            new() { ["Numero"] = 1, ["bonne_reponse"] = "Un outil de conteneurisation" },
            new() { ["Numero"] = 2, ["bonne_reponse"] = "docker run" }
        };

        var reponses = new List<Dictionary<string, object>>
        {
            new() { ["Numero"] = 1, ["reponse_choisie"] = "Un outil de conteneurisation" },
            new() { ["Numero"] = 2, ["reponse_choisie"] = "docker run" }
        };

        int score = 0;
        foreach (var q in questions)
        {
            var num   = (int)q["Numero"];
            var bonne = (string)q["bonne_reponse"];
            var rep   = reponses.FirstOrDefault(r => (int)r["Numero"] == num);
            if (rep != null && (string)rep["reponse_choisie"] == bonne)
                score++;
        }

        var pourcentage = (int)Math.Round((double)score / questions.Count * 100);
        pourcentage.Should().Be(100);
    }

    [Fact]
    public void EvaluationLocale_AucuneReponseCorrecte_Score0()
    {
        var questions = new List<Dictionary<string, object>>
        {
            new() { ["Numero"] = 1, ["bonne_reponse"] = "Un outil de conteneurisation" },
            new() { ["Numero"] = 2, ["bonne_reponse"] = "docker run" }
        };

        var reponses = new List<Dictionary<string, object>>
        {
            new() { ["Numero"] = 1, ["reponse_choisie"] = "Un OS" },
            new() { ["Numero"] = 2, ["reponse_choisie"] = "docker build" }
        };

        int score = 0;
        foreach (var q in questions)
        {
            var num   = (int)q["Numero"];
            var bonne = (string)q["bonne_reponse"];
            var rep   = reponses.FirstOrDefault(r => (int)r["Numero"] == num);
            if (rep != null && (string)rep["reponse_choisie"] == bonne)
                score++;
        }

        var pourcentage = (int)Math.Round((double)score / questions.Count * 100);
        pourcentage.Should().Be(0);
    }

    [Fact]
    public void NiveauDetecte_Score80Plus_Expert()
    {
        int score  = 85;
        var niveau = score >= 80 ? "Expert" : score >= 50 ? "Moyen" : "Debutant";
        niveau.Should().Be("Expert");
    }

    [Fact]
    public void NiveauDetecte_Score50a79_Moyen()
    {
        int score  = 65;
        var niveau = score >= 80 ? "Expert" : score >= 50 ? "Moyen" : "Debutant";
        niveau.Should().Be("Moyen");
    }

    [Fact]
    public void NiveauDetecte_ScoreMoinsDe50_Debutant()
    {
        int score  = 30;
        var niveau = score >= 80 ? "Expert" : score >= 50 ? "Moyen" : "Debutant";
        niveau.Should().Be("Debutant");
    }

    [Fact]
    public void CompetenceAjoutee_Score60Plus_True()
    {
        int score          = 65;
        bool ajoutee       = score >= 60;
        ajoutee.Should().BeTrue();
    }

    [Fact]
    public void CompetenceAjoutee_ScoreMoinsDe60_False()
    {
        int score    = 45;
        bool ajoutee = score >= 60;
        ajoutee.Should().BeFalse();
    }
}