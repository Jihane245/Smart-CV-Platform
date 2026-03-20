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

    // DbSet pour toutes les entités
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ============================================================
        // CONFIGURATION DES ENUMS (stockés en string dans la base)
        // ============================================================
        
        modelBuilder.Entity<Competence>()
            .Property(c => c.Niveau)
            .HasConversion<string>();
        
        modelBuilder.Entity<Cv>()
            .Property(c => c.Statut)
            .HasConversion<string>();
        
        modelBuilder.Entity<Candidature>()
            .Property(c => c.Statut)
            .HasConversion<string>();
        
        modelBuilder.Entity<Offre>()
            .Property(o => o.TypeContrat)
            .HasConversion<string>();
        
        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasConversion<string>();

        // ============================================================
        // CONFIGURATION DES INDEX UNIQUES
        // ============================================================
        
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
        
        modelBuilder.Entity<Competence>()
            .HasIndex(c => c.Nom)
            .IsUnique();
        
        modelBuilder.Entity<TemplateCv>()
            .HasIndex(t => t.Nom)
            .IsUnique();

        // ============================================================
        // CONFIGURATION DES RELATIONS (simplifiée)
        // ============================================================
        
        // User 1 --- 1 Profil
        modelBuilder.Entity<User>()
            .HasOne(u => u.Profil)
            .WithOne(p => p.User)
            .HasForeignKey<Profil>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // Profil 1 --- * Competence
        modelBuilder.Entity<Competence>()
            .HasOne(c => c.Profil)
            .WithMany(p => p.Competences)
            .HasForeignKey(c => c.ProfilId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // Profil 1 --- * Experience
        modelBuilder.Entity<Experience>()
            .HasOne(e => e.Profil)
            .WithMany(p => p.Experiences)
            .HasForeignKey(e => e.ProfilId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // Profil 1 --- * Formation
        modelBuilder.Entity<Formation>()
            .HasOne(f => f.Profil)
            .WithMany(p => p.Formations)
            .HasForeignKey(f => f.ProfilId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // Profil 1 --- * Certificat
        modelBuilder.Entity<Certificat>()
            .HasOne(c => c.Profil)
            .WithMany(p => p.Certificats)
            .HasForeignKey(c => c.ProfilId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // User 1 --- * CV
        modelBuilder.Entity<Cv>()
            .HasOne(c => c.User)
            .WithMany(u => u.Cvs)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // TemplateCv 1 --- * CV
        modelBuilder.Entity<Cv>()
            .HasOne(c => c.Template)
            .WithMany(t => t.Cvs)
            .HasForeignKey(c => c.TemplateId)
            .OnDelete(DeleteBehavior.SetNull);
        
        // User 1 --- * LettreMotivation
        modelBuilder.Entity<LettreMotivation>()
            .HasOne(l => l.User)
            .WithMany(u => u.LettresMotivation)
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // User 1 --- * Candidature
        modelBuilder.Entity<Candidature>()
            .HasOne(c => c.User)
            .WithMany(u => u.Candidatures)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        
        // Offre 1 --- * Candidature
        modelBuilder.Entity<Candidature>()
            .HasOne(c => c.Offre)
            .WithMany(o => o.Candidatures)
            .HasForeignKey(c => c.OffreId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // CV 1 --- * Candidature
        modelBuilder.Entity<Candidature>()
            .HasOne(c => c.Cv)
            .WithMany(cv => cv.Candidatures)
            .HasForeignKey(c => c.CVId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // Offre 1 --- * AnalyseOffre
        modelBuilder.Entity<AnalyseOffre>()
            .HasOne(a => a.Offre)
            .WithMany(o => o.Analyses)
            .HasForeignKey(a => a.OffreId)
            .OnDelete(DeleteBehavior.Cascade);

        // ============================================================
        // CONFIGURATION DES PROPRIÉTÉS JSON (PostgreSQL)
        // ============================================================
        
        modelBuilder.Entity<AnalyseOffre>()
            .Property(a => a.MotsClesExtraits)
            .HasColumnType("jsonb");
        
        modelBuilder.Entity<AnalyseOffre>()
            .Property(a => a.CompetencesRequises)
            .HasColumnType("jsonb");
        
        modelBuilder.Entity<AnalyseOffre>()
            .Property(a => a.CompetencesMatch)
            .HasColumnType("jsonb");
        
        modelBuilder.Entity<AnalyseOffre>()
            .Property(a => a.CompetencesManquantes)
            .HasColumnType("jsonb");
        
        modelBuilder.Entity<Cv>()
            .Property(c => c.SkillsDetectes)
            .HasColumnType("jsonb");

        // ============================================================
        // VALEURS PAR DÉFAUT
        // ============================================================
        
        modelBuilder.Entity<User>()
            .Property(u => u.IsActif)
            .HasDefaultValue(true);
        
        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasDefaultValue(RoleUtilisateur.Candidat);
        
        modelBuilder.Entity<Cv>()
            .Property(c => c.Statut)
            .HasDefaultValue(StatutCVEnum.BROUILLON);
        
        modelBuilder.Entity<Candidature>()
            .Property(c => c.Statut)
            .HasDefaultValue(StatutCandidature.enregistrée);
    }
}