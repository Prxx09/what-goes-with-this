from pathlib import Path
from time import perf_counter
from uuid import UUID, uuid4

from fastapi import FastAPI, File, HTTPException, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .models import WardrobeItem, WardrobeItemCreate, WardrobeItemUpdate
from .store import wardrobe_store

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="What Goes With This API",
    version="0.2.0",
    description="Low-latency wardrobe and outfit recommendation API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.middleware("http")
async def add_server_timing(request, call_next):
    started = perf_counter()
    response = await call_next(request)
    response.headers["Server-Timing"] = f"app;dur={(perf_counter() - started) * 1000:.2f}"
    return response


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/uploads", status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...)) -> dict[str, str]:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    extension = Path(file.filename or "item.jpg").suffix.lower() or ".jpg"
    filename = f"{uuid4().hex}{extension}"
    destination = UPLOAD_DIR / filename

    with destination.open("wb") as output:
        while chunk := await file.read(1024 * 1024):
            output.write(chunk)

    await file.close()
    return {"image_url": f"/uploads/{filename}"}


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
