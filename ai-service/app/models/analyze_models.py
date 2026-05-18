from pydantic import BaseModel
from typing import Optional, List

class RecommendationResponse(BaseModel):
    priorite: str
    message_global: str
    competences_a_apprendre: List[str]
    technologies_prioritaires: List[str]
    ameliorations_cv: List[str]
    suggestions_projets: List[str]

class OffreRequest(BaseModel):
    texte: str
    profil_competences: list[str] = []

class AnalyzeResponse(BaseModel):
    hard_skills: list[str]
    outils: list[str]
    annees_experience: int
    niveau: str
    resume: str
    score_compatibilite: int
    competences_match: list[str]
    competences_manquantes: list[str]

    recommandations: Optional[RecommendationResponse] = None

