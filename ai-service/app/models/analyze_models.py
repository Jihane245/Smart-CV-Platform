from pydantic import BaseModel
from typing import Optional

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