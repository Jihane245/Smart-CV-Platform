namespace API.models.Enums;

public static class StatutCandidatureConverter
{
    private static readonly Dictionary<string, StatutCandidature> Aliases =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["enregistree"] = StatutCandidature.enregistree,
            ["enregistrée"] = StatutCandidature.enregistree,
            ["envoyee"] = StatutCandidature.envoyee,
            ["envoyée"] = StatutCandidature.envoyee,
            ["recue"] = StatutCandidature.recue,
            ["reçue"] = StatutCandidature.recue,
            ["en_cours_d_examen"] = StatutCandidature.en_cours_d_examen,
            ["entretien"] = StatutCandidature.entretien,
            ["acceptee"] = StatutCandidature.acceptee,
            ["acceptée"] = StatutCandidature.acceptee,
            ["refusee"] = StatutCandidature.refusee,
            ["refusée"] = StatutCandidature.refusee,
            ["archivee"] = StatutCandidature.archivee,
            ["archivée"] = StatutCandidature.archivee,
        };

    public static string ToDb(StatutCandidature statut) => statut.ToString();

    public static StatutCandidature FromDb(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return StatutCandidature.enregistree;

        var normalized = value.Trim();
        if (Aliases.TryGetValue(normalized, out var exact))
            return exact;

        // Valeurs corrompues (ex. « enregistre » si UTF-8 mal interprété)
        var lower = normalized.ToLowerInvariant();
        if (lower.StartsWith("enregistr")) return StatutCandidature.enregistree;
        if (lower.StartsWith("envoy")) return StatutCandidature.envoyee;
        if (lower.StartsWith("re") && lower.Contains("ue")) return StatutCandidature.recue;
        if (lower.StartsWith("accept")) return StatutCandidature.acceptee;
        if (lower.StartsWith("refus")) return StatutCandidature.refusee;
        if (lower.StartsWith("archiv")) return StatutCandidature.archivee;
        if (lower.StartsWith("en_cours")) return StatutCandidature.en_cours_d_examen;

        return Enum.Parse<StatutCandidature>(normalized, ignoreCase: true);
    }

    public static StatutCandidature ParseInput(string value) => FromDb(value);
}
