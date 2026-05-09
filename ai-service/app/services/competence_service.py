import re
import json
import os
from groq import Groq
from app.prompts.competence_prompt import TEST_PROMPT, ROADMAP_PROMPT

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def _clean_json(raw: str) -> str:
    """Nettoie la réponse du modèle pour extraire le JSON."""
    raw = re.sub(r"```json|```", "", raw).strip()
    # Cherche le premier { ou [ et le dernier } ou ]
    start = min(
        (raw.find('{') if raw.find('{') != -1 else len(raw)),
        (raw.find('[') if raw.find('[') != -1 else len(raw))
    )
    end = max(raw.rfind('}'), raw.rfind(']')) + 1
    if start < end:
        return raw[start:end]
    return raw

def generer_test(competence: str) -> dict:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",  # ← modèle plus puissant pour JSON strict
        messages=[
            {
                "role": "system",
                "content": "Tu es un expert technique. Tu retournes UNIQUEMENT du JSON valide, sans texte avant ou après."
            },
            {
                "role": "user",
                "content": TEST_PROMPT.format(competence=competence)
            }
        ],
        max_tokens=4000,
        temperature=0.3,
    )
    raw = response.choices[0].message.content.strip()
    cleaned = _clean_json(raw)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON invalide du test : {e}\nRaw: {raw[:200]}")

def evaluer_reponses(questions: list, reponses: list) -> dict:
    score = 0
    total = len(questions)

    for question in questions:
        # Support dict et JsonElement
        if isinstance(question, dict):
            num_q = question.get("numero")
            bonne = question.get("bonne_reponse", "")
        else:
            num_q = question.get("numero", 0)
            bonne = question.get("bonne_reponse", "")

        reponse_user = next(
            (r.get("reponseChoisie") if isinstance(r, dict) else None
             for r in reponses
             if (r.get("numero") if isinstance(r, dict) else None) == num_q),
            None
        )
        if reponse_user and reponse_user.strip() == bonne.strip():
            score += 1

    pourcentage = round((score / total) * 100) if total > 0 else 0

    if pourcentage >= 80:
        niveau = "Expert"
    elif pourcentage >= 50:
        niveau = "Moyen"
    else:
        niveau = "Debutant"

    return {
        "score": pourcentage,
        "niveau": niveau,
        "roadmap_necessaire": pourcentage < 80,
        "details": {
            "bonnes_reponses": score,
            "total_questions": total
        }
    }

def generer_roadmap(competence: str, niveau: str) -> dict:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "Tu es un expert en formation. Tu retournes UNIQUEMENT du JSON valide, sans texte avant ou après."
            },
            {
                "role": "user",
                "content": ROADMAP_PROMPT.format(competence=competence, niveau=niveau)
            }
        ],
        max_tokens=4000,
        temperature=0.3,
    )
    raw = response.choices[0].message.content.strip()
    cleaned = _clean_json(raw)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON invalide de la roadmap : {e}\nRaw: {raw[:200]}")
