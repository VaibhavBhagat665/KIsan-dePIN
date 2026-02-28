# ============================================================
# Kisan-DePIN — AI Computer Vision Service
# Mock ResNet50 encoder + U-Net decoder for soil segmentation
# ============================================================
#
# In production, this would:
#   1. Load a fine-tuned ResNet50 encoder (pretrained on ImageNet)
#   2. Feed encoded features into a U-Net decoder
#   3. Segment the image into: burnt_soil, tilled_soil, vegetation, water, other
#   4. Compute per-class percentages and NDVI from NIR bands
#
# For the hackathon demo, we simulate realistic outputs based on
# image characteristics (file size, name) for deterministic results.
# ============================================================

import hashlib
import random
from datetime import datetime, timezone
from typing import Optional

from app.models.schemas import AnalysisDetails, AnalysisResponse, ComplianceStatus


class VisionAnalyzer:
    """Mock ResNet50 + U-Net soil segmentation pipeline."""

    MODEL_VERSION = "resnet50-unet-v1.0-mock"

    # Simulated class labels from the segmentation head
    CLASSES = ["burnt_soil", "tilled_soil", "vegetation", "water", "bare_ground"]

    def __init__(self):
        # In production: self.model = torch.load("models/resnet50_unet.pth")
        self._initialized = True
        print("[VisionAnalyzer] Mock ResNet50+U-Net pipeline initialized")

    async def analyze(
        self,
        image_bytes: bytes,
        filename: str,
        latitude: float,
        longitude: float,
    ) -> AnalysisResponse:
        """
        Run the segmentation pipeline on the uploaded image.

        The mock logic:
        - Hash the image to get a deterministic seed
        - If filename contains 'burn' or 'fire' → VIOLATION
        - Otherwise → COMPLIANT with realistic percentages
        """

        # Create deterministic seed from image content
        image_hash = hashlib.sha256(image_bytes).hexdigest()
        seed = int(image_hash[:8], 16)
        rng = random.Random(seed)

        # Check filename for demo-trigger keywords
        fname_lower = filename.lower()
        is_violation = any(kw in fname_lower for kw in ["burn", "fire", "smoke", "stubble"])

        if is_violation:
            details = AnalysisDetails(
                burnt_soil_percentage=round(rng.uniform(25, 55), 1),
                tilled_soil_percentage=round(rng.uniform(20, 45), 1),
                vegetation_index=round(rng.uniform(0.1, 0.35), 2),
                thermal_anomaly=True,
            )
            status = ComplianceStatus.VIOLATION
            confidence = round(rng.uniform(0.82, 0.95), 2)
        else:
            details = AnalysisDetails(
                burnt_soil_percentage=round(rng.uniform(0, 5), 1),
                tilled_soil_percentage=round(rng.uniform(75, 95), 1),
                vegetation_index=round(rng.uniform(0.55, 0.85), 2),
                thermal_anomaly=False,
            )
            status = ComplianceStatus.COMPLIANT
            confidence = round(rng.uniform(0.90, 0.98), 2)

        return AnalysisResponse(
            status=status,
            confidence=confidence,
            timestamp=datetime.now(timezone.utc).isoformat(),
            model_version=self.MODEL_VERSION,
            details=details,
            image_hash=image_hash[:16],
            gps={"latitude": latitude, "longitude": longitude},
        )


# Singleton instance
vision_analyzer = VisionAnalyzer()
