from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import os
import io
import re
from pathlib import Path
from PIL import Image
import pytesseract
import speech_recognition as sr
from pydub import AudioSegment
from reportlab.pdfgen import canvas

from safety_guard import get_guard  # ML language + safety models (see ml/)

app = FastAPI(
    title="BharatAssist AI – Backend API",
    description="AI-powered government scheme discovery for Indian citizens",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load scheme database ──────────────────────────────────────────────────────
SCHEMES_PATH = Path(__file__).parent / "data" / "schemes.json"

def load_schemes():
    try:
        # Try local path first
        with open("data/schemes.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: schemes.json not found at data/schemes.json. Returning empty list.")
    except json.JSONDecodeError:
        print(f"Warning: Could not decode JSON from data/schemes.json. Returning empty list.")
    except Exception as e:
        print(f"An unexpected error occurred while loading schemes: {e}")
    return []

# ── Models ────────────────────────────────────────────────────────────────────
class UserProfile(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    occupation: Optional[str] = None
    income: Optional[float] = None
    category: Optional[str] = "General"
    land_owner: Optional[bool] = False
    student_status: Optional[bool] = False
    family_size: Optional[int] = 4

class MatchRequest(BaseModel):
    profile: UserProfile

class VoiceRequest(BaseModel):
    text: str
    language: Optional[str] = "hi-IN"

class FormRequest(BaseModel):
    scheme_id: str
    profile: UserProfile

# ── Eligibility Engine ────────────────────────────────────────────────────────
def match_scheme(scheme: dict, profile: UserProfile) -> dict:
    el = scheme.get("eligibility", {})
    met = []
    missing = []
    total = 0

    if "minAge" in el or "maxAge" in el:
        total += 1
        age = profile.age or 25
        if "minAge" in el and age < el["minAge"]:
            missing.append(f"Age must be ≥ {el['minAge']}")
        elif "maxAge" in el and age > el["maxAge"]:
            missing.append(f"Age must be ≤ {el['maxAge']}")
        else:
            met.append(f"Age {age} ✓")

    if "maxIncome" in el:
        total += 1
        income = profile.income or float("inf")
        if income <= el["maxIncome"]:
            met.append(f"Income ₹{income:,.0f} qualifies")
        else:
            missing.append(f"Income must be ≤ ₹{el['maxIncome']:,.0f}")

    if "occupation" in el:
        total += 1
        occ = (profile.occupation or "").lower()
        if any(o.lower() in occ or occ in o.lower() for o in el["occupation"]):
            met.append(f"Occupation '{profile.occupation}' qualifies")
        else:
            missing.append(f"Must be: {', '.join(el['occupation'])}")

    if "category" in el:
        total += 1
        cat = (profile.category or "").upper()
        if any(c.upper() == cat or c.lower() == "general" for c in el["category"]):
            met.append(f"Category '{profile.category}' eligible")
        else:
            missing.append(f"Must belong to: {', '.join(el['category'])}")

    if "landOwner" in el:
        total += 1
        if profile.land_owner == el["landOwner"]:
            met.append("Land ownership ✓")
        else:
            missing.append(f"Land ownership: {'required' if el['landOwner'] else 'not required'}")

    if "studentStatus" in el:
        total += 1
        if profile.student_status == el["studentStatus"]:
            met.append("Student status ✓")
        else:
            missing.append(f"Must {'be' if el['studentStatus'] else 'not be'} a student")

    if total == 0:
        return {"category": "eligible", "score": 100, "met": ["Open to all citizens"], "missing": []}

    score = round((len(met) / total) * 100)
    category = "eligible" if score == 100 else "almost" if score >= 60 else "not_eligible"

    return {"category": category, "score": score, "met": met, "missing": missing}


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Root"])
def root():
    return {"message": "BharatAssist AI Backend is running", "version": "1.0.0"}


@app.get("/schemes", tags=["Schemes"])
def get_all_schemes():
    """Return all government schemes in the database."""
    return load_schemes()


@app.get("/schemes/{scheme_id}", tags=["Schemes"])
def get_scheme(scheme_id: str):
    """Get a specific scheme by ID."""
    schemes = load_schemes()
    scheme = next((s for s in schemes if s["id"] == scheme_id), None)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_id}' not found")
    return scheme


@app.post("/schemes/match", tags=["Schemes"])
def match_schemes(request: MatchRequest):
    """
    Match a user profile against all schemes.
    Returns eligible, almost-eligible, and not-eligible buckets.
    """
    schemes = load_schemes()
    profile = request.profile

    eligible = []
    almost = []
    not_eligible = []
    total_benefit = 0

    for scheme in schemes:
        result = match_scheme(scheme, profile)
        entry = {**scheme, "match": result}

        if result["category"] == "eligible":
            eligible.append(entry)
            total_benefit += scheme.get("benefitAmount", 0)
        elif result["category"] == "almost":
            almost.append(entry)
        else:
            not_eligible.append(entry)

    return {
        "eligible": sorted(eligible, key=lambda s: s["match"]["score"], reverse=True),
        "almost": sorted(almost, key=lambda s: s["match"]["score"], reverse=True),
        "not_eligible": not_eligible,
        "total_benefit": total_benefit,
        "summary": f"You are eligible for {len(eligible)} schemes worth ₹{total_benefit:,.0f} per year.",
    }


@app.post("/profile/extract", tags=["OCR / Profile"])
async def extract_profile(file: UploadFile = File(...)):
    """
    Extracts profile text from an uploaded ID or document using Pytesseract (Free OCR).
    """
    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content))
        
        # Configure tesseract path if on Windows (common default path)
        tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        if os.path.exists(tesseract_cmd):
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
            
        text = pytesseract.image_to_string(image)

        # Basic RegEx extraction heuristics
        name_match = re.search(r'(?i)name[:\s\n]*([A-Za-z\s]+)', text)
        dob_match = re.search(r'(?i)(?:dob|date of birth)[:\s\n]*(\d{2}[-/]\d{2}[-/]\d{4})', text)
        
        return {
            "extracted": True,
            "source": file.filename,
            "raw_text_Preview": text[:200] + "...",
            "profile": {
                "name": name_match.group(1).strip() if name_match else "Unknown",
                "dob": dob_match.group(1).strip() if dob_match else "Unknown",
                "state": "Maharashtra" if "Maharashtra" in text else "Unknown",
            },
            "note": "Text extracted successfully using free Pytesseract OCR.",
        }
    except Exception as e:
        return {
            "extracted": False,
            "error": str(e),
            "note": "Make sure Tesseract OCR is installed on your system (e.g. C:\Program Files\Tesseract-OCR).",
        }


@app.post("/voice/transcribe", tags=["Voice AI"])
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe spoken audio to text using Google's free SpeechRecognition API.
    """
    try:
        content = await file.read()
        audio_stream = io.BytesIO(content)
        
        # Free Google API needs WAV format, most web recordings are WebM/Ogg. 
        # Convert using pydub if needed, but for simplicity we assume wav here
        # or convert it on the fly.
        try:
             audio = AudioSegment.from_file(audio_stream)
             wav_io = io.BytesIO()
             audio.export(wav_io, format="wav")
             wav_io.seek(0)
             audio_stream = wav_io
        except Exception as converr:
             pass # hope it's already a wav file
        
        recognizer = sr.Recognizer()
        with sr.AudioFile(audio_stream) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data, language="hi-IN")
            
        return {
            "transcript": text,
            "language": "hi-IN",
            "confidence": 0.95,
            "note": "Transcribed using free SpeechRecognition (Google Free endpoint).",
        }
    except sr.UnknownValueError:
         return {"transcript": "", "error": "Speech not understood", "note": "Audio was too noisy or empty."}
    except Exception as e:
         return {"transcript": "", "error": str(e), "note": "Ensure FFmpeg is installed if audio conversion fails."}


@app.post("/voice/respond", tags=["Voice AI"])
async def ai_respond(request: VoiceRequest):
    """
    Generate an AI response using local Keyword heuristics (100% Free).
    Every message is first checked by the ML safety guard.
    """
    verdict = get_guard().check(request.text) if request.text.strip() else None
    if verdict and verdict["action"] == "block":
        return {"response": REFUSAL, "schemes_mentioned": [], "language": request.language,
                "safety": verdict, "note": "Blocked by the ML safety guard."}
    text = request.text.lower()

    if any(w in text for w in ["kisan", "farm", "kheti", "farmer", "agriculture"]):
        response = "🌾 PM-KISAN yojana ke tahat kisanon ko saal mein ₹6,000 milta hai. Sath hi, Kisan Credit Card se aap 4% byaj dar par ₹3 lakh tak ka loan le sakte hain."
        schemes_mentioned = ["pm-kisan", "kcc"]
    elif any(w in text for w in ["scholarship", "padhai", "student", "education", "school", "college"]):
        response = "🎓 Students ke liye National Scholarship Portal (NSP) par SC/ST/OBC aur minority chhatra ₹75,000 tak ki scholarship paa sakte hain."
        schemes_mentioned = ["scholarship"]
    elif any(w in text for w in ["health", "hospital", "bimar", "ayushman", "doctor", "medicine"]):
        response = "🏥 Ayushman Bharat PM-JAY ke tahat garib parivaron ko saal ka ₹5 lakh tak ka health insurance milta hai. Aap kisi bhi empanelled hospital mein ilaj kara sakte hain."
        schemes_mentioned = ["ayushman"]
    elif any(w in text for w in ["ghar", "house", "makan", "pmay", "awas"]):
        response = "🏠 Pradhan Mantri Awas Yojana (PMAY) ke zariye aapko ghar banane ke liye ₹1.2 lakh seedhi madad ya home loan par interest subsidy mil sakti hai."
        schemes_mentioned = ["pmay"]
    elif any(w in text for w in ["karigar", "artisan", "vishwakarma", "tailor", "carpenter"]):
        response = "🔨 PM Vishwakarma Yojana mein traditional karigaron ko skill training, ₹15,000 ka toolkit, aur bina guarantee ke ₹1 lakh tak ka loan milta hai."
        schemes_mentioned = ["vishwakarma"]
    else:
        response = "Namaste! Main BharatAssist AI hoon. Aap apni aayu, aay (income), ya kyon madad chahiye (kheti, padhai, swasthya) bata sakte hain."
        schemes_mentioned = []

    return {
        "response": response,
        "schemes_mentioned": schemes_mentioned,
        "language": request.language,
        "safety": verdict,
        "note": "Generated using free local Keyword Inference Engine.",
    }


@app.post("/form/generate", tags=["FormFriend AI"])
async def generate_form(request: FormRequest):
    """
    Generate a pre-filled PDF application using ReportLab (100% Free).
    """
    schemes = load_schemes()
    scheme = next((s for s in schemes if s["id"] == request.scheme_id), None)

    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    profile = request.profile
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer)
    
    # Simple PDF generation using reportlab
    c.setFont("Helvetica-Bold", 16)
    c.drawString(200, 800, "GOVERNMENT APPLICATION FORM")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, 750, f"Scheme: {scheme['name']}")
    c.drawString(50, 730, f"Ministry: {scheme['ministry']}")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 680, "Applicant Details:")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, 650, f"Name: {profile.name or 'N/A'}")
    c.drawString(50, 630, f"Age: {profile.age or 'N/A'}")
    c.drawString(50, 610, f"Gender: {profile.gender or 'N/A'}")
    c.drawString(50, 590, f"State: {profile.state or 'N/A'}")
    c.drawString(50, 570, f"Occupation: {profile.occupation or 'N/A'}")
    c.drawString(50, 550, f"Annual Income: Rs. {profile.income or 'N/A'}")
    c.drawString(50, 530, f"Category: {profile.category or 'General'}")
    
    c.drawString(50, 480, f"Application ID: LV{hash(str(profile)) % 100000000:08d}")
    c.drawString(50, 460, "Signature: _______________________")
    
    c.save()
    pdf_buffer.seek(0)
    
    # We return the file directly to the user
    return FileResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        filename=f"{request.scheme_id}_application.pdf"
    )


# ── ML safety guard (trained on the IndicGuard dataset, see ml/) ──────────────

REFUSAL = ("Maaf kijiye, main is request mein madad nahi kar sakta. Main sarkari yojanaon, "
           "eligibility aur documents ke baare mein bata sakta hoon.")


class ModerateRequest(BaseModel):
    text: str


@app.post("/moderate", tags=["ML Safety Guard"])
def moderate(request: ModerateRequest):
    """Detect the language of a message and classify it as allow / review / block."""
    if not request.text.strip():
        raise HTTPException(status_code=422, detail="Text is empty")
    return get_guard().check(request.text[:2000])


@app.post("/detect-language", tags=["ML Safety Guard"])
def detect_language(request: ModerateRequest):
    if not request.text.strip():
        raise HTTPException(status_code=422, detail="Text is empty")
    return {"language": get_guard().check(request.text[:2000])["language"]}


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "service": "BharatAssist AI Backend"}
