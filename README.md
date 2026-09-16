# What Goes With This?

A mobile-first AI wardrobe assistant that creates outfit combinations from clothes the user actually owns.

## V1

- Build a personal digital wardrobe from camera/gallery photos.
- Add, edit, browse, and remove wardrobe items.
- Select one item and ask what goes with it.
- Lock 2–3 items and have the recommendation engine complete the outfit.
- Prioritize low latency by processing wardrobe images once and reusing structured attributes/embeddings.

## Repository

```text
mobile/   Expo + React Native client
backend/  FastAPI service
docs/     Product and architecture notes
```

## Mobile development

```bash
cd mobile
npm install
npm start
```

Use Expo Go or an Android/iOS simulator to open the development build.

## Backend development

```bash
cd backend
python -m venv .venv
# Activate .venv, then:
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Health check: `GET /health`

## Architecture principle

Outfit generation should never require reprocessing the user's entire image library. Image analysis belongs on the ingestion path; recommendation requests should use precomputed wardrobe data and progressively move suitable work on-device.
