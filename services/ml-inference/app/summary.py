"""Templated AI summary builder (TECHNICAL.md §7) — no LLM.

Built directly from the structured detections, e.g.
``"Detected: eczema (91.0% confidence)."`` (confidence shown to one decimal
place). Carefully non-diagnostic per
TECHNICAL.md §1/§7: it reports what the model detected, it does not name a
diagnosis.
"""

from __future__ import annotations

from collections.abc import Sequence

from .schemas import Detection


def build_summary(detections: Sequence[Detection]) -> str:
    if not detections:
        return "No conditions detected."
    parts = [
        f"{detection.label} ({detection.confidence * 100:.1f}% confidence)"
        for detection in detections
    ]
    return f"Detected: {', '.join(parts)}."
