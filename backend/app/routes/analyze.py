# ============================================================
# Kisan-DePIN — AI Analysis Route
# POST /api/v1/analyze
# ============================================================

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from app.services.vision import vision_analyzer
from app.models.schemas import AnalysisResponse

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_field_image(
    image: UploadFile = File(..., description="Field photograph from smartphone"),
    latitude: float = Form(28.6139, description="GPS latitude"),
    longitude: float = Form(77.2090, description="GPS longitude"),
    timestamp: str = Form("", description="ISO 8601 timestamp"),
):
    """
    Analyze a field image for compliance using the ResNet50+U-Net pipeline.

    The AI segments the image into soil classes and determines:
    - Burnt soil vs tilled soil percentages
    - NDVI vegetation index
    - Thermal anomaly detection

    Returns COMPLIANT or VIOLATION status with confidence score.
    """

    # Validate file type
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read image bytes
    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file")

    # Run the vision pipeline
    result = await vision_analyzer.analyze(
        image_bytes=image_bytes,
        filename=image.filename or "unknown.jpg",
        latitude=latitude,
        longitude=longitude,
    )

    return result
