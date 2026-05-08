from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
import uuid

from modules.speech_to_text import convert_audio_to_text
from modules.ollama_feedback import generate_ollama_feedback

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/")
def home():
    return {"message": "Backend running"}

# ---------------- AUTH ----------------
@app.post("/auth/login")
def login(email: str = Form(...), password: str = Form(...)):
    return {"user": {"email": email}}

@app.post("/auth/register")
def register(email: str = Form(...), password: str = Form(...)):
    return {"user": {"email": email}}

# ---------------- QUESTIONS ----------------
@app.get("/questions")
def get_questions():
    return {
        "questions": [
            "Tell me about yourself",
            "What are your strengths?",
            "What are your weaknesses?",
            "Where do you see yourself in 5 years?",
            "Why should we hire you?"
        ]
    }

# ---------------- HELPER: SMART SCORING ----------------
def calculate_scores(text: str):
    words = len(text.split())

    if words == 0:
        return 0, 100, 0

    # Better scoring logic
    if words < 5:
        confidence = 30
        stress = 70
        focus = 40
    elif words < 15:
        confidence = 60
        stress = 40
        focus = 65
    elif words < 30:
        confidence = 80
        stress = 25
        focus = 80
    else:
        confidence = 90
        stress = 15
        focus = 85

    return confidence, stress, focus

# ---------------- MAIN API ----------------
@app.post("/submit-answer")
async def submit_answer(
    file: UploadFile = File(...),
    question_index: int = Form(...)
):
    try:
        # Save file
        unique_name = f"{uuid.uuid4()}.webm"
        file_path = UPLOAD_DIR / unique_name

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Speech to text
        text = convert_audio_to_text(str(file_path)).strip()

        if not text:
            text = ""

        # Scores
        confidence, stress, focus = calculate_scores(text)

        # 🧠 BETTER PROMPT FOR OLLAMA
        prompt = f"""
        You are an interview evaluator.

        Question: Question {question_index}
        Answer: {text if text else "No answer provided"}

        Give:
        1. Short feedback (2-3 lines)
        2. 2 improvement suggestions
        3. Overall performance in one line
        """

        feedback = generate_ollama_feedback(prompt)

        return {
            "data": {
                "question": f"Question {question_index}",
                "answer_text": text if text else "Audio not clear",
                "confidence_score": confidence,
                "stress_level": stress,
                "eye_tracking": {
                    "focus_score": focus
                },
                "suggestions": feedback.strip() if feedback else "No feedback generated"
            }
        }

    except Exception as e:
        print("ERROR:", e)

        return {
            "data": {
                "question": "",
                "answer_text": "",
                "confidence_score": 0,
                "stress_level": 0,
                "eye_tracking": {"focus_score": 0},
                "suggestions": "Processing failed"
            }
        }