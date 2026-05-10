
  using System.ComponentModel.DataAnnotations;
  using System.ComponentModel.DataAnnotations.Schema;

  namespace API.models;

  public class LettreMotivation
  {
      [Key]
      public int Id { get; set; }

      public int UserId { get; set; }
      [ForeignKey("UserId")]
      public User User { get; set; }

      public int OffreId { get; set; }
      [ForeignKey("OffreId")]
      public Offre Offre { get; set; }

      // ⬇️ NOUVEAU
      public int? CvId { get; set; }
      [ForeignKey("CvId")]
      public Cv? Cv { get; set; }

      [MaxLength(10000)]
      public string Contenu { get; set; }

      public DateTime DateGeneration { get; set; }
      public string FilePath { get; set; }
  }