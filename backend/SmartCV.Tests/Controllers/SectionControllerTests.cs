using API.controllers;
using API.data;
using API.dtos.Profil;
using API.models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SmartCV.Tests.Helpers;

namespace SmartCV.Tests.Controllers;

public class SectionControllerTests
{
    private static SectionController CreateController(
        ApplicationDbContext db,
        string email = "jihane@test.com")
    {
        var controller = new SectionController(db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = TestDbContext.CreateHttpContext(email)
        };
        return controller;
    }

    [Fact]
    public async Task GetSections_RetourneListeVide()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result   = await controller.GetSections();
        var ok       = result.Should().BeOfType<OkObjectResult>().Subject;
        var sections = (ok.Value as IEnumerable<object>)!;
        sections.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateSection_DonneesValides_Creee()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var result = await controller.CreateSection(
            new CreateSectionDto { Titre = "Langues", Ordre = 1 });

        result.Should().BeOfType<CreatedAtActionResult>();
        db.SectionsDynamiques.Should().HaveCount(1);
        db.SectionsDynamiques.First().Titre.Should().Be("Langues");
    }

    [Fact]
    public async Task UpdateSection_TitreModifie()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var section = new SectionDynamique
        {
            Id       = Guid.NewGuid(),
            ProfilId = 1,
            Titre    = "Langues",
            Ordre    = 1
        };
        db.SectionsDynamiques.Add(section);
        await db.SaveChangesAsync();

        var result = await controller.UpdateSection(
            section.Id,
            new UpdateSectionDto { Titre = "Langues parlées", Ordre = 2 });

        result.Should().BeOfType<NoContentResult>();
        db.SectionsDynamiques.First().Titre.Should().Be("Langues parlées");
    }

    [Fact]
    public async Task DeleteSection_SupprimeSectionEtLignes()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var section = new SectionDynamique
        {
            Id       = Guid.NewGuid(),
            ProfilId = 1,
            Titre    = "Langues",
            Ordre    = 1
        };
        db.SectionsDynamiques.Add(section);

        db.LignesDynamiques.Add(new LigneDynamique
        {
            Id          = Guid.NewGuid(),
            SectionId   = section.Id,
            Detail      = "Français",
            Description = "Courant",
            Ordre       = 1
        });
        await db.SaveChangesAsync();

        var result = await controller.DeleteSection(section.Id);

        result.Should().BeOfType<NoContentResult>();
        db.SectionsDynamiques.Should().BeEmpty();
        db.LignesDynamiques.Should().BeEmpty();
    }

    [Fact]
    public async Task AddLigne_SectionExistante_Ajoutee()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var section = new SectionDynamique
        {
            Id       = Guid.NewGuid(),
            ProfilId = 1,
            Titre    = "Langues",
            Ordre    = 1
        };
        db.SectionsDynamiques.Add(section);
        await db.SaveChangesAsync();

        var result = await controller.AddLigne(section.Id,
            new CreateLigneDto { Detail = "Anglais", Description = "B2", Ordre = 1 });

        result.Should().BeOfType<CreatedAtActionResult>();
        db.LignesDynamiques.Should().HaveCount(1);
    }

    [Fact]
    public async Task DeleteLigne_Supprimee()
    {
        var db         = TestDbContext.CreateWithSeedData();
        var controller = CreateController(db);

        var section = new SectionDynamique
        {
            Id       = Guid.NewGuid(),
            ProfilId = 1,
            Titre    = "Langues",
            Ordre    = 1
        };
        db.SectionsDynamiques.Add(section);

        var ligne = new LigneDynamique
        {
            Id          = Guid.NewGuid(),
            SectionId   = section.Id,
            Detail      = "Français",
            Description = "Courant",
            Ordre       = 1
        };
        db.LignesDynamiques.Add(ligne);
        await db.SaveChangesAsync();

        var result = await controller.DeleteLigne(section.Id, ligne.Id);

        result.Should().BeOfType<NoContentResult>();
        db.LignesDynamiques.Should().BeEmpty();
    }
}
