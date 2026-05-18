import re
import json
import os
import base64
from groq import Groq
from app.prompts.analyze_prompt import SYSTEM_PROMPT

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# ─── Depuis texte ───────────────────────────────────────────────────────────────

def analyze_offre(texte: str, profil_competences: list[str] = []) -> dict:
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyse cette offre d'emploi :\n\n{texte}"}
        ],
        max_tokens=1000,
    )
    raw = response.choices[0].message.content.strip()
    return _build_result(raw, profil_competences)

# ─── Depuis image ───────────────────────────────────────────────────────────────

def analyze_offre_image(image_bytes: bytes, content_type: str, profil_competences: list[str] = []) -> dict:
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{content_type};base64,{image_b64}"
                        }
                    },
                    {
                        "type": "text",
                        "text": SYSTEM_PROMPT + "\n\nAnalyse l'offre d'emploi dans cette image et retourne le JSON demandé."
                    }
                ]
            }
        ],
        max_tokens=1000,
    )
    raw = response.choices[0].message.content.strip()
    return _build_result(raw, profil_competences)

# ─── Helper commun ──────────────────────────────────────────────────────────────

def _build_result(raw: str, profil_competences: list[str]) -> dict:
    raw = re.sub(r"```json|```", "", raw).strip()

    try:
        analyse = json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError(f"Réponse invalide : {raw}")

    score = _calculer_score(
        hard_skills=analyse.get("hard_skills", []),
        outils=analyse.get("outils", []),
        profil_competences=profil_competences
    )

    return {
        "hard_skills": analyse.get("hard_skills", []),
        "outils": analyse.get("outils", []),
        "annees_experience": analyse.get("annees_experience", 0),
        "niveau": analyse.get("niveau", "Junior"),
        "resume": analyse.get("resume", ""),
        "score_compatibilite": score["pourcentage"],
        "competences_match": score["match"],
        "competences_manquantes": score["manquantes"]
    }

def _calculer_score(hard_skills, outils, profil_competences) -> dict:
    if not profil_competences:
        return {"pourcentage": 0, "match": [], "manquantes": hard_skills + outils}

    def normaliser(s: str) -> str:
        return (s.lower().strip()
                 .replace(".js", "")
                 .replace("js", "")
                 .replace("html5", "html")
                 .replace("css3", "css")
                 .replace("es6+", "")
                 .replace("es6", "")
                 .replace("-", "")
                 .replace(".", "")
                 .replace(" ", ""))

    profil_normalise = [normaliser(c) for c in profil_competences]
    requises = hard_skills + outils
    match = []
    manquantes = []

    for req in requises:
        req_norm = normaliser(req)
        trouve = any(
            req_norm == p or req_norm in p or p in req_norm
            for p in profil_normalise
            if len(p) > 1  # éviter faux positifs sur 1 char
        )
        if trouve:
            match.append(req)
        else:
            manquantes.append(req)

    total = len(requises)
    pourcentage = round((len(match) / total) * 100) if total > 0 else 0
    return {"pourcentage": pourcentage, "match": match, "manquantes": manquantes}
