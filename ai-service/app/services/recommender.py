from typing import List, Dict, Any

def generate_recommendations(
    score: int,
    competences_manquantes: list[str],
    hard_skills: list[str],
    outils: list[str],
    niveau: str,
    resume: str = ""
) -> dict:
    return {
        "priorite":                  _priorite(score),
        "message_global":            _message(score, niveau),
        "competences_a_apprendre":   _competences(competences_manquantes, hard_skills),
        "technologies_prioritaires": _technologies(competences_manquantes, outils),
        "ameliorations_cv":          _ameliorations(score, competences_manquantes, niveau),
        "suggestions_projets":       _projets(competences_manquantes, hard_skills, niveau),
    }


def _priorite(score: int) -> str:
    if score >= 75: return "faible"
    if score >= 50: return "moyenne"
    return "haute"


def _message(score: int, niveau: str) -> str:
    if score >= 85:
        return f"Excellent profil pour ce poste {niveau}. Quelques ajustements mineurs suffiront."
    if score >= 70:
        return f"Bon profil pour ce poste {niveau}. Quelques améliorations ciblées vous rendront très compétitif."
    if score >= 50:
        return f"Profil correct mais avec des lacunes pour ce poste {niveau}. Concentrez-vous sur les compétences prioritaires."
    return f"Ce poste {niveau} requiert des compétences à développer. Suivez le plan de formation suggéré."


def _competences(manquantes: list[str], hard_skills: list[str]) -> list[str]:
    if not manquantes:
        return ["Continuer à approfondir vos compétences actuelles"]
    # Mettre en premier les manquantes qui sont dans hard_skills (plus critiques)
    critiques   = [c for c in manquantes if any(h.lower() in c.lower() or c.lower() in h.lower() for h in hard_skills)]
    secondaires = [c for c in manquantes if c not in critiques]
    return (critiques + secondaires)[:5]


def _technologies(manquantes: list[str], outils: list[str]) -> list[str]:
    if not outils:
        return []
    manquants = [o for o in outils if any(o.lower() in c.lower() or c.lower() in o.lower() for c in manquantes)]
    return (manquants or outils)[:3]


def _ameliorations(score: int, manquantes: list[str], niveau: str) -> list[str]:
    result = []
    if score < 50:
        result.append("Mettez en avant vos projets personnels liés aux compétences requises")
        result.append("Ajoutez une section 'Compétences en cours d'apprentissage'")
    if score < 75:
        result.append("Quantifiez vos réalisations (ex: 'Réduction de 30% du temps de traitement')")
        result.append("Adaptez votre résumé professionnel aux mots-clés de l'offre")
    if manquantes:
        result.append(f"Mentionnez toute expérience partielle avec : {', '.join(manquantes[:2])}")
    niveaux = {
        "senior":   "Mettez en avant votre expérience de leadership et mentorat",
        "confirmé": "Insistez sur vos projets complexes et votre autonomie",
        "junior":   "Mettez en avant votre capacité d'apprentissage rapide",
    }
    result.append(niveaux.get(niveau.lower(), "Mettez en avant votre motivation et adaptabilité"))
    return result[:4]


def _projets(manquantes: list[str], hard_skills: list[str], niveau: str) -> list[str]:
    if not manquantes:
        return ["Contribuez à des projets open source dans votre domaine"]

    MAP = {
        "docker":           "Containerisez l'un de vos projets existants avec Docker",
        "kubernetes":       "Déployez une app multi-services avec Kubernetes (minikube en local)",
        "react":            "Créez une SPA avec React et une API REST",
        "angular":          "Développez un dashboard avec Angular",
        "python":           "Développez un script d'automatisation ou d'analyse de données",
        "machine learning": "Créez un modèle de classification sur Kaggle",
        "sql":              "Concevez une base de données avec requêtes complexes",
        "aws":              "Déployez une application sur AWS Free Tier",
        "git":              "Contribuez à un projet open source sur GitHub",
        "api":              "Développez une API RESTful avec documentation Swagger",
        "java":             "Créez une application Spring Boot avec authentification",
        "spring":           "Implémentez une architecture microservices avec Spring Boot",
        "typescript":       "Migrez un projet JavaScript vers TypeScript",
    }

    result = []
    for comp in manquantes[:3]:
        for key, suggestion in MAP.items():
            if key in comp.lower():
                result.append(suggestion)
                break
        else:
            result.append(f"Développez un mini-projet démontrant votre maîtrise de {comp}")

    return result[:3]
