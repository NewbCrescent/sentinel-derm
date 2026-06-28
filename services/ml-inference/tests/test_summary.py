"""Unit tests for the templated summary builder (TECHNICAL.md §7)."""

from __future__ import annotations

from app.schemas import Detection
from app.summary import build_summary


def test_empty_summary() -> None:
    assert build_summary([]) == "No conditions detected."


def test_single_detection_summary() -> None:
    out = build_summary([Detection(label="eczema", confidence=0.91)])
    assert out == "Detected: eczema (91% confidence)."


def test_confidence_is_rounded_to_whole_percent() -> None:
    out = build_summary([Detection(label="acne", confidence=0.876)])
    assert out == "Detected: acne (88% confidence)."


def test_multiple_detections_summary() -> None:
    out = build_summary(
        [
            Detection(label="eczema", confidence=0.91),
            Detection(label="acne", confidence=0.5),
        ]
    )
    assert out == "Detected: eczema (91% confidence), acne (50% confidence)."
