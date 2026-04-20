namespace API.dtos.Profil;

public class SectionResponseDto
{
    public Guid Id { get; set; }
    public string Titre { get; set; } = string.Empty;
    public int Ordre { get; set; }
    public List<LigneResponseDto> Lignes { get; set; } = [];
}

public class CreateSectionDto
{
    public string Titre { get; set; } = string.Empty;
    public int Ordre { get; set; }
}

public class UpdateSectionDto
{
    public string Titre { get; set; } = string.Empty;
    public int Ordre { get; set; }
}

public class LigneResponseDto
{
    public Guid Id { get; set; }
    public string? Detail { get; set; }
    public string? Description { get; set; }
    public int Ordre { get; set; }
}

public class CreateLigneDto
{
    public string? Detail { get; set; }
    public string? Description { get; set; }
    public int Ordre { get; set; }
}

public class UpdateLigneDto
{
    public string? Detail { get; set; }
    public string? Description { get; set; }
    public int Ordre { get; set; }
}