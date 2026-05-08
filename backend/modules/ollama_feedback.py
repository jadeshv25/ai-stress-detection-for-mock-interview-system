import requests

def generate_ollama_feedback(question, answer):
    try:
        prompt = f"""
You are a professional HR interviewer.

Question: {question}
Candidate Answer: {answer}

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
            }
        )

        return response.json().get("response", "No feedback")

    except Exception:
        return "Feedback failed"