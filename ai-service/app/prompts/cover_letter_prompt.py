COVER_LETTER_SYSTEM_PROMPT = """Tu es un expert en recrutement et en rédaction de lettres de motivation.
Tu dois rédiger une lettre de motivation professionnelle, personnalisée et convaincante.

RÈGLES IMPORTANTES :
- Écris en français
- Utilise un ton professionnel mais engageant
- Structure : Introduction, Corps (2-3 paragraphes), Conclusion
- Mentionne le poste et l'entreprise dans l'introduction
- Mets en avant les compétences et expériences pertinentes
- Adapte le contenu aux exigences de l'offre
- Termine par une formule de politesse appropriée
- Longueur : 300-500 mots maximum

CONTENU À INCLURE :
- Motivation pour le poste et l'entreprise
- Compétences clés du candidat qui correspondent à l'offre
- Expériences professionnelles pertinentes
- Formation et certifications si pertinentes
- Références aux mots-clés de l'offre

RÉPONDS UNIQUEMENT avec le texte de la lettre de motivation, sans introduction ni conclusion.
"""

def build_cover_letter_prompt(user_data: dict, offre_data: dict, analyse_data: dict, cv_data: dict | None = None) -> str:
    user = user_data
    offre = offre_data
    analyse = analyse_data

    prompt = f"""
INFORMATIONS DU CANDIDAT :
Nom : {user.get('nom', '')} {user.get('prenom', '')}
Email : {user.get('email', '')}

PROFIL :
{user.get('profil', {}).get('description', 'Non spécifié')}

COMPÉTENCES :
{', '.join(user.get('profil', {}).get('competences', []))}

EXPÉRIENCES :
"""
    experiences = user.get('profil', {}).get('experiences', [])
    for exp in experiences[:3]:  # Limiter à 3 expériences
        prompt += f"- {exp.get('poste', '')} chez {exp.get('entreprise', '')} ({exp.get('date_debut', '')} - {exp.get('date_fin', 'Présent')})\n"
        prompt += f"  {exp.get('description', '')}\n"

    prompt += f"""

FORMATIONS :
"""
    formations = user.get('profil', {}).get('formations', [])
    for form in formations[:2]:  # Limiter à 2 formations
        prompt += f"- {form.get('diplome', '')} - {form.get('etablissement', '')} ({form.get('annee', '')})\n"

    prompt += f"""

OFFRE D'EMPLOI :
Titre : {offre.get('titre', '')}
Entreprise : {offre.get('entreprise', '')}
Description : {offre.get('description', '')}
Exigences : {offre.get('exigences', '')}
Type de contrat : {offre.get('type_contrat', '')}

ANALYSE DE L'OFFRE :
Score de compatibilité : {analyse.get('score_compatibilite', 0)}%
Compétences requises : {', '.join(analyse.get('competences_requises', []))}
Compétences match : {', '.join(analyse.get('competences_match', []))}
Compétences manquantes : {', '.join(analyse.get('competences_manquantes', []))}
Mots-clés extraits : {', '.join(analyse.get('mots_cles_extraits', []))}
Résumé : {analyse.get('resume', '')}
"""

    if cv_data:
        cv_keywords = cv_data.get('keyWords') or ''
        cv_skills = cv_data.get('skillsDetectes') or ''
        cv_score = cv_data.get('scoreCompatibilite')
        cv_exigences = cv_data.get('exigences') or ''
        prompt += f"""
CV ANALYSÉ DU CANDIDAT (à privilégier comme source de vérité) :
Mots-clés extraits du CV : {cv_keywords}
Compétences détectées dans le CV : {cv_skills}
Score de compatibilité CV/offre : {cv_score if cv_score is not None else 'n/a'}
Exigences couvertes par le CV : {cv_exigences}
"""

    prompt += """
Rédige une lettre de motivation convaincante qui met en avant les points forts du candidat pour ce poste spécifique.
"""

    return prompt