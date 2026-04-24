from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.models.analyze_models import OffreRequest, AnalyzeResponse
from app.services.analyzer import analyze_offre, analyze_offre_image
import json

router = APIRouter(prefix="/analyze", tags=["Analyze"])

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]

@router.post("/text", response_model=AnalyzeResponse)
async def analyze_text(request: OffreRequest):
    if not request.texte or len(request.texte.strip()) < 20:
        raise HTTPException(status_code=400, detail="Texte trop court")
    try:
        result = analyze_offre(request.texte, request.profil_competences)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.post("/image", response_model=AnalyzeResponse)
async def analyze_image(
    image: UploadFile = File(...),
    profil_competences: str = Form(default="[]")
):
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Format non supporté. Utilisez jpg, png ou webp.")

    image_bytes = await image.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image trop grande (max 10MB)")

    # ─── Fix parsing robuste ────────────────────────────────────────────────────
    competences = []
    try:
        parsed = json.loads(profil_competences)
        if isinstance(parsed, list):
            competences = [str(c).strip() for c in parsed if c]
        elif isinstance(parsed, str):
            competences = [c.strip() for c in parsed.split(",") if c.strip()]
    except (json.JSONDecodeError, TypeError):
        # Fallback : traiter comme CSV
        competences = [c.strip().strip('"') for c in profil_competences.split(",") if c.strip()]

    try:
        result = analyze_offre_image(image_bytes, image.content_type, competences)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))