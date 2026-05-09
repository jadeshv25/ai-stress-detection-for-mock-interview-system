from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
import uuid

from modules.speech_to_text import convert_audio_to_text
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

QUESTIONS = [
    "Tell me about yourself",
    "What are your strengths?",
    "What are your weaknesses?",
    "Where do you see yourself in 5 years?",
    "Why should we hire you?",
]

answers_db = []


@app.get("/")
def home():
    return {"message": "Backend running"}


@app.post("/auth/login")
def login(email: str = Form(...), password: str = Form(...)):
    return {"user": {"email": email}}


@app.post("/auth/register")
def register(email: str = Form(...), password: str = Form(...)):
    return {"user": {"email": email}}


@app.get("/questions")
def get_questions():
    return {"questions": QUESTIONS}


def calculate_scores(text: str):
    words = len(text.split())

    if words == 0:
        return 0, 100, 0

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


def generate_performance_feedback(
    answer_text: str,
    confidence_score: int,
    stress_level: int,
    focus_score: int,
) -> str:
    words = len(answer_text.split())
    feedback = []
    suggestions = []

    if words == 0:
        feedback.append("Your answer could not be captured clearly, so the response was difficult to evaluate.")
        suggestions.append("Speak closer to the microphone and give a complete answer in 3-5 clear sentences.")
    elif words < 12:
        feedback.append("Your answer was understandable, but it was too short for a strong interview response.")
        suggestions.append("Add one specific example and explain the result or impact.")
    elif words < 30:
        feedback.append("Your answer had a good start and enough detail to evaluate.")
        suggestions.append("Use a clearer structure such as situation, action, and result.")
    else:
        feedback.append("Your answer had solid detail and showed good effort.")
        suggestions.append("Keep the response focused and finish with a confident one-line takeaway.")

    if confidence_score >= 80:
        feedback.append("Your confidence level looked strong.")
    elif confidence_score >= 55:
        feedback.append("Your confidence was moderate, with room to sound more assured.")
        suggestions.append("Begin with a direct opening sentence before adding details.")
    else:
        feedback.append("Your confidence score was low for this answer.")
        suggestions.append("Practice the answer once before recording to reduce hesitation.")

    if stress_level >= 65:
        feedback.append("Stress indicators were high.")
        suggestions.append("Pause briefly, slow your pace, and take a breath before answering.")
    elif stress_level <= 30:
        feedback.append("Your stress level stayed controlled.")

    if focus_score >= 75:
        feedback.append("Your focus score was good.")
    elif focus_score >= 45:
        feedback.append("Your focus was acceptable but can improve.")
        suggestions.append("Maintain steady eye contact with the camera.")
    else:
        feedback.append("Your focus score was low.")
        suggestions.append("Look toward the camera and avoid distractions while answering.")

    unique_suggestions = []
    for suggestion in suggestions:
        if suggestion not in unique_suggestions:
            unique_suggestions.append(suggestion)

    return (
        "Feedback: " + " ".join(feedback) + "\n"
        "Suggestions: " + " ".join(unique_suggestions[:3])
    )


@app.post("/submit-answer")
async def submit_answer(
    file: UploadFile = File(...),
    question_index: int = Form(...),
):
    try:
        question = (
            QUESTIONS[question_index]
            if 0 <= question_index < len(QUESTIONS)
            else f"Question {question_index + 1}"
        )

        unique_name = f"{uuid.uuid4()}.webm"
        file_path = UPLOAD_DIR / unique_name

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        text = convert_audio_to_text(str(file_path)).strip()

        if not text or text.lower() == "audio not clear":
            text = ""

        confidence, stress, focus = calculate_scores(text)
        feedback = generate_performance_feedback(text, confidence, stress, focus)

        record = {
            "question_index": question_index,
            "question": question,
            "answer_text": text if text else "Audio not clear",
            "confidence_score": confidence,
            "stress_level": stress,
            "eye_tracking": {
                "focus_score": focus,
            },
            "suggestions": feedback.strip() if feedback else "No feedback generated",
        }

        answers_db.append(record)

        return {"data": record}

    except Exception as e:
        print("ERROR:", e)

        return {
            "data": {
                "question": "",
                "answer_text": "",
                "confidence_score": 0,
                "stress_level": 0,
                "eye_tracking": {"focus_score": 0},
                "suggestions": "Processing failed",
            }
        }


@app.get("/all-answers")
def get_all_answers():
    return {
        "total_answers": len(answers_db),
        "answers": answers_db,
    }
