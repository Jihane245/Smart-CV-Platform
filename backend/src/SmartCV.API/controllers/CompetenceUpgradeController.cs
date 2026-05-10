using API.data;
using API.dtos.Competence;
using API.models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace API.controllers;

[ApiController]
[Route("api/competences")]
[Authorize]
public class CompetenceUpgradeController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    public CompetenceUpgradeController(
        ApplicationDbContext db,
        IHttpClientFactory httpClientFactory,
        IConfiguration config)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    private async Task<User?> GetCurrentUser()
    {
        var email = User.FindFirstValue("email");
        if (string.IsNullOrEmpty(email)) return null;
        return await _db.Users
            .Include(u => u.Profil)
                .ThenInclude(p => p!.Competences)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    private async Task<T?> CallIA<T>(string endpoint, object payload)
    {
        var iaUrl   = _config["IA_SERVICE_URL"] ?? "http://ia:8000";
        var client  = _httpClientFactory.CreateClient();
        var json    = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync($"{iaUrl}{endpoint}", content);
        var body     = await response.Content.ReadAsStringAsync();

        return JsonSerializer.Deserialize<T>(body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    // Helper : lit une propriété JsonElement sans crasher si absent
    private static JsonElement GetProp(JsonElement el, string name)
        => el.TryGetProperty(name, out var val) ? val : default;

    // ─── 1. Détecter les écarts ─────────────────────────────────────────────

    [HttpPost("gaps")]
    public async Task<IActionResult> GetGaps([FromBody] GapRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var mesCompetences = user.Profil?.Competences
            .Select(c => c.Nom).ToList() ?? [];

        var analyse = await CallIA<JsonElement>("/analyze/text", new
        {
            texte              = request.TexteOffre,
            profil_competences = mesCompetences
        });

        var manquantes = GetProp(analyse, "competences_manquantes")
            .ValueKind == JsonValueKind.Array
                ? GetProp(analyse, "competences_manquantes")
                    .EnumerateArray().Select(x => x.GetString() ?? "").ToList()
                : [];

        var presentes = GetProp(analyse, "competences_match")
            .ValueKind == JsonValueKind.Array
                ? GetProp(analyse, "competences_match")
                    .EnumerateArray().Select(x => x.GetString() ?? "").ToList()
                : [];

        var scoreProp = GetProp(analyse, "score_compatibilite");
        var score = scoreProp.ValueKind == JsonValueKind.Number
            ? scoreProp.GetInt32() : 0;

        return Ok(new GapResponse
        {
            CompetencesManquantes = manquantes,
            CompetencesPresentes  = presentes,
            ScoreCompatibilite    = score
        });
    }

    // ─── 2. Générer un test de niveau ───────────────────────────────────────

    [HttpPost("test/generate")]
    public async Task<IActionResult> GenerateTest([FromBody] GenerateTestRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var iaResult = await CallIA<JsonElement>("/competence/test/generate", new
        {
            competence = request.NomCompetence
        });

        var questionsProp = GetProp(iaResult, "questions");
        var questions     = questionsProp.ValueKind != JsonValueKind.Undefined
            ? questionsProp.ToString() : "[]";

        var test = new TestCompetence
        {
            UserId        = user.Id,
            NomCompetence = request.NomCompetence,
            QuestionsJson = questions,
            Statut        = StatutParcours.EnCours
        };

        _db.TestsCompetences.Add(test);
        await _db.SaveChangesAsync();

        var questionsObj = JsonSerializer.Deserialize<List<JsonElement>>(questions,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        var questionsSansReponses = questionsObj?.Select(q => new QuestionDto
        {
            Numero  = GetProp(q, "Numero").ValueKind == JsonValueKind.Number
                        ? GetProp(q, "Numero").GetInt32() : 0,
            Enonce  = GetProp(q, "enonce").ValueKind == JsonValueKind.String
                        ? GetProp(q, "enonce").GetString() ?? "" : "",
            Options = GetProp(q, "options").ValueKind == JsonValueKind.Array
                        ? GetProp(q, "options").EnumerateArray()
                            .Select(o => o.GetString() ?? "").ToList()
                        : []
        }).ToList() ?? [];

        return Ok(new TestGeneratedDto
        {
            TestId        = test.Id,
            NomCompetence = test.NomCompetence,
            Questions     = questionsSansReponses
        });
    }

    // ─── 3. Évaluer les réponses ────────────────────────────────────────────

    [HttpPost("test/evaluate")]
    public async Task<IActionResult> EvaluateTest([FromBody] EvaluateTestRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var test = await _db.TestsCompetences
            .FirstOrDefaultAsync(t => t.Id == request.TestId && t.UserId == user.Id);
        if (test == null) return NotFound("Test introuvable.");

        var questions = JsonSerializer.Deserialize<List<JsonElement>>(test.QuestionsJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        var evaluation = await CallIA<JsonElement>("/competence/test/evaluate", new
        {
            questions = questions,
            reponses  = request.Reponses
        });

        var scoreProp  = GetProp(evaluation, "score");
        var niveauProp = GetProp(evaluation, "niveau");
        var roadmapProp = GetProp(evaluation, "roadmap_necessaire");

        var score             = scoreProp.ValueKind  == JsonValueKind.Number  ? scoreProp.GetInt32()     : 0;
        var niveau            = niveauProp.ValueKind == JsonValueKind.String  ? niveauProp.GetString()   ?? "Debutant" : "Debutant";
        var roadmapNecessaire = roadmapProp.ValueKind == JsonValueKind.True || roadmapProp.ValueKind == JsonValueKind.False
            ? roadmapProp.GetBoolean() : true;

        test.Score         = score;
        test.NiveauDetecte = Enum.Parse<NiveauTest>(niveau);
        test.ReponsesJson  = JsonSerializer.Serialize(request.Reponses);
        test.Statut        = StatutParcours.EnCours;
        test.CompletedAt   = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var message = score >= 80
            ? $"Excellent ! Tu maîtrises {test.NomCompetence} niveau {niveau}."
            : $"Tu es niveau {niveau}. Suis la roadmap pour progresser !";

        return Ok(new EvaluationResultDto
        {
            TestId            = test.Id,
            Score             = score,
            Niveau            = niveau,
            Message           = message,
            RoadmapNecessaire = roadmapNecessaire
        });
    }

    // ─── 4. Générer la roadmap ──────────────────────────────────────────────

    [HttpPost("roadmap")]
    public async Task<IActionResult> GenerateRoadmap([FromBody] RoadmapRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var test = await _db.TestsCompetences
            .FirstOrDefaultAsync(t => t.Id == request.TestId && t.UserId == user.Id);
        if (test == null) return NotFound("Test introuvable.");

        var iaResult = await CallIA<JsonElement>("/competence/roadmap", new
        {
            competence = test.NomCompetence,
            niveau     = test.NiveauDetecte?.ToString() ?? "Debutant"
        });

        var etapesProp   = GetProp(iaResult, "etapes");
        var objectifProp = GetProp(iaResult, "objectif_final");

        var etapesJson = etapesProp.ValueKind  != JsonValueKind.Undefined ? etapesProp.ToString()  : "[]";
        var objectif   = objectifProp.ValueKind == JsonValueKind.String   ? objectifProp.GetString() ?? "" : "";

        var roadmap = new Roadmap
        {
            UserId        = user.Id,
            TestId        = test.Id,
            NomCompetence = test.NomCompetence,
            NiveauDepart  = test.NiveauDetecte ?? NiveauTest.Debutant,
            EtapesJson    = etapesJson
        };

        _db.Roadmaps.Add(roadmap);
        await _db.SaveChangesAsync();

        var etapes = JsonSerializer.Deserialize<List<EtapeRoadmapDto>>(etapesJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];

        return Ok(new RoadmapDto
        {
            RoadmapId     = roadmap.Id,
            NomCompetence = roadmap.NomCompetence,
            NiveauDepart  = roadmap.NiveauDepart.ToString(),
            ObjectifFinal = objectif,
            Etapes        = etapes
        });
    }

    // ─── 5. Test final + mise à jour profil ─────────────────────────────────

    [HttpPost("validate")]
    public async Task<IActionResult> ValidateFinal([FromBody] ValidateRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var roadmap = await _db.Roadmaps
            .Include(r => r.Test)
            .FirstOrDefaultAsync(r => r.Id == request.RoadmapId && r.UserId == user.Id);
        if (roadmap == null) return NotFound("Roadmap introuvable.");

        var questions = JsonSerializer.Deserialize<List<JsonElement>>(
            roadmap.Test!.QuestionsJson,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        var evaluation = await CallIA<JsonElement>("/competence/test/evaluate", new
        {
            questions = questions,
            reponses  = request.Reponses
        });

        var scoreProp  = GetProp(evaluation, "score");
        var niveauProp = GetProp(evaluation, "niveau");

        var score  = scoreProp.ValueKind  == JsonValueKind.Number ? scoreProp.GetInt32()    : 0;
        var niveau = niveauProp.ValueKind == JsonValueKind.String ? niveauProp.GetString()  ?? "Debutant" : "Debutant";

        bool competenceAjoutee = false;

        if (score >= 60 && user.Profil != null)
        {
            var existeDeja = await _db.Competences
                .AnyAsync(c => c.ProfilId == user.Profil.Id &&
                               c.Nom.ToLower() == roadmap.NomCompetence.ToLower());

            if (!existeDeja)
            {
                var niveauEnum = niveau switch
                {
                    "Expert" => NiveauEnum.Expert,
                    "Moyen"  => NiveauEnum.Avance,
                    _        => NiveauEnum.Intermediaire
                };

                _db.Competences.Add(new Competence
                {
                    ProfilId  = user.Profil.Id,
                    Nom       = roadmap.NomCompetence,
                    Niveau    = niveauEnum,
                    Categorie = "Auto-ajoutée"
                });

                roadmap.Completee        = true;
                roadmap.Test!.Statut     = StatutParcours.Valide;
                competenceAjoutee        = true;

                await _db.SaveChangesAsync();
            }
        }
        else
        {
            roadmap.Test!.Statut = StatutParcours.Echoue;
            await _db.SaveChangesAsync();
        }

        return Ok(new ValidateResultDto
        {
            Score             = score,
            Niveau            = niveau,
            CompetenceAjoutee = competenceAjoutee,
            Message           = competenceAjoutee
                ? $"🎉 Bravo ! {roadmap.NomCompetence} ajoutée à ton profil !"
                : score >= 60
                    ? "Compétence déjà présente dans ton profil."
                    : $"Score insuffisant ({score}/100). Continue la roadmap !"
        });
    }

    // ─── 6. Mes roadmaps ────────────────────────────────────────────────────

    [HttpGet("roadmaps")]
    public async Task<IActionResult> GetMyRoadmaps()
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var roadmaps = await _db.Roadmaps
            .Include(r => r.Test)
            .Where(r => r.UserId == user.Id)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var result = roadmaps.Select(r => new
        {
            r.Id,
            r.NomCompetence,
            NiveauDepart = r.NiveauDepart.ToString(),
            r.Completee,
            r.CreatedAt,
            TestScore  = r.Test?.Score,
            TestStatut = r.Test?.Statut.ToString()
        });

        return Ok(result);
    }
/// <summary>Repasser le test après avoir suivi la roadmap</summary>
[HttpPost("roadmaps/{roadmapId}/retest")]
public async Task<IActionResult> RetestAfterRoadmap(
    int roadmapId,
    [FromBody] List<ReponseDto> reponses)
{
    var user = await GetCurrentUser();
    if (user == null) return Unauthorized();

    // Récupérer la roadmap
    var roadmap = await _db.Roadmaps
        .Include(r => r.Test)
        .FirstOrDefaultAsync(r => r.Id == roadmapId && r.UserId == user.Id);

    if (roadmap == null) return NotFound("Roadmap introuvable.");
    if (roadmap.Completee) return BadRequest("Cette compétence est déjà validée dans ton profil.");

    // Récupérer les questions du test original
    var questions = JsonSerializer.Deserialize<List<JsonElement>>(
        roadmap.Test!.QuestionsJson,
        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

    // Évaluer les réponses
    var evaluation = await CallIA<JsonElement>("/competence/test/evaluate", new
    {
        questions = questions,
        reponses  = reponses
    });

    var scoreProp  = GetProp(evaluation, "score");
    var niveauProp = GetProp(evaluation, "niveau");

    var score  = scoreProp.ValueKind  == JsonValueKind.Number ? scoreProp.GetInt32()   : 0;
    var niveau = niveauProp.ValueKind == JsonValueKind.String ? niveauProp.GetString() ?? "Debutant" : "Debutant";

    bool competenceAjoutee = false;
    string message;

    if (score >= 80 && user.Profil != null)
    {
        var existeDeja = await _db.Competences
            .AnyAsync(c => c.ProfilId == user.Profil.Id &&
                           c.Nom.ToLower() == roadmap.NomCompetence.ToLower());

        if (!existeDeja)
        {
            var niveauEnum = niveau switch
            {
                "Expert" => NiveauEnum.Expert,
                "Moyen"  => NiveauEnum.Avance,
                _        => NiveauEnum.Intermediaire
            };

            _db.Competences.Add(new Competence
            {
                ProfilId  = user.Profil.Id,
                Nom       = roadmap.NomCompetence,
                Niveau    = niveauEnum,
                Categorie = "Auto-ajoutée"
            });

            roadmap.Completee    = true;
            roadmap.Test!.Statut = StatutParcours.Valide;
            competenceAjoutee    = true;
            message = $"Bravo ! {roadmap.NomCompetence} ajoutée à ton profil avec le niveau {niveau} !";
        }
        else
        {
            message = $"Score suffisant ({score}/100) mais la compétence existe déjà dans ton profil.";
        }
    }
    else
    {
        roadmap.Test!.Statut = StatutParcours.Echoue;
        message = score >= 60
            ? $"Tu progresses bien ({score}/100) — encore un petit effort pour atteindre 80%."
            : score >= 40
                ? $"Niveau intermédiaire ({score}/100). Révise la roadmap avant de retenter."
                : $"Tu es encore débutant(e) ({score}/100). Reprends la roadmap depuis le début.";
    }

    await _db.SaveChangesAsync();

    return Ok(new
    {
        Score             = score,
        Niveau            = niveau,
        CompetenceAjoutee = competenceAjoutee,
        Message           = message,
        PeutReessayer     = !competenceAjoutee && score < 80
    });
}
/// <summary>Marquer la roadmap comme suivie (prêt pour le retest)</summary>
[HttpPut("roadmaps/{roadmapId}/suivie")]
public async Task<IActionResult> MarquerRoadmapSuivie(int roadmapId)
{
    var user = await GetCurrentUser();
    if (user == null) return Unauthorized();

    var roadmap = await _db.Roadmaps
        .FirstOrDefaultAsync(r => r.Id == roadmapId && r.UserId == user.Id);
    if (roadmap == null) return NotFound();

    // Ajoute ce champ dans le model Roadmap
    roadmap.RoadmapSuivie = true;
    await _db.SaveChangesAsync();

    return Ok(new { message = "Roadmap marquée comme suivie. Tu peux passer le test de validation !" });
}
}
