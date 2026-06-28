"""Unit tests for the detection-shape serialization and request/response
boundary models (AGENTS.md Testing Policy; TECHNICAL.md §4/§7).

Weight-free — these never import the model, only the Pydantic schemas.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas import ClassifyRequest, ClassifyResponse, Detection, UrgencyLevel


def test_request_accepts_camelcase_alias() -> None:
    req = ClassifyRequest.model_validate({"imageUrl": "http://example/x.webp"})
    assert req.image_url == "http://example/x.webp"


def test_request_accepts_field_name() -> None:
    req = ClassifyRequest.model_validate({"image_url": "http://example/x.webp"})
    assert req.image_url == "http://example/x.webp"


def test_request_missing_url_is_rejected() -> None:
    with pytest.raises(ValidationError):
        ClassifyRequest.model_validate({})


def test_detection_rejects_confidence_above_one() -> None:
    with pytest.raises(ValidationError):
        Detection.model_validate({"label": "acne", "confidence": 1.5})


def test_detection_rejects_negative_confidence() -> None:
    with pytest.raises(ValidationError):
        Detection.model_validate({"label": "acne", "confidence": -0.1})


def test_detection_rejects_unknown_label() -> None:
    with pytest.raises(ValidationError):
        Detection.model_validate({"label": "cancer", "confidence": 0.5})


def test_detection_has_no_box_field() -> None:
    dumped = Detection(label="acne", confidence=0.5).model_dump()
    assert set(dumped) == {"label", "confidence"}


def test_response_serializes_to_camelcase() -> None:
    resp = ClassifyResponse(
        detections=[Detection(label="eczema", confidence=0.91)],
        urgency_level=UrgencyLevel.urgent,
        summary="Detected: eczema (91.0% confidence).",
    )
    dumped = resp.model_dump(by_alias=True, mode="json")
    assert set(dumped) == {"detections", "urgencyLevel", "summary"}
    assert dumped["urgencyLevel"] == "urgent"
    assert dumped["detections"] == [{"label": "eczema", "confidence": 0.91}]


def test_response_parses_camelcase_payload() -> None:
    resp = ClassifyResponse.model_validate(
        {
            "detections": [{"label": "acne", "confidence": 0.5}],
            "urgencyLevel": "routine",
            "summary": "x",
        }
    )
    assert resp.urgency_level is UrgencyLevel.routine
    assert resp.detections[0].label == "acne"
