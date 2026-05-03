TEST_PROMPT = """Tu es un expert technique en {competence}.
Génère exactement 12 questions QCM pour évaluer le niveau d'un développeur.
Retourne UNIQUEMENT ce JSON valide, sans aucun texte avant ou après :
{{
  "questions": [
    {{
      "numero": 1,
      "enonce": "Question ici ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "bonne_reponse": "Option A",
      "explication": "Explication courte"
    }}
  ]
}}
Règles STRICTES :
- Exactement 12 questions au total
- 4 questions niveau Débutant (numéros 1-4)
- 4 questions niveau Intermédiaire (numéros 5-8)
- 4 questions niveau Expert (numéros 9-12)
- Chaque question a exactement 4 options
- Une seule bonne réponse par question
- La bonne_reponse doit être exactement identique à l'une des options
- Retourne uniquement le JSON, rien d'autre"""

ROADMAP_PROMPT = """Tu es un expert en formation technique.
Génère une roadmap détaillée pour apprendre {competence} depuis le niveau {niveau}.
Retourne UNIQUEMENT ce JSON valide, sans aucun texte avant ou après :
{{
  "objectif_final": "Description claire de l'objectif à atteindre",
  "duree_estimee": "4 semaines",
  "etapes": [
    {{
      "ordre": 1,
      "type": "video",
      "titre": "Titre de la vidéo",
      "description": "Ce que tu vas apprendre dans cette étape",
      "url": "https://youtube.com/watch?v=...",
      "duree": "30 min"
    }},
    {{
      "ordre": 2,
      "type": "doc",
      "titre": "Documentation officielle",
      "description": "Concepts clés à lire",
      "url": "https://docs.example.com",
      "duree": "1h"
    }},
    {{
      "ordre": 3,
      "type": "exercice",
      "titre": "Exercices pratiques",
      "description": "Exercices guidés",
      "url": "https://exercices.example.com",
      "duree": "2h"
    }},
    {{
      "ordre": 4,
      "type": "projet",
      "titre": "Mini projet pratique",
      "description": "Description détaillée du projet à réaliser",
      "url": null,
      "duree": "3h"
    }}
  ]
}}
Règles STRICTES :
- Minimum 5 étapes, maximum 8
- Toujours inclure au moins : 1 video + 1 doc + 1 projet
- URLs réelles YouTube et documentation officielle
- Adapté strictement au niveau {niveau}
- Retourne uniquement le JSON, rien d'autre"""