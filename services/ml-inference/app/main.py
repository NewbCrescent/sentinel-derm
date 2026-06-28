"""FastAPI app for the Sentinel Derm ML inference service (TECHNICAL.md §7).

Route handlers stay thin: classification lives in ``inference``, urgency and
summary in their own modules. ``POST /classify`` returns the combined
``{detections, urgencyLevel, summary}`` shape that the Edge Function writes to
the patient row.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException

from . import inference
from .schemas import ClassifyRequest, ClassifyResponse
from .summary import build_summary
from .urgency import urgency_level

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Sentinel Derm ML Inference")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/classify", response_model=ClassifyResponse)
def classify(request: ClassifyRequest) -> ClassifyResponse:
    try:
        detections = inference.classify(request.image_url)
    except Exception as exc:  # broad catch at the route boundary -> "AI down"
        logger.exception("classification failed")
        raise HTTPException(status_code=502, detail="AI down") from exc
    return ClassifyResponse(
        detections=detections,
        urgency_level=urgency_level(detections),
        summary=build_summary(detections),
    )
