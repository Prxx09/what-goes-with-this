from time import perf_counter
from uuid import UUID

from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware

from .models import WardrobeItem, WardrobeItemCreate, WardrobeItemUpdate
from .store import wardrobe_store

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


@app.middleware("http")
async def add_server_timing(request, call_next):
    started = perf_counter()
    response = await call_next(request)
    elapsed_ms = (perf_counter() - started) * 1000
    response.headers["Server-Timing"] = f"app;dur={elapsed_ms:.2f}"
    return response


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


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
