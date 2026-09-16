from fastapi import FastAPI

app = FastAPI(
    title="What Goes With This API",
    version="0.1.0",
    description="Low-latency wardrobe and outfit recommendation API.",
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/wardrobe")
async def list_wardrobe() -> dict[str, list]:
    """Initial contract for the mobile client; persistence is added next."""
    return {"items": []}
