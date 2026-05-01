from typing import Any, cast

import cv2


def analyze_face(video_path):
    cap = cv2.VideoCapture(video_path)

    cv2_data = cast(Any, cv2).data
    face_cascade = cv2.CascadeClassifier(
        cv2_data.haarcascades + 'haarcascade_frontalface_default.xml'
    )

    face_count = 0
    frames_checked = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frames_checked += 1

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)

        if len(faces) > 0:
            face_count += 1

        # limit frames (for speed)
        if frames_checked > 30:
            break

    cap.release()

    confidence_score = int((face_count / max(frames_checked, 1)) * 100)

    return {
        "face_detected_frames": face_count,
        "confidence_score": confidence_score
    }