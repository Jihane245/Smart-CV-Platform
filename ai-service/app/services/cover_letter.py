import json
import re
import os
from datetime import datetime
from groq import Groq
from app.prompts.cover_letter_prompt import COVER_LETTER_SYSTEM_PROMPT, build_cover_letter_prompt

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

async def generate_cover_letter(user_data: dict, offre_data: dict, analyse_data: dict, cv_data: dict | None = None) -> str:
    """
    Génère une lettre de motivation personnalisée en utilisant l'IA
    """
    prompt = build_cover_letter_prompt(user_data, offre_data, analyse_data, cv_data)

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": COVER_LETTER_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,  # Pour une lettre de motivation complète
            temperature=0.7
        )

        content = response.choices[0].message.content.strip()

        # Nettoyer le contenu si nécessaire
        content = re.sub(r'^["\']|["\']$', '', content)  # Supprimer les guillemets autour
        content = content.strip()

        return content

    except Exception as e:
        # Fallback en cas d'erreur
        print(f"Erreur lors de la génération de la lettre: {e}")
        return _generate_fallback_letter(user_data, offre_data)

async def generate_cover_letter_from_text(cv_text: str, offre_text: str,
                                          offre_titre: str | None, offre_entreprise: str | None) -> str:
    """
    Génère une lettre de motivation à partir du texte brut d'un CV (extrait d'un PDF)
    et du texte de l'offre, sans profil structuré ni analyse.
    """
    prompt = f"""
Voici le CV du candidat (texte brut extrait d'un PDF) :
---
{cv_text[:6000]}
---

Voici l'offre d'emploi :
Titre : {offre_titre or 'Non précisé'}
Entreprise : {offre_entreprise or 'Non précisée'}
Description :
{offre_text[:4000]}
---

Rédige une lettre de motivation en français, professionnelle, structurée (Objet, formule d'appel, 3 paragraphes, formule de politesse, signature).
Mets en avant les compétences pertinentes du CV par rapport à l'offre.
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": COVER_LETTER_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.7
        )
        content = response.choices[0].message.content.strip()
        content = re.sub(r'^["\']|["\']$', '', content).strip()
        return content
    except Exception as e:
        print(f"Erreur génération raw: {e}")
        return ""


def _generate_fallback_letter(user_data: dict, offre_data: dict) -> str:
    """
    Génère une lettre basique en cas d'erreur de l'IA
    """
    user = user_data
    offre = offre_data

    nom = f"{user.get('prenom', '')} {user.get('nom', '')}".strip()
    poste = offre.get('titre', '')
    entreprise = offre.get('entreprise', '')

    lettre = f"""Objet : Candidature pour le poste de {poste}

Madame, Monsieur,

Je me permets de vous présenter ma candidature pour le poste de {poste} au sein de votre entreprise {entreprise}.

Fort de mon expérience professionnelle et de mes compétences, je suis convaincu que je peux apporter une contribution significative à votre équipe.

Je reste à votre disposition pour tout renseignement complémentaire et vous remercie par avance de l'attention que vous porterez à ma candidature.

Cordialement,

{nom}
"""

    return lettre