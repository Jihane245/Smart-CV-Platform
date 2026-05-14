namespace API.dtos.User.Dashboard;

public class DashboardDto
{
    // Stats simples
    public int NbCv { get; set; }
    public int NbLettres { get; set; }
    public int NbTests { get; set; }
    public int NbRoadmaps { get; set; }
    public int NbCompetences { get; set; }

    // Scores
    public double ScoreCvMoyen { get; set; }
    public double ScoreTestsMoyen { get; set; }
    public double TauxReussiteTests { get; set; }

    // Analyse
    public List<string> TopCompetencesCv { get; set; } = [];
    public List<string> CompetencesFaibles { get; set; } = [];

    //  Insight IA simple (optionnel plus tard)
    public string Recommendation { get; set; } = "";
}