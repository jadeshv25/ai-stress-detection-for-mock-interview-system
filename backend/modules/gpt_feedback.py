import os
from openai import OpenAI



def _get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)

def generate_gpt_feedback(question, answer_text, confidence_score, stress_level, focus_score):
    try:
        client = _get_client()
        if client is None:
            return "Good attempt. Try to improve clarity, confidence, and provide more detailed answers."

        prompt = f"""
You are an HR interviewer.

Give professional, human-like, constructive interview feedback.

Question:
{question}

Candidate Answer:
{answer_text}

Scores:
Confidence: {confidence_score}
Stress: {stress_level}
Focus: {focus_score}

Instructions:
- Write one professional paragraph
- Mention strengths
- Mention improvements
- If answer is short, say elaborate more
- If stress is high, suggest calm delivery
- If confidence is low, suggest confidence improvement
- Keep under 120 words
"""

        response = client.responses.create(
            model="gpt-5.4",
            input=prompt
        )

        return response.output_text.strip()

    except Exception as e:
        print("GPT Error:", e)
        return "Good attempt. Try to improve clarity, confidence, and provide more detailed answers."