import asyncio
import base64
import json
import os
from pathlib import Path
from time import perf_counter
from uuid import UUID, uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from huggingface_hub import InferenceClient

from .models import ClothingAnalysis, WardrobeItem, WardrobeItemCreate, WardrobeItemUpdate
from .store import wardrobe_store

load_dotenv()

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024

app = FastAPI(
    title="What Goes With This API",
    version="0.4.0",
    description="Low-latency wardrobe and outfit recommendation API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.middleware("http")
async def add_server_timing(request, call_next):
    started = perf_counter()
    response = await call_next(request)
    elapsed_ms = (perf_counter() - started) * 1000
    response.headers["Server-Timing"] = f"app;dur={elapsed_ms:.2f}"
    return response


def _validate_image(content_type: str, image_bytes: bytes) -> None:
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Use a JPEG, PNG, or WebP image")
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 8 MB or smaller")


def _extract_json(text: str) -> dict:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("Vision model did not return valid JSON")
    return json.loads(text[start : end + 1])


def _run_hf_analysis(image_bytes: bytes, content_type: str) -> tuple[ClothingAnalysis, float]:
    api_key = os.getenv("HF_TOKEN")
    if not api_key:
        raise RuntimeError("HF_TOKEN is not configured")

    model = os.getenv("HF_VISION_MODEL", "Qwen/Qwen2.5-VL-3B-Instruct")
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    image_url = f"data:{content_type};base64,{encoded}"
    prompt = (
        "Analyze the single main wardrobe item in this image. Return only valid JSON with keys: "
        "category, item_type, primary_color, secondary_colors, pattern, style_tags, season_tags, confidence. "
        "category must be one of top, bottom, shoes, outerwear, accessory, other. "
        "secondary_colors, style_tags and season_tags must be arrays of short lowercase strings. "
        "Use common concise clothing names for item_type and colors. confidence must be from 0 to 1. "
        "No markdown and no explanation."
    )

    client = InferenceClient(api_key=api_key, provider="auto")
    started = perf_counter()
    completion = client.chat.completions.create(
        model=model,
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_url}},
            ],
        }],
        max_tokens=300,
        temperature=0,
    )
    latency_ms = (perf_counter() - started) * 1000
    raw = completion.choices[0].message.content
    if not raw:
        raise ValueError("Vision model returned an empty response")
    return ClothingAnalysis.model_validate(_extract_json(raw)), latency_ms


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/analyze-clothing", response_model=ClothingAnalysis)
async def analyze_clothing(file: UploadFile = File(...)) -> Response:
    content_type = file.content_type or "application/octet-stream"
    image_bytes = await file.read()
    _validate_image(content_type, image_bytes)

    try:
        analysis, inference_ms = await asyncio.to_thread(_run_hf_analysis, image_bytes, content_type)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail="Vision model returned an invalid response") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Vision provider request failed") from exc

    return Response(
        content=analysis.model_dump_json(),
        media_type="application/json",
        headers={"X-Vision-Latency-Ms": f"{inference_ms:.2f}"},
    )


@app.post("/api/v1/uploads")
async def upload_image(request: Request, file: UploadFile = File(...)) -> dict[str, str]:
    content_type = file.content_type or "application/octet-stream"
    image_bytes = await file.read()
    _validate_image(content_type, image_bytes)

    filename = f"{uuid4().hex}{ALLOWED_IMAGE_TYPES[content_type]}"
    destination = UPLOAD_DIR / filename
    await asyncio.to_thread(destination.write_bytes, image_bytes)
    image_uri = str(request.base_url).rstrip("/") + f"/uploads/{filename}"
    return {"image_uri": image_uri}


@app.get("/api/v1/wardrobe", response_model=list[WardrobeItem])
async def list_wardrobe() -> list[WardrobeItem]:
    return wardrobe_store.list()


@app.post("/api/v1/wardrobe", response_model=WardrobeItem, status_code=status.HTTP_201_CREATED)
async def create_wardrobe_item(payload: WardrobeItemCreate) -> WardrobeItem:
    return wardrobe_store.create(payload)


@app.get("/api/v1/wardrobe/{item_id}", response_model=WardrobeItem)
async def get_wardrobe_item(item_id: UUID) -> WardrobeItem:
    item = wardrobe_store.get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Wardrobe item not found")
    return item


@app.patch("/api/v1/wardrobe/{item_id}", response_model=WardrobeItem)
async def update_wardrobe_item(item_id: UUID, payload: WardrobeItemUpdate) -> WardrobeItem:
    item = wardrobe_store.update(item_id, payload)
    if item is None:
        raise HTTPException(status_code=404, detail="Wardrobe item not found")
    return item


@app.delete("/api/v1/wardrobe/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_wardrobe_item(item_id: UUID) -> Response:
    if not wardrobe_store.delete(item_id):
        raise HTTPException(status_code=404, detail="Wardrobe item not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
