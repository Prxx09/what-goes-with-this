# What Goes With This?

A mobile-first AI wardrobe assistant that creates outfit combinations from clothes the user actually owns.

## Current V1 flow

The first end-to-end wardrobe ingestion slice is implemented:

```text
Camera / Gallery
      -> Hugging Face vision analysis
      -> editable detected attributes
      -> backend image upload
      -> wardrobe item creation
      -> wardrobe grid
```

AI analysis currently extracts category, item type, primary/secondary colors, pattern, style tags, season tags, and confidence. The metadata is generated once at ingestion time and stored with the wardrobe item for later recommendation use.

## Repository

```text
mobile/   Expo + React Native client
backend/  FastAPI service
docs/     Product and architecture notes
```

## 1. Backend setup

```bash
cd backend
python -m venv .venv
```

Activate the environment, then install dependencies:

```bash
pip install -r requirements.txt
```

Copy the environment example:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Edit `backend/.env` and set a valid Hugging Face token:

```env
HF_TOKEN=your_new_huggingface_token
HF_VISION_MODEL=Qwen/Qwen2.5-VL-3B-Instruct
```

Start the API so a physical phone can reach it:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Check `http://localhost:8000/health` on the computer. FastAPI docs are at `http://localhost:8000/docs`.

## 2. Mobile setup

```bash
cd mobile
npm install
```

Copy `mobile/.env.example` to `mobile/.env`.

For an emulator on the same machine, localhost may work. For Expo Go on a physical phone, set `EXPO_PUBLIC_API_URL` to your computer's LAN IP, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:8000
```

The phone and computer should be on the same network and port `8000` must be reachable through the local firewall.

Start Expo:

```bash
npm start
```

Open the app in Expo Go or a simulator.

## 3. End-to-end smoke test

1. Open **My Wardrobe** and tap **Add**.
2. Take a photo or choose a JPEG/PNG/WebP image containing one main clothing item.
3. Wait for **Analyzing clothing…** to finish.
4. Confirm the app auto-fills the name, color, and category and shows the detected item type/pattern/confidence.
5. Correct any field if needed and tap **Save to wardrobe**.
6. Return to **My Wardrobe** and verify the uploaded image and metadata appear.

If AI analysis fails, the form intentionally remains usable for manual entry. Images are limited to 8 MB.

## Current development limitation

Wardrobe records are currently stored in memory, so they reset when the FastAPI process restarts. Uploaded image files remain under `backend/uploads/`. Persistent SQLite/PostgreSQL storage is the next infrastructure step, followed by outfit candidate retrieval and ranking.

## Architecture principle

Outfit generation should never reprocess the user's entire image library. Image analysis belongs on the ingestion path; recommendation requests should use precomputed wardrobe data and progressively move suitable work on-device.
