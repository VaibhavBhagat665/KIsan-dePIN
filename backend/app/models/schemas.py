# ============================================================
# Kisan-DePIN — Pydantic Models
# ============================================================

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class ComplianceStatus(str, Enum):
    COMPLIANT = "COMPLIANT"
    VIOLATION = "VIOLATION"
    PENDING = "PENDING"


class AnalysisDetails(BaseModel):
    burnt_soil_percentage: float = Field(..., ge=0, le=100)
    tilled_soil_percentage: float = Field(..., ge=0, le=100)
    vegetation_index: float = Field(..., ge=-1, le=1, description="NDVI value")
    thermal_anomaly: bool = False


class AnalysisRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    timestamp: Optional[str] = None


class AnalysisResponse(BaseModel):
    status: ComplianceStatus
    confidence: float = Field(..., ge=0, le=1)
    timestamp: str
    model_version: str = "resnet50-unet-v1.0-mock"
    details: AnalysisDetails
    image_hash: Optional[str] = None
    gps: Optional[dict] = None


class RAGQuery(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
    language: str = Field(default="en", description="Response language: en, hi, pa, etc.")
    context: Optional[str] = Field(default=None, description="Additional farmer context")


class RAGResponse(BaseModel):
    answer: str
    sources: list[dict]
    confidence: float = Field(..., ge=0, le=1)
    language: str
    agent_reasoning: Optional[str] = None
