"""Pydantic models for the ML inference service boundary.

Mirrors the classification shape in TECHNICAL.md §4/§7: each detection is
``{label, confidence}`` with no bounding box (YOLO is run in classification
mode, not detection). The ``/classify`` response carries the full combined
``{detections, urgencyLevel, summary}`` shape that the Supabase Edge Function
writes to the patient row as-is.
"""

from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# The seven canonical classification labels (camelCase), per TECHNICAL.md §4.
ConditionLabel = Literal[
    "acne",
    "eczema",
    "keratosisPilaris",
    "psoriasis",
    "warts",
    "benign",
    "malignant",
]


class UrgencyLevel(str, Enum):
    """3-tier triage signal (TECHNICAL.md §7). Not a diagnosis."""

    routine = "routine"
    urgent = "urgent"
    emergent = "emergent"


class ClassifyRequest(BaseModel):
    """Inbound request body. Accepts camelCase ``imageUrl`` from the caller."""

    model_config = ConfigDict(populate_by_name=True)

    image_url: str = Field(..., alias="imageUrl")


class Detection(BaseModel):
    """A single classification result. No ``box`` — this is a classifier."""

    label: ConditionLabel
    confidence: float = Field(..., ge=0.0, le=1.0)


class ClassifyResponse(BaseModel):
    """Combined shape written to the patient row (TECHNICAL.md §7).

    Serialized with camelCase ``urgencyLevel`` via the field alias (FastAPI
    serializes response models by alias).
    """

    model_config = ConfigDict(populate_by_name=True)

    detections: list[Detection]
    urgency_level: UrgencyLevel = Field(..., alias="urgencyLevel")
    summary: str
