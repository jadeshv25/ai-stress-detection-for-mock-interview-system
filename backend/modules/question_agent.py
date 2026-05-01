import json
import os

# Get path of questions.json
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUESTIONS_FILE = os.path.join(BASE_DIR, "questions.json")


# Load all questions
def load_questions():
    with open(QUESTIONS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


# Return all questions
def get_all_questions():
    return load_questions()


# Return one question by index
def get_question_by_index(index: int):
    questions = load_questions()

    if 0 <= index < len(questions):
        return questions[index]

    return None