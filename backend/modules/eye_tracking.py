from typing import Any, cast

import cv2
import mediapipe as mp

def analyze_eye(file_path):
    cap = cv2.VideoCapture(file_path)

    try:
        mp_solutions = cast(Any, mp).solutions
        mp_face_mesh = mp_solutions.face_mesh
        face_mesh = mp_face_mesh.FaceMesh()
    except:
        return {"focus_score": 50}

    eye_contact_frames = 0
    total_frames = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        total_frames += 1

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb)

        if results.multi_face_landmarks:
            eye_contact_frames += 1

        if total_frames > 30:
            break

    cap.release()

    focus_score = int((eye_contact_frames / max(total_frames, 1)) * 100)

    return {
        "focus_score": focus_score
    }