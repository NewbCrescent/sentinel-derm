"""YOLO26m classification inference (TECHNICAL.md §7).

The model loads once at module import (process startup), never per-request —
CPU-only on Railway, so there's no cold start cost per call. ``classify()``
fetches the image from a URL, runs the classifier, and returns detections in
the canonical ``{label, confidence}`` shape.
"""

from __future__ import annotations

import io
import logging
import os

import requests
from PIL import Image
from ultralytics import YOLO

from .schemas import Detection

logger = logging.getLogger(__name__)

_MODEL_PATH = os.environ.get("MODEL_PATH", "best.pt")
_IMAGE_DOWNLOAD_TIMEOUT_S = 15

# Map the trained model's class indices to the seven canonical camelCase labels
# (TECHNICAL.md §4). Keyed by index, not display name, so it's robust to the
# model's casing/spacing ('Acne', 'Keratosis Pilaris', ...).
_INDEX_TO_LABEL: dict[int, str] = {
    0: "acne",
    1: "eczema",
    2: "keratosisPilaris",
    3: "psoriasis",
    4: "warts",
    5: "benign",
    6: "malignant",
}

# Loaded once at module scope — see ProjectStructure.md and TECHNICAL.md §7.
_model = YOLO(_MODEL_PATH)


def _fetch_image(image_url: str) -> Image.Image:
    response = requests.get(image_url, timeout=_IMAGE_DOWNLOAD_TIMEOUT_S)
    response.raise_for_status()
    return Image.open(io.BytesIO(response.content)).convert("RGB")


def classify(image_url: str) -> list[Detection]:
    """Run top-1 classification on the image at ``image_url``.

    Returns a single-element list to match the ``detections`` array contract;
    a classifier scores the whole image, so there is one top result per call.
    """
    image = _fetch_image(image_url)
    result = _model(image)[0]
    probs = result.probs
    top_index = int(probs.top1)
    confidence = float(probs.top1conf)
    return [Detection(label=_INDEX_TO_LABEL[top_index], confidence=confidence)]
