from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from modules.question_agent import get_all_questions, get_question_by_index
from models.answer_store import answers_db
from modules.nlp_analysis import analyze_text
from modules.scoring import calculate_final_score
from modules.speech_to_text import convert_audio_to_text
from modules.face_emotion import analyze_face
from modules.voice_analysis import analyze_voice
from modules.eye_tracking import analyze_eye
from modules.gpt_feedback import generate_gpt_feedback

import os

router = APIRouter()

class AnswerRequest(BaseModel):
    question_index: int
    answer: str


# ------------------ QUESTIONS ------------------

@router.get("/questions")
def fetch_questions():
    questions = get_all_questions()
    return {
        "total_questions": len(questions),
        "questions": questions
    }


@router.get("/question/{index}")
def fetch_question(index: int):
    question = get_question_by_index(index)

    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")

    return {
        "question_number": index + 1,
        "question": question
    }


# ------------------ SUBMIT ANSWER ------------------

@router.post("/submit-answer")
async def submit_answer(
    question_index: int = Form(...),
    file: UploadFile = File(...)
):

    question = get_question_by_index(question_index)

    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")

    # Save file
    content = await file.read()
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as f:
        f.write(content)

    # Speech to text
    answer_text = convert_audio_to_text(file_path)

    # NLP
    nlp_result = analyze_text(answer_text)
    final_score = calculate_final_score(nlp_result["nlp_score"])

    # Face, Voice, Eye
    face_result = analyze_face(file_path)
    voice_result = analyze_voice(file_path)
    eye_result = analyze_eye(file_path)

    # Final metrics
    confidence_score = int((
        face_result.get("confidence_score", 50) +
        voice_result.get("confidence_score", 50) +
        nlp_result.get("nlp_score", 50)
    ) / 3)

    stress_level = 100 - confidence_score

    # 🔥 GPT FEEDBACK (MAIN CHANGE)
    suggestions = generate_gpt_feedback(
        question=question,
        answer_text=answer_text,
        confidence_score=confidence_score,
        stress_level=stress_level,
        focus_score=eye_result.get("focus_score", 50)
    )

    # Store record
    record = {
        "question_index": question_index,
        "question": question,
        "answer_text": answer_text,
        "file_path": file_path,
        "face_analysis": face_result,
        "voice_analysis": voice_result,
        "eye_tracking": eye_result,
        "nlp_result": nlp_result,
        "confidence_score": confidence_score,
        "stress_level": stress_level,
        "final_score": final_score,
        "suggestions": suggestions
    }

    answers_db.append(record)

    return {
        "message": "Interview processed successfully",
        "data": record
    }


# ------------------ VIEW ANSWERS ------------------

@router.get("/all-answers")
def get_all_answers():
    return {
        "total_answers": len(answers_db),
        "answers": answers_db
    }