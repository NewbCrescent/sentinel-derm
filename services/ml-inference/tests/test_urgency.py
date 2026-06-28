"""Unit tests for the urgency-level mapping (TECHNICAL.md §7)."""

from __future__ import annotations

from app.schemas import Detection, UrgencyLevel
from app.urgency import urgency_level


def _d(label: str, confidence: float = 0.9) -> Detection:
    return Detection(label=label, confidence=confidence)


def test_empty_is_routine() -> None:
    assert urgency_level([]) == UrgencyLevel.routine


def test_acne_is_routine() -> None:
    assert urgency_level([_d("acne")]) == UrgencyLevel.routine


def test_benign_is_routine() -> None:
    assert urgency_level([_d("benign")]) == UrgencyLevel.routine


def test_keratosis_pilaris_is_routine() -> None:
    assert urgency_level([_d("keratosisPilaris")]) == UrgencyLevel.routine


def test_eczema_is_urgent() -> None:
    assert urgency_level([_d("eczema")]) == UrgencyLevel.urgent


def test_psoriasis_is_urgent() -> None:
    assert urgency_level([_d("psoriasis")]) == UrgencyLevel.urgent


def test_warts_is_urgent() -> None:
    assert urgency_level([_d("warts")]) == UrgencyLevel.urgent


def test_malignant_is_emergent_at_any_confidence() -> None:
    assert urgency_level([_d("malignant", 0.01)]) == UrgencyLevel.emergent


def test_malignant_dominates_other_labels() -> None:
    detections = [_d("eczema"), _d("malignant", 0.2)]
    assert urgency_level(detections) == UrgencyLevel.emergent


def test_urgent_dominates_routine() -> None:
    detections = [_d("acne"), _d("psoriasis")]
    assert urgency_level(detections) == UrgencyLevel.urgent
