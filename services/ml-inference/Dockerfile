# Railway deployment for the Sentinel Derm ML inference service (TECHNICAL.md §7).
# CPU-only — Railway offers no GPU, so torch/torchvision are installed from the
# PyTorch CPU wheel index to avoid pulling the multi-GB CUDA build.
#
# Dev uses Python 3.14; this image targets 3.12 for broad Linux wheel coverage
# (torch/opencv cp314 Linux wheels are not reliably available yet).
FROM python:3.12-slim

# Runtime libraries opencv-python needs on a slim base.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install CPU-only torch/torchvision first; the == pins are then satisfied for
# the requirements.txt install below, which skips the already-present builds.
RUN pip install --no-cache-dir \
    torch==2.12.1 torchvision==0.27.1 \
    --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Application code and trained weights (the model loads once at startup).
COPY app/ ./app/
COPY best.pt ./best.pt

# Railway injects $PORT; bind uvicorn to it (shell form so the env var expands).
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
