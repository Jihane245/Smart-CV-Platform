using API.controllers;
using API.data;
using API.dtos.Cv;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SmartCV.Tests.Helpers;

namespace SmartCV.Tests.Controllers;

public class CvPersonnaliseControllerTests
{
    private static CvPersonnaliseController CreateController(
        ApplicationDbContext db,
        string email = "jihane@test.com")
    {
        var controller = new CvPersonnaliseController(db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = TestDbContext.CreateHttpContext(email)
        };
        return controller;
    }

    [Fact]
    public async Task CreateCv_TemplateValide_CvCreeAvecProfilInjecte()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.CreateCv(new CreateCvPersonnaliseDto
        {
            TemplateId      = 1,
            Langue          = "fr",
            CouleurPrimaire = "#6b8068",
            Police          = "inter",
            TaillePolice    = "md"
        });

        var created = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var cv      = created.Value.Should().BeOfType<CvPersonnaliseResponseDto>().Subject;
        cv.TemplateId.Should().Be(1);
        cv.Langue.Should().Be("fr");
        cv.Contenu.Competences.Should().HaveCount(1);
        cv.Contenu.Competences[0].Nom.Should().Be("React");
        cv.Contenu.Experiences.Should().HaveCount(1);
        cv.Contenu.Formations.Should().HaveCount(1);
        cv.Styles.CouleurPrimaire.Should().Be("#6b8068");
        cv.Styles.CssVariables.Should().Contain("--cv-color-primary");
    }

    [Fact]
    public async Task CreateCv_TemplateInexistant_NotFound()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.CreateCv(
            new CreateCvPersonnaliseDto { TemplateId = 999 });

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetMyCvs_RetourneCvsUser()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        await controller.CreateCv(new CreateCvPersonnaliseDto { TemplateId = 1 });
        await controller.CreateCv(new CreateCvPersonnaliseDto { TemplateId = 1 });

        var result = await controller.GetMyCvs();

        var ok  = result.Should().BeOfType<OkObjectResult>().Subject;
        var cvs = (ok.Value as IEnumerable<CvPersonnaliseResponseDto>)!;
        cvs.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetCv_IdExistant_RetourneCv()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        await controller.CreateCv(new CreateCvPersonnaliseDto { TemplateId = 1 });

        var result = await controller.GetCv(1);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeOfType<CvPersonnaliseResponseDto>();
    }

    [Fact]
    public async Task UpdateStyles_StylesMisAJour()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        await controller.CreateCv(new CreateCvPersonnaliseDto { TemplateId = 1 });

        var result = await controller.UpdateStyles(1, new UpdateStylesDto
        {
            CouleurPrimaire = "#c17f6b",
            Police          = "merriweather",
            TaillePolice    = "lg"
        });

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var cv = ok.Value.Should().BeOfType<CvPersonnaliseResponseDto>().Subject;
        cv.Styles.CouleurPrimaire.Should().Be("#c17f6b");
        cv.Styles.Police.Should().Be("merriweather");
        cv.Styles.CssVariables.Should().Contain("#c17f6b");
    }

    [Fact]
    public async Task UpdateContenu_ContenuMisAJour()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        await controller.CreateCv(new CreateCvPersonnaliseDto { TemplateId = 1 });

        var result = await controller.UpdateContenu(1, new CvContenuDto
        {
            Profil = new CvProfilEditDto
            {
                Titre       = "Senior Developer",
                Description = "10 ans d'expérience"
            },
            Competences =
            [
                new CvCompetenceEditDto
                {
                    Id      = 1,
                    Nom     = "React",
                    Niveau  = "Expert",
                    Visible = false
                }
            ]
        });

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var cv = ok.Value.Should().BeOfType<CvPersonnaliseResponseDto>().Subject;
        cv.Contenu.Profil!.Titre.Should().Be("Senior Developer");
        cv.Contenu.Competences[0].Visible.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteCv_CvExistant_Supprime()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        await controller.CreateCv(new CreateCvPersonnaliseDto { TemplateId = 1 });

        var result = await controller.DeleteCv(1);

        result.Should().BeOfType<NoContentResult>();
        db.CvsPersonnalises.Should().BeEmpty();
    }

    [Fact]
    public async Task ResetFromProfil_ContenuRecharge()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        await controller.CreateCv(new CreateCvPersonnaliseDto { TemplateId = 1 });

        await controller.UpdateContenu(1, new CvContenuDto
        {
            Competences = []
        });

        var result = await controller.ResetFromProfil(1);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        var cv = ok.Value.Should().BeOfType<CvPersonnaliseResponseDto>().Subject;
        cv.Contenu.Competences.Should().HaveCount(1);
    }
}