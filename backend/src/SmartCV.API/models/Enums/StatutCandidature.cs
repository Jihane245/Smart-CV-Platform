namespace API.models.Enums;

/// <summary>
/// Identifiants ASCII stockés en base (évite les problèmes d'encodage UTF-8 avec les accents).
/// </summary>
public enum StatutCandidature
{
    enregistree,
    envoyee,
    recue,
    en_cours_d_examen,
    entretien,
    acceptee,
    refusee,
    archivee
}
