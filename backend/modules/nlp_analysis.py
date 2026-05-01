from typing import Any, cast
from functools import lru_cache
import language_tool_python

@lru_cache(maxsize=1)
def _get_grammar_tool():
    try:
        return language_tool_python.LanguageTool("en-US")
    except Exception:
        return None


@lru_cache(maxsize=1)
def _get_sentiment_pipeline():
    from transformers import pipeline as hf_pipeline
    pipeline_fn = cast(Any, hf_pipeline)
    return pipeline_fn("sentiment-analysis")


def analyze_text(answer: str):
    if not answer or not answer.strip():
        return {
            "nlp_score": 40,
            "clarity": "needs improvement",
            "grammar_errors": 5
        }

    # ---------------- SENTIMENT ----------------
    try:
        nlp_model = _get_sentiment_pipeline()
        result = nlp_model(answer)

        label = result[0]["label"]
        score = result[0]["score"]
    except Exception:
        score = 0.5
        label = "POSITIVE" if len(answer.split()) >= 12 else "NEGATIVE"

    # ---------------- LENGTH ----------------
    words = answer.split()
    length_score = 0

    if len(words) > 5:
        length_score += 10
    if len(words) > 15:
        length_score += 15

    # ---------------- KEYWORDS ----------------
    keywords = ["project", "team", "experience", "learn", "develop"]
    keyword_score = sum(5 for k in keywords if k in answer.lower())

    # ---------------- GRAMMAR ----------------
    tool = _get_grammar_tool()
    if tool is None:
        grammar_errors = 3
    else:
        try:
            matches = tool.check(answer)
            grammar_errors = len(matches)
        except Exception:
            grammar_errors = 3

    grammar_score = max(0, 100 - grammar_errors * 5)

    # ---------------- FINAL SCORE ----------------
    if label == "POSITIVE":
        base_score = 60 + int(score * 30)
        clarity = "good"
    else:
        base_score = 40 + int(score * 20)
        clarity = "needs improvement"

    final_nlp_score = int(
        (base_score + length_score + keyword_score + grammar_score) / 4
    )

    final_nlp_score = min(100, final_nlp_score)

    return {
        "nlp_score": final_nlp_score,
        "clarity": clarity,
        "grammar_errors": grammar_errors,
        "length": len(words)
    }