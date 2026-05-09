using API.data;
using API.models;
using API.models.Enums;
using Microsoft.EntityFrameworkCore;

namespace SmartCV.Tests.Helpers;

public static class TestDbContext
{
    public static ApplicationDbContext Create()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var context = new ApplicationDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    public static ApplicationDbContext CreateWithSeedData()
    {
        var context = Create();

        var user = new User
        {
            Id           = 1,
            Nom          = "Ghazrani",
            Prenom       = "Jihane",
            Email        = "jihane@test.com",
            PasswordHash = "hash123",
            IsActif      = true,
            Role         = RoleUtilisateur.Candidat,
            CreatedAt    = DateTime.UtcNow
        };

        var profil = new Profil
        {
            Id          = 1,
            UserId      = 1,
            Titre       = "Développeur Full Stack",
            Telephone   = "0600000000",
            Adresse     = "Tanger",
            LinkedIn    = "https://linkedin.com/in/jihane",
            Description = "Passionné par le dev",
            Competences = new List<Competence>(),
            Experiences = new List<Experience>(),
            Formations  = new List<Formation>(),
            Certificats = new List<Certificat>(),
            Sections    = new List<SectionDynamique>()
        };

        var competence = new Competence
        {
            IdComp    = 1,
            ProfilId  = 1,
            Nom       = "React",
            Niveau    = NiveauEnum.Intermediaire,
            Categorie = "Frontend"
        };

        var experience = new Experience
        {
            IdExp       = 1,
            ProfilId    = 1,
            Poste       = "Stagiaire Dev",
            Entreprise  = "TechCorp",
            DateDebut   = DateTime.UtcNow.AddYears(-1),
            DateFin     = null,
            Description = "Dev web"
        };

        var formation = new Formation
        {
            IdFrmt        = 1,
            ProfilId      = 1,
            Diplome       = "Ingénierie Informatique",
            Etablissement = "ENSA Tanger",
            Annee         = 2026,
            Mention       = "Très bien"
        };

        var certificat = new Certificat
        {
            Id            = 1,
            ProfilId      = 1,
            Nom           = "AWS Cloud",
            Organisme     = "Amazon",
            DateObtention = DateTime.UtcNow.AddMonths(-6),
            EstValide     = true
        };

        // ← FIX : Lignes est requis dans TemplateCv
        var template = new TemplateCv
        {
            IdTemp    = 1,
            Nom       = "Template Moderne",
            Format    = "modern",
            ApercuUrl = "https://example.com/preview.png",
            Couleur   = "#6b8068",
            Lignes    = "#cccccc,#dddddd,#eeeeee"   // ← ajoute cette ligne
        };

        context.Users.Add(user);
        context.Profils.Add(profil);
        context.Competences.Add(competence);
        context.Experiences.Add(experience);
        context.Formations.Add(formation);
        context.Certificats.Add(certificat);
        context.Templates.Add(template);
        // Ajoute dans CreateWithSeedData après context.Templates.Add(template)

        var testCompetence = new TestCompetence
        {
            Id            = 1,
            UserId        = 1,
            NomCompetence = "Docker",
            QuestionsJson = """
            [
                {
                    "numero": 1,
                    "enonce": "Qu'est-ce que Docker ?",
                    "options": ["Un OS", "Un outil de conteneurisation", "Un langage", "Un framework"],
                    "bonne_reponse": "Un outil de conteneurisation",
                    "explication": "Docker conteneurise les applications"
                },
                {
                    "numero": 2,
                    "enonce": "Quelle commande lance un container ?",
                    "options": ["docker start", "docker run", "docker exec", "docker build"],
                    "bonne_reponse": "docker run",
                    "explication": "docker run crée et lance un container"
                }
            ]
            """,
            Statut    = StatutParcours.EnCours,
            CreatedAt = DateTime.UtcNow
        };

        var roadmap = new Roadmap
        {
            Id            = 1,
            UserId        = 1,
            TestId        = 1,
            NomCompetence = "Docker",
            NiveauDepart  = NiveauTest.Debutant,
            EtapesJson    = """
            [
                {
                    "ordre": 1,
                    "type": "video",
                    "titre": "Docker pour débutants",
                    "description": "Introduction à Docker",
                    "url": "https://youtube.com/watch?v=test",
                    "duree": "30 min"
                },
                {
                    "ordre": 2,
                    "type": "doc",
                    "titre": "Documentation Docker",
                    "description": "Lire la doc officielle",
                    "url": "https://docs.docker.com",
                    "duree": "1h"
                },
                {
                    "ordre": 3,
                    "type": "projet",
                    "titre": "Conteneuriser une API",
                    "description": "Créer un Dockerfile",
                    "url": null,
                    "duree": "2h"
                }
            ]
            """,
            Completee    = false,
            RoadmapSuivie = false,
            CreatedAt    = DateTime.UtcNow
        };

        context.TestsCompetences.Add(testCompetence);
        context.Roadmaps.Add(roadmap);
        context.SaveChanges();

        return context;
    }

    public static Microsoft.AspNetCore.Http.DefaultHttpContext
        CreateHttpContext(string email = "jihane@test.com")
    {
        var claims    = new List<System.Security.Claims.Claim> { new("email", email) };
        var identity  = new System.Security.Claims.ClaimsIdentity(claims, "TestAuth");
        var principal = new System.Security.Claims.ClaimsPrincipal(identity);
        return new Microsoft.AspNetCore.Http.DefaultHttpContext { User = principal };
    }

    public static Microsoft.AspNetCore.Http.DefaultHttpContext CreateAdminHttpContext(string email = "admin@test.com")
    {
        var claims = new List<System.Security.Claims.Claim>
        {
            new(System.Security.Claims.ClaimTypes.Email, email),
            new(System.Security.Claims.ClaimTypes.Role, "Admin")
        };
        var identity = new System.Security.Claims.ClaimsIdentity(claims, "TestAuth");
        var principal = new System.Security.Claims.ClaimsPrincipal(identity);
        return new Microsoft.AspNetCore.Http.DefaultHttpContext { User = principal };
    }

    public static Microsoft.AspNetCore.Http.DefaultHttpContext CreateNonAdminHttpContext(string email = "user@test.com")
    {
        var claims = new List<System.Security.Claims.Claim>
        {
            new(System.Security.Claims.ClaimTypes.Email, email)
        };
        var identity = new System.Security.Claims.ClaimsIdentity(claims, "TestAuth");
        var principal = new System.Security.Claims.ClaimsPrincipal(identity);
        return new Microsoft.AspNetCore.Http.DefaultHttpContext { User = principal };
    }

    public static Microsoft.AspNetCore.Http.DefaultHttpContext CreateUnauthenticatedHttpContext()
    {
        var identity = new System.Security.Claims.ClaimsIdentity();
        var principal = new System.Security.Claims.ClaimsPrincipal(identity);
        return new Microsoft.AspNetCore.Http.DefaultHttpContext { User = principal };
    }
}
