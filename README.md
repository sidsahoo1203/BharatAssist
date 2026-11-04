# 🇮🇳 BharatAssist AI – Smart Government Scheme Discovery Platform

> **AI-powered platform that helps Indian citizens discover and apply for government schemes in seconds using voice, documents, and AI.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-green)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## 🚀 What It Does

BharatAssist AI is a course project combining **4 core AI innovations**:

| Feature | Description |
|---|---|
| **SchemeMatch AI** | Reverse eligibility engine — tell us who you are, we find what you qualify for |
| **VoiceScheme AI** | Speak in Hindi, English or Hinglish — AI understands and responds in voice |
| **VisualScheme AI** | Infographic dashboards, comparison charts, payment timelines |
| **FormFriend AI** | Auto-fills government forms and generates a pre-filled PDF |

---

## 📸 Features

- ✅ Matches user profile against **8+ government schemes** (PM-KISAN, Ayushman Bharat, KCC, etc.)
- 🎤 Voice input using Web Speech API (Hindi/English/Hinglish)
- 📄 Document OCR simulation (Aadhaar, income certificate)
- 📊 Beautiful charts via Recharts (bar, pie, radar, line)
- 📝 jsPDF-based form generation with professional layout
- 🔗 Direct links to official scheme portals
- 📱 Fully responsive dark UI with glassmorphism design
- 🌐 Multilingual labels (Hindi + English throughout)

---

## 🎯 Live Routes

| Route | Description |
|---|---|
| `/` | Landing page with hero and feature sections |
| `/onboard` | User onboarding — voice, text, or document upload |
| `/dashboard` | Eligibility dashboard with all results |
| `/schemes` | Browse all schemes with filters |
| `/voice` | VoiceScheme AI chatbot |
| `/visual` | VisualScheme AI charts |
| `/form` | FormFriend AI – auto-fill and download |

---

## 🛠 Tech Stack

### Frontend
- **Next.js 14** (App Router, TypeScript)
- **TailwindCSS** – custom dark theme with glassmorphism
- **Framer Motion** – animations
- **Recharts** – data visualizations
- **jsPDF** – PDF generation
- **html2canvas** – shareable screenshot
- **Web Speech API** – browser-native voice recognition & TTS

### Backend
- **FastAPI** (Python) – REST API
- **Pydantic** – data validation
- **EasyOCR / Tesseract** – document OCR *(production)*
- **OpenAI Whisper** – voice transcription *(production)*
- **GPT-4 / Claude** – AI responses *(production)*
- **PostgreSQL** – database *(production)*

---

## ⚡ Quick Start

### Frontend (Demo — no API keys needed)

```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:3000**

### Backend (Optional)

```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API docs at **http://localhost:8000/docs**

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` in `/frontend`:

```bash
cp frontend/.env.example frontend/.env.local
```

```env
# Optional – AI features work in demo mode without these
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
FIREBASE_API_KEY=...
```

---

## 🏛 Scheme Database

| Scheme | Category | Benefit |
|---|---|---|
| PM-KISAN | Agriculture | ₹6,000/yr |
| Ayushman Bharat | Health | ₹5L/yr |
| Kisan Credit Card | Agriculture | ₹3L loan |
| PM Vishwakarma | Skill | ₹3.15L |
| National Scholarship | Education | ₹75K/yr |
| TN BC Scholarship | Education | ₹12K/yr |
| PMAY | Housing | ₹2.5L |
| Sukanya Samriddhi | Women | 8.2% interest |

---

## 🎯 How the Eligibility Engine Works

```
User Profile (age, income, state, occupation, category)
         ↓
 Rule-Based Matcher (per scheme)
         ↓
  Score = met_criteria / total_criteria × 100
         ↓
  100% → ELIGIBLE
  60-99% → ALMOST ELIGIBLE  
  <60% → NOT ELIGIBLE
```

---

## 🚢 Deployment

### Vercel (Frontend)
```bash
cd frontend
npx vercel --prod
```

### Railway / Render (Backend)
```bash
# Set environment variables in dashboard
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Docker
```bash
docker-compose up --build
```

---

## 🤝 Team

Built as a **course project** with ❤️ for 140 crore Indians.

---

## 📄 License

MIT License — Free to use, modify, and distribute.

---

## 🛡️ ML Safety Guard (course project: 21CSE746P)

Every voice-chat message is checked by two machine-learning models before BharatAssist answers:

| Model | Task | Result (test set) |
|---|---|---|
| Linear SVM, char 2–4 gram TF-IDF | language detection, 12 Indian languages | 99.86 % accuracy |
| Linear SVM, char 2–4 gram TF-IDF | safe / unsafe message | macro-F1 0.725 |

* **Dataset:** [IndicGuard](https://huggingface.co/datasets/l3cube-pune/IndicGuard) (L3Cube Pune, CC-BY-4.0) – 1.29 M human-labelled prompts in 12 languages, plus in-domain scheme questions.
* **Policy:** `allow` → normal answer, `review` → answered and flagged, `block` → polite refusal.
* **Backend endpoints:** `POST /moderate`, `POST /detect-language`; `/voice/respond` also runs the guard.
* **ML work:** everything is in [`ml/`](ml/) – data cleaning, 5 classical models + 2 Keras networks compared, notebooks `01`–`03`, trained models in `ml/models/`. See [`ml/README.md`](ml/README.md).

```bash
# backend (needs scikit-learn for the guard)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
pytest -q test_safety_guard.py

# ML tests
cd ../ml
pip install -r requirements-dev.txt
pytest -q
```
