import requests

def _fallback_feedback(question: str, answer: str) -> str:
    answer = (answer or "").strip()
    word_count = len(answer.split())

    if not answer or answer.lower() == "audio not clear":
        return (
            "I could not clearly capture your spoken answer. Try speaking a little closer to the microphone "
            "and answer in 3-5 structured points.\n"
            "Suggestion: start with a direct sentence, then add one specific example."
        )

    if word_count < 12:
        return (
            "Your answer is understandable, but it is too brief for a strong interview response.\n"
            "Suggestion: add one concrete example and explain the impact or result."
        )

    if word_count < 35:
        return (
            "Good start: your response has enough detail to evaluate, but it can be more structured.\n"
            "Suggestion: use the STAR format and end with a clear takeaway connected to the role."
        )

    return (
        "Strong response length and detail. Keep the key points crisp so the interviewer can follow the main idea.\n"
        "Suggestion: close with a confident one-line summary of what this shows about you."
    )


def generate_ollama_feedback(question, answer=None):
    try:
        if answer is None:
            prompt = str(question)
            fallback_question = "Interview question"
            fallback_answer = ""
        else:
            fallback_question = str(question)
            fallback_answer = str(answer)
            prompt = f"""
You are a professional HR interviewer.

Question: {fallback_question}
Candidate Answer: {fallback_answer}

Give:
1. Short feedback
2. One strength
3. One improvement

Keep it concise and realistic.
"""

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            },
            timeout=30,
        )

        response.raise_for_status()
        feedback = response.json().get("response", "").strip()
        return feedback or _fallback_feedback(fallback_question, fallback_answer)

    except Exception as exc:
        print("Ollama feedback error:", exc)
        return _fallback_feedback(str(question), "" if answer is None else str(answer))
