from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.competence_service import (
    generer_test,
    evaluer_reponses,
    generer_roadmap
)

router = APIRouter(prefix="/competence", tags=["Competence"])

class TestRequest(BaseModel):
    competence: str

class EvalRequest(BaseModel):
    questions: list
    reponses: list

class RoadmapRequest(BaseModel):
    competence: str
    niveau: str

@router.post("/test/generate")
async def generate_test(request: TestRequest):
    if not request.competence or len(request.competence.strip()) < 2:
        raise HTTPException(status_code=400, detail="Nom de compétence requis")
    try:
        result = generer_test(request.competence)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur IA : {str(e)}")

@router.post("/test/evaluate")
async def evaluate_test(request: EvalRequest):
    if not request.questions:
        raise HTTPException(status_code=400, detail="Questions requises")
    try:
        result = evaluer_reponses(request.questions, request.reponses)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur évaluation : {str(e)}")

@router.post("/roadmap")
async def generate_roadmap(request: RoadmapRequest):
    if not request.competence:
        raise HTTPException(status_code=400, detail="Compétence requise")
    if request.niveau not in ["Debutant", "Moyen", "Expert", "Intermediaire"]:
        raise HTTPException(
            status_code=400,
            detail="Niveau invalide. Utilisez : Debutant, Moyen, Expert"
        )
    try:
        result = generer_roadmap(request.competence, request.niveau)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur IA : {str(e)}")