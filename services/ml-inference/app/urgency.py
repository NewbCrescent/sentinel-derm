"""Urgency-level mapping from a set of detections (TECHNICAL.md §7).

A 3-tier triage signal — it flags "needs faster human eyes," it does not
diagnose:

- ``emergent`` — ``malignant`` detected at **any** confidence. Deliberately
  not confidence-gated: the cost of a missed possible-malignancy flag is too
  high.
- ``urgent`` — ``eczema`` / ``psoriasis`` / ``warts``: chronic or inflammatory
  conditions that can need active treatment, but aren't a malignancy signal.
- ``routine`` — ``acne`` / ``benign`` / ``keratosisPilaris`` (default).

When multiple labels are present, the most severe tier wins.
"""

from __future__ import annotations

from collections.abc import Iterable

from .schemas import Detection, UrgencyLevel

_URGENT_LABELS = frozenset({"eczema", "psoriasis", "warts"})


def urgency_level(detections: Iterable[Detection]) -> UrgencyLevel:
    labels = {detection.label for detection in detections}
    if "malignant" in labels:
        return UrgencyLevel.emergent
    if labels & _URGENT_LABELS:
        return UrgencyLevel.urgent
    return UrgencyLevel.routine
