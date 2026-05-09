using API.Controllers;
using API.data;
using API.dtos.Profil;
using API.models;
using API.models.Enums;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SmartCV.Tests.Helpers;

namespace SmartCV.Tests.Controllers;

public class ProfilControllerTests
{
    private static ProfilController CreateController(
        ApplicationDbContext db,
        string email = "jihane@test.com")
    {
        var controller = new ProfilController(db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = TestDbContext.CreateHttpContext(email)
        };
        return controller;
    }

    [Fact]
    public async Task GetMyProfil_UserExiste_RetourneProfilComplet()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.GetMyProfil();

        var ok     = result.Should().BeOfType<OkObjectResult>().Subject;
        var profil = ok.Value.Should().BeOfType<ProfilResponseDto>().Subject;
        profil.Titre.Should().Be("Développeur Full Stack");
        profil.Competences.Should().HaveCount(1);
        profil.Experiences.Should().HaveCount(1);
        profil.Formations.Should().HaveCount(1);
        profil.Certificats.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetMyProfil_UserInconnu_RetourneUnauthorized()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db, "inconnu@test.com");

        var result = await controller.GetMyProfil();

        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task GetMyProfil_SansProfil_CreeProfil()
    {
        var db = TestDbContext.Create();
        db.Users.Add(new User
        {
            Id           = 1,
            Nom          = "Test",
            Prenom       = "User",
            Email        = "nouveau@test.com",
            PasswordHash = "hash",
            IsActif      = true,
            Role         = RoleUtilisateur.Candidat,
            CreatedAt    = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db, "nouveau@test.com");
        var result     = await controller.GetMyProfil();

        result.Should().BeOfType<OkObjectResult>();
        db.Profils.Should().HaveCount(1);
    }

    [Fact]
    public async Task UpdateMyProfil_DonneesValides_MisAJour()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.UpdateMyProfil(new UpdateProfilDto
        {
            Titre     = "Senior Developer",
            Telephone = "0699999999",
            Adresse   = "Casablanca"
        });

        var ok     = result.Should().BeOfType<OkObjectResult>().Subject;
        var profil = ok.Value.Should().BeOfType<ProfilResponseDto>().Subject;
        profil.Titre.Should().Be("Senior Developer");
        profil.Adresse.Should().Be("Casablanca");
    }

    [Fact]
    public async Task AddCompetence_DonneesValides_Creee()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.AddCompetence(new CompetenceDto
        {
            Nom       = "Docker",
            Niveau    = NiveauEnum.Avance,
            Categorie = "DevOps"
        });

        result.Should().BeOfType<CreatedAtActionResult>();
        db.Competences.Count().Should().Be(2);
    }

    [Fact]
    public async Task UpdateCompetence_IdExistant_MisAJour()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.UpdateCompetence(1, new CompetenceDto
        {
            Nom    = "React",
            Niveau = NiveauEnum.Expert
        });

        result.Should().BeOfType<NoContentResult>();
        db.Competences.First().Niveau.Should().Be(NiveauEnum.Expert);
    }

    [Fact]
    public async Task UpdateCompetence_IdInexistant_NotFound()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.UpdateCompetence(999, new CompetenceDto
        {
            Nom    = "React",
            Niveau = NiveauEnum.Expert
        });

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task DeleteCompetence_IdExistant_Supprimee()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.DeleteCompetence(1);

        result.Should().BeOfType<NoContentResult>();
        db.Competences.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteCompetence_IdInexistant_NotFound()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.DeleteCompetence(999);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task AddExperience_DonneesValides_Creee()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.AddExperience(new ExperienceDto
        {
            Poste      = "Dev Backend",
            Entreprise = "NewCorp",
            DateDebut  = DateTime.UtcNow.AddMonths(-6),
            Description = "" 
        });

        result.Should().BeOfType<CreatedAtActionResult>();
        db.Experiences.Count().Should().Be(2);
    }

    [Fact]
    public async Task DeleteExperience_IdExistant_Supprimee()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.DeleteExperience(1);

        result.Should().BeOfType<NoContentResult>();
        db.Experiences.Should().BeEmpty();
    }

    [Fact]
    public async Task AddFormation_DonneesValides_Creee()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.AddFormation(new FormationDto
        {
            Diplome       = "Master IA",
            Etablissement = "ENSIAS",
            Annee         = 2027,
            Mention       = "Bien"
        });

        result.Should().BeOfType<CreatedAtActionResult>();
        db.Formations.Count().Should().Be(2);
    }

    [Fact]
    public async Task DeleteFormation_IdExistant_Supprimee()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.DeleteFormation(1);

        result.Should().BeOfType<NoContentResult>();
        db.Formations.Should().BeEmpty();
    }

    [Fact]
    public async Task AddCertificat_DonneesValides_Cree()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.AddCertificat(new CertificatDto
        {
            Nom           = "Azure Developer",
            Organisme     = "Microsoft",
            DateObtention = DateTime.UtcNow
        });

        result.Should().BeOfType<CreatedAtActionResult>();
        db.Certificats.Count().Should().Be(2);
    }

    [Fact]
    public async Task DeleteCertificat_IdExistant_Supprime()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.DeleteCertificat(1);

        result.Should().BeOfType<NoContentResult>();
        db.Certificats.Should().BeEmpty();
    }
}
