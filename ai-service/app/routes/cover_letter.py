from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.models.cover_letter_models import CoverLetterRequest, CoverLetterResponse
from app.services.cover_letter import generate_cover_letter, generate_cover_letter_from_text
from datetime import datetime

router = APIRouter(prefix="/coverletter", tags=["Cover Letter"])


class CoverLetterRawRequest(BaseModel):
    cv_text: str
    offre_text: str
    offre_titre: Optional[str] = None
    offre_entreprise: Optional[str] = None

@router.post("/generate", response_model=CoverLetterResponse)
async def generate_cover_letter_endpoint(request: CoverLetterRequest):
    """
    Génère une lettre de motivation personnalisée basée sur le profil utilisateur,
    l'offre d'emploi et l'analyse existante.
    """
    try:
        # Validation des données d'entrée
        if not request.user or not request.offre or not request.analyse:
            raise HTTPException(status_code=400, detail="Données utilisateur, offre et analyse requises")

        if not request.user.profil:
            raise HTTPException(status_code=400, detail="Profil utilisateur requis")

        # Conversion des données Pydantic en dict pour le service
        user_data = request.user.model_dump()
        offre_data = request.offre.model_dump()
        analyse_data = request.analyse.model_dump()
        cv_data = request.cv.model_dump() if request.cv else None

        # Génération de la lettre
        contenu = await generate_cover_letter(user_data, offre_data, analyse_data, cv_data)

        if not contenu or len(contenu.strip()) < 50:
            raise HTTPException(status_code=500, detail="Impossible de générer une lettre de motivation valide")

        # Création de la réponse
        response = CoverLetterResponse(
            contenu=contenu,
            date_generation=datetime.utcnow().isoformat()
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur lors de la génération de la lettre: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la génération de la lettre")


@router.post("/generate-raw", response_model=CoverLetterResponse)
async def generate_raw(req: CoverLetterRawRequest):
    """
    Génère une lettre de motivation à partir du texte brut d'un CV (extrait d'un PDF)
    et du texte d'une offre, sans persistance ni profil utilisateur.
    """
    if not req.cv_text or not req.cv_text.strip():
        raise HTTPException(status_code=400, detail="cv_text requis")
    if not req.offre_text or not req.offre_text.strip():
        raise HTTPException(status_code=400, detail="offre_text requis")

    try:
        contenu = await generate_cover_letter_from_text(
            req.cv_text, req.offre_text, req.offre_titre, req.offre_entreprise
        )
        if not contenu or len(contenu.strip()) < 50:
            raise HTTPException(status_code=500, detail="Génération échouée")

        return CoverLetterResponse(
            contenu=contenu,
            date_generation=datetime.utcnow().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur génération raw: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la génération raw")