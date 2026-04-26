
import json
import re
import os
from groq import Groq
from app.prompts.recommender_prompt import RECOMMENDER_SYSTEM_PROMPT, build_recommender_prompt

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

async def generate_ai_recommendations(
    score: int,
    competences_manquantes: list,
    profil_competences: list,
    niveau: str,
    resume: str
) -> dict:
    if not competences_manquantes:
        return {
            "priorite": "faible",
            "message_global": "Félicitations ! Votre profil correspond parfaitement aux exigences.",
            "competences_a_apprendre": [],
            "technologies_prioritaires": [],
            "ameliorations_cv": [
                "Ajoutez des réalisations chiffrées à vos expériences",
                "Personnalisez votre résumé pour ce poste"
            ],
            "suggestions_projets": []
        }
    
    prompt = build_recommender_prompt(score, competences_manquantes, profil_competences, niveau, resume)
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": RECOMMENDER_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.7
        )
        
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"```json|```", "", raw).strip()
        recommendations = json.loads(raw)
        
        return recommendations
        
    except Exception as e:
        # Fallback
        return {
            "priorite": "moyenne" if len(competences_manquantes) <= 3 else "haute",
            "message_global": f"Concentrez-vous sur ces compétences : {', '.join(competences_manquantes[:3])}",
            "competences_a_apprendre": competences_manquantes[:5],
            "technologies_prioritaires": competences_manquantes[:3],
            "ameliorations_cv": ["Quantifiez vos réalisations", "Ajoutez les mots-clés de l'offre"],
            "suggestions_projets": [f"Créez un projet utilisant {comp}" for comp in competences_manquantes[:2]]
        }