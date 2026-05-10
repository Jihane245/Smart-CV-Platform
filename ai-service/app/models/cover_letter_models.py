from pydantic import BaseModel
from typing import List, Optional, Any

class UserModel(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    profil: dict

class OffreModel(BaseModel):
    id: int
    titre: str
    entreprise: str
    description: Optional[str]
    exigences: Optional[str]
    type_contrat: Optional[str]
    url_offre: Optional[str]
    date_publication: str
    date_expiration: Optional[str]

class AnalyseModel(BaseModel):
    mots_cles_extraits: List[str]
    competences_requises: List[str]
    competences_match: List[str]
    competences_manquantes: List[str]
    score_compatibilite: float
    resume: str
    recommandations: Optional[str]

class CvModel(BaseModel):
    id: Optional[int] = None
    keyWords: Optional[str] = None
    skillsDetectes: Optional[str] = None
    scoreCompatibilite: Optional[float] = None
    exigences: Optional[str] = None
    templateId: Optional[int] = None

class CoverLetterRequest(BaseModel):
    user: UserModel
    offre: OffreModel
    analyse: AnalyseModel
    cv: Optional[CvModel] = None

class CoverLetterResponse(BaseModel):
    contenu: str
    date_generation: str
