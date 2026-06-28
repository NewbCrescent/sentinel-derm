# Sentinel Derm — ML Inference Service

FastAPI + Ultralytics YOLO **classification** service. See `TECHNICAL.md §7` for
the architecture, contract, and urgency mapping — this README covers how to
**run, build, and deploy** it.

## Contract (summary)

- `POST /classify` — `{"imageUrl": "<url>"}` → `{"detections": [{"label", "confidence"}], "urgencyLevel", "summary"}`
- `GET /health` — `{"status": "ok"}` (Railway healthcheck target)
- Errors: `400 {"detail": "invalid or unreachable image url"}`, `500 {"detail": "AI down"}`

## Local development

```bash
cd services/ml-inference
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload      # serves on http://127.0.0.1:8000
pytest -q                          # run the unit tests
```

Local dev uses your platform's default torch wheel; the Docker image pins
CPU-only wheels (below).

## Run with Docker (local)

The Dockerfile builds the production image (CPU-only torch). The build context is
this directory.

```bash
cd services/ml-inference
docker build -t sentinel-ml .
docker run --rm -p 8000:8000 sentinel-ml
curl localhost:8000/health         # -> {"status":"ok"}
```

The container binds uvicorn to `$PORT` (defaults to `8000`). The first build is
large — it downloads CPU `torch`/`torchvision` plus `ultralytics`/`opencv`.

## Deploy to Railway

Deploys as its own always-on Railway service (CPU-only; Railway has no GPU).

1. Install + log in: `npm i -g @railway/cli`, then `railway login`.
2. Create a service from this repo and set its **Root Directory** to
   `services/ml-inference`. This is a monorepo — Railway builds from there,
   auto-detects the `Dockerfile`, and `railway.json` pins the builder and the
   `/health` healthcheck.
3. **Env vars:** none required by this service — `best.pt` ships inside the image
   and `$PORT` is injected by Railway. (Optional: `MODEL_PATH` to point at a
   different weights file.)
4. Deploy: `railway up` from `services/ml-inference`, or push to the connected
   branch for auto-deploy.
5. Verify: `curl https://<your-service>.up.railway.app/health`.

> The Supabase Edge Function (`TECHNICAL.md §7`) is what calls
> `POST <railway-url>/classify`. The Railway URL is configured on the Supabase
> side, not in this service.

## Notes

- `requirements.txt` is a full pinned freeze; the Dockerfile reinstalls
  `torch`/`torchvision` from the PyTorch CPU index
  (`https://download.pytorch.org/whl/cpu`) to avoid the multi-GB CUDA build on
  Linux.
- The image targets Python 3.12 for broad Linux wheel coverage even though local
  dev may run a newer Python.
