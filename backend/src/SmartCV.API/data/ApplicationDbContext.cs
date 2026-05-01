using Microsoft.EntityFrameworkCore;
using API.models;
using API.models.Enums;

namespace API.data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Admin> Admins { get; set; }
    public DbSet<Profil> Profils { get; set; }
    public DbSet<Competence> Competences { get; set; }
    public DbSet<Experience> Experiences { get; set; }
    public DbSet<Formation> Formations { get; set; }
    public DbSet<Certificat> Certificats { get; set; }
    public DbSet<Offre> Offres { get; set; }
    public DbSet<AnalyseOffre> AnalysesOffre { get; set; }
    public DbSet<Cv> Cvs { get; set; }
    public DbSet<TemplateCv> Templates { get; set; }
    public DbSet<LettreMotivation> LettresMotivation { get; set; }
    public DbSet<Candidature> Candidatures { get; set; }
    public DbSet<SectionDynamique> SectionsDynamiques { get; set; }
    public DbSet<LigneDynamique> LignesDynamiques { get; set; }
    public DbSet<CvPersonnalise> CvsPersonnalises { get; set; }
    public DbSet<CvPdf> CvPdf {get; set; }
    public DbSet<TestCompetence> TestsCompetences { get; set; }
    public DbSet<Roadmap> Roadmaps { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Competence>().Property(c => c.Niveau).HasConversion<string>();
        modelBuilder.Entity<Cv>().Property(c => c.Statut).HasConversion<string>();
        modelBuilder.Entity<Candidature>().Property(c => c.Statut).HasConversion<string>();
        modelBuilder.Entity<Offre>().Property(o => o.TypeContrat).HasConversion<string>();
        modelBuilder.Entity<User>().Property(u => u.Role).HasConversion<string>();
        modelBuilder.Entity<SectionDynamique>().HasOne(s => s.Profil).WithMany(p => p.Sections).HasForeignKey(s => s.ProfilId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<LigneDynamique>().HasOne(l => l.Section).WithMany(s => s.Lignes).HasForeignKey(l => l.SectionId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<Competence>().HasIndex(c => c.Nom).IsUnique();
        modelBuilder.Entity<TemplateCv>().HasIndex(t => t.Nom).IsUnique();

        modelBuilder.Entity<User>().HasOne(u => u.Profil).WithOne(p => p.User).HasForeignKey<Profil>(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Competence>().HasOne(c => c.Profil).WithMany(p => p.Competences).HasForeignKey(c => c.ProfilId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Experience>().HasOne(e => e.Profil).WithMany(p => p.Experiences).HasForeignKey(e => e.ProfilId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Formation>().HasOne(f => f.Profil).WithMany(p => p.Formations).HasForeignKey(f => f.ProfilId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Certificat>().HasOne(c => c.Profil).WithMany(p => p.Certificats).HasForeignKey(c => c.ProfilId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Cv>().HasOne(c => c.User).WithMany(u => u.Cvs).HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Cv>().HasOne(c => c.Template).WithMany(t => t.Cvs).HasForeignKey(c => c.TemplateId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<LettreMotivation>().HasOne(l => l.User).WithMany(u => u.LettresMotivation).HasForeignKey(l => l.UserId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Candidature>().HasOne(c => c.User).WithMany(u => u.Candidatures).HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Candidature>().HasOne(c => c.Offre).WithMany(o => o.Candidatures).HasForeignKey(c => c.OffreId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Candidature>().HasOne(c => c.Cv).WithMany(cv => cv.Candidatures).HasForeignKey(c => c.CVId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<AnalyseOffre>().HasOne(a => a.Offre).WithMany(o => o.Analyses).HasForeignKey(a => a.OffreId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AnalyseOffre>().Property(a => a.MotsClesExtraits).HasColumnType("jsonb");
        modelBuilder.Entity<AnalyseOffre>().Property(a => a.CompetencesRequises).HasColumnType("jsonb");
        modelBuilder.Entity<AnalyseOffre>().Property(a => a.CompetencesMatch).HasColumnType("jsonb");
        modelBuilder.Entity<AnalyseOffre>().Property(a => a.CompetencesManquantes).HasColumnType("jsonb");
        modelBuilder.Entity<Cv>().Property(c => c.SkillsDetectes).HasColumnType("jsonb");

        modelBuilder.Entity<User>().Property(u => u.IsActif).HasDefaultValue(true);
        modelBuilder.Entity<User>().Property(u => u.Role).HasDefaultValue(RoleUtilisateur.Candidat);
        modelBuilder.Entity<Cv>().Property(c => c.Statut).HasDefaultValue(StatutCVEnum.BROUILLON);
     
        modelBuilder.Entity<Candidature>().Property(c => c.Statut).HasDefaultValue(StatutCandidature.enregistrée);
        modelBuilder.Entity<CvPersonnalise>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CvPersonnalise>()
            .HasOne(c => c.Template)
            .WithMany()
            .HasForeignKey(c => c.TemplateId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // Dans OnModelCreating
        modelBuilder.Entity<TestCompetence>()
            .HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Roadmap>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Roadmap>()
            .HasOne(r => r.Test)
            .WithMany()
            .HasForeignKey(r => r.TestId)
            .OnDelete(DeleteBehavior.Restrict);
    }   
}
