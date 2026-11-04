# BharatAssist AI – Backend API

Built with **FastAPI** (Python). Exposes AI endpoints for scheme matching, OCR, voice transcription, and form generation.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## API Docs
Open `http://localhost:8000/docs` for interactive Swagger UI.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/schemes` | List all schemes |
| POST | `/schemes/match` | Match user profile → eligible schemes |
| POST | `/profile/extract` | OCR a document → extract profile |
| POST | `/voice/transcribe` | Audio → text (Whisper) |
| POST | `/voice/respond` | Text → TTS audio |
| POST | `/form/generate` | Profile + scheme → PDF form |
