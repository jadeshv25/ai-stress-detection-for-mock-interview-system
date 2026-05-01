def generate_hr_feedback(confidence_score, stress_level, eye_result, voice_result, answer_text):
    feedback = ""

    if confidence_score > 75:
        feedback += "You demonstrated strong confidence while answering. "
    elif confidence_score > 50:
        feedback += "Your response shows moderate confidence, but there is room for improvement. "
    else:
        feedback += "Your answer indicates low confidence. You should work on speaking assertively. "

    if stress_level > 70:
        feedback += "You appeared quite stressed during the response. Try to stay calm and composed. "
    elif stress_level > 40:
        feedback += "There are signs of slight nervousness. Practice relaxation techniques before answering. "
    else:
        feedback += "You maintained a calm and composed demeanor. "

    focus = eye_result.get("focus_score", 50)
    if focus < 40:
        feedback += "Your eye contact was limited. Try to look directly at the camera while answering. "
    elif focus < 70:
        feedback += "Your eye contact was decent but could be improved. "
    else:
        feedback += "You maintained good eye contact. "

    if voice_result.get("confidence_score", 50) < 50:
        feedback += "Your voice lacked clarity at times. Try to speak clearly. "
    else:
        feedback += "Your voice was clear and understandable. "

    if len(answer_text.split()) < 5:
        feedback += "Your answer was too short. Try to elaborate more. "
    else:
        feedback += "Your answer had decent content, but structuring it better will improve impact. "

    return feedback