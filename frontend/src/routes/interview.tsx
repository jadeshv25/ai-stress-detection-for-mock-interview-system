import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  CameraOff,
  CheckCircle2,
  Loader2,
  Mic,
  Square,
  StopCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "../components/app/Logo";
import { getCurrentUser } from "../lib/auth";
import { apiUrl } from "../lib/api";
import {
  QUESTIONS,
  pickRandomQuestionsFrom,
  type AnswerResult,
} from "../lib/interview";

export const Route = createFileRoute("/interview")({
  head: () => ({
    meta: [
      { title: "Interview — MindMock" },
      {
        name: "description",
        content: "Live AI mock interview with stress and focus detection.",
      },
    ],
  }),
  component: Interview,
});

type Status = "idle" | "waiting" | "recording" | "processing" | "result";

const QUESTION_SECONDS = 60;

function Interview() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<string[]>(() => QUESTIONS.slice(0, 5));
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("waiting");
  const [seconds, setSeconds] = useState(QUESTION_SECONDS);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [currentResult, setCurrentResult] = useState<AnswerResult | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopAtRef = useRef<number>(QUESTION_SECONDS);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      try {
        const response = await fetch(apiUrl("/questions"));
        if (!response.ok) {
          throw new Error(`Failed to load questions (${response.status})`);
        }

        const payload = (await response.json()) as { questions?: unknown };
        const backendQuestions = Array.isArray(payload.questions)
          ? payload.questions.filter((question): question is string => typeof question === "string")
          : [];

        if (!cancelled && backendQuestions.length > 0) {
          setQuestions(pickRandomQuestionsFrom(backendQuestions, 5));
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(
            error instanceof Error
              ? error.message
              : "Could not load questions from backend.",
          );
          setQuestions([]);
        }
      }
    }

    void loadQuestions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!getCurrentUser()) navigate({ to: "/login" });
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    async function startDevices() {
      try {
        const previewStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });

        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        if (cancelled) {
          previewStream.getTracks().forEach((track) => track.stop());
          audioStream.getTracks().forEach((track) => track.stop());
          return;
        }

        previewStreamRef.current = previewStream;
        audioStreamRef.current = audioStream;

        if (videoRef.current) {
          videoRef.current.srcObject = previewStream;
          await videoRef.current.play().catch(() => {});
        }

        setCamOn(true);
        setCamError(null);
      } catch (error) {
        setCamOn(false);
        setCamError(
          error instanceof Error
            ? `Camera/microphone access failed: ${error.message}`
            : "Camera and microphone access are required to submit answers to the backend.",
        );
      }
    }

    void startDevices();

    return () => {
      cancelled = true;

      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }

      recorderRef.current = null;

      previewStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());

      previewStreamRef.current = null;
      audioStreamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (status !== "recording") return;

    timerRef.current = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          stopRecording();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [status]);

  function getSupportedAudioMimeType(): string {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "",
    ];

    for (const type of candidates) {
      if (!type || MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "";
  }

  function startRecording() {
    if (!audioStreamRef.current) {
      setApiError("Microphone access is required to record your answer.");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setApiError("Your browser does not support media recording.");
      return;
    }

    if (questions.length === 0) {
      setApiError("Questions are not available. Please start the backend and reload.");
      return;
    }

    const audioTracks = audioStreamRef.current.getAudioTracks();
    if (audioTracks.length === 0) {
      setApiError("No microphone audio track detected.");
      return;
    }

    chunksRef.current = [];
    setApiError(null);
    setCurrentResult(null);
    setSeconds(QUESTION_SECONDS);
    stopAtRef.current = QUESTION_SECONDS;
    setStatus("recording");

    const mimeType = getSupportedAudioMimeType();
    const recorder = mimeType
      ? new MediaRecorder(audioStreamRef.current, { mimeType })
      : new MediaRecorder(audioStreamRef.current);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blobType =
        recorder.mimeType ||
        (mimeType.startsWith("audio/") ? mimeType : "audio/webm");
      const blob = new Blob(chunksRef.current, { type: blobType });

      chunksRef.current = [];

      if (blob.size === 0) {
        setApiError("Recorded audio was empty. Please allow microphone access and try again.");
        setStatus("waiting");
        return;
      }

      void submitRecordedAnswer(blob);
    };

    recorderRef.current = recorder;
    recorder.start(250);
  }

  function stopRecording() {
    if (status !== "recording") return;

    stopAtRef.current = seconds;
    setStatus("processing");

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
  }

  async function submitRecordedAnswer(blob: Blob) {
    try {
      const extension =
        blob.type.includes("mp4") ? "m4a" : blob.type.includes("webm") ? "webm" : "webm";

      const formData = new FormData();
      formData.append("question_index", String(index));
      formData.append(
        "file",
        new File([blob], `answer-${index + 1}.${extension}`, {
          type: blob.type || "audio/webm",
        }),
      );

      const response = await fetch(apiUrl("/submit-answer"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Backend rejected the answer (${response.status})`);
      }

      const payload = (await response.json()) as {
        data?: {
          question?: string;
          answer_text?: string;
          confidence_score?: number;
          stress_level?: number;
          eye_tracking?: { focus_score?: number };
          suggestions?: string;
        };
      };

      const record = payload.data;
      if (!record) {
        throw new Error("Backend response was missing analysis data");
      }

      const result: AnswerResult = {
        question: record.question ?? questions[index],
        answer: record.answer_text ?? "",
        confidence: record.confidence_score ?? 0,
        stress: record.stress_level ?? 0,
        focus: record.eye_tracking?.focus_score ?? 0,
        feedback: record.suggestions ?? "No feedback received from backend.",
      };

      setApiError(null);
      setCurrentResult(result);
      setResults((previous) => {
        const next = [...previous, result];
        persistSession(next);
        return next;
      });
      setStatus("result");
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Could not reach the backend. Please start the backend server.",
      );
      setCurrentResult(null);
      setStatus("waiting");
    }
  }

  function nextQuestion() {
    if (index + 1 >= questions.length) {
      finishInterview(results);
      return;
    }

    setIndex((current) => current + 1);
    setCurrentResult(null);
    setSeconds(QUESTION_SECONDS);
    setStatus("waiting");
    setApiError(null);
  }

  function persistSession(rs: AnswerResult[], finalScoreOverride?: number) {
    const summary = summarize(rs);
    const finalScore = finalScoreOverride ?? summary.finalScore;

    localStorage.setItem(
      "mockint_last",
      JSON.stringify({
        date: new Date().toISOString(),
        questions: rs.length,
        avgConfidence: summary.avgConfidence,
        avgStress: summary.avgStress,
        finalScore,
      }),
    );
    localStorage.setItem("mockint_results", JSON.stringify(rs));
  }

  function finishInterview(rs: AnswerResult[]) {
    const summary = summarize(rs);
    persistSession(rs, summary.finalScore);
    navigate({ to: "/report" });
  }

  const statusLabel: Record<Status, string> = {
    idle: "Idle",
    waiting: "Waiting",
    recording: "Recording",
    processing: "Processing",
    result: "Ready",
  };

  return (
    <div className="relative min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <button
          onClick={() => finishInterview(results)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
        >
          <StopCircle className="h-4 w-4" />
          End interview
        </button>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 pb-16 lg:grid-cols-[1.1fr_1fr]">
        <section className="glass rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "recording"
                    ? "bg-red-500 animate-pulse"
                    : status === "processing"
                      ? "bg-amber-400 animate-pulse"
                      : status === "result"
                        ? "bg-emerald-400"
                        : "bg-muted-foreground"
                }`}
              />
              Status: <span className="text-foreground">{statusLabel[status]}</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-mono text-sm">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </div>
          </div>

          <div className="relative mt-5 aspect-video overflow-hidden rounded-2xl bg-black/60 glow-ring">
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
            {!camOn && (
              <div className="absolute inset-0 grid place-items-center text-center text-sm text-muted-foreground">
                <div>
                  <CameraOff className="mx-auto h-8 w-8" />
                  <p className="mt-2 px-6">{camError ?? "Requesting camera…"}</p>
                </div>
              </div>
            )}
            {status === "recording" && (
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white">
                <span className="pulse-ring h-2 w-2 rounded-full bg-white" />
                REC
              </div>
            )}
            {camOn && (
              <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/90 backdrop-blur">
                <Camera className="h-3.5 w-3.5" />
                Live
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={startRecording}
              disabled={
                status === "recording" ||
                status === "processing" ||
                status === "result" ||
                questions.length === 0
              }
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white transition disabled:opacity-50"
              style={{
                background: "linear-gradient(120deg, oklch(0.6 0.18 150), oklch(0.7 0.2 160))",
                boxShadow: "0 10px 30px -10px oklch(0.7 0.2 160 / 0.7)",
              }}
            >
              <Mic className="h-4 w-4" />
              Start recording
            </button>
            <button
              onClick={stopRecording}
              disabled={status !== "recording"}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white transition disabled:opacity-50"
              style={{
                background: "linear-gradient(120deg, oklch(0.6 0.22 25), oklch(0.65 0.24 25))",
                boxShadow: "0 10px 30px -10px oklch(0.65 0.24 25 / 0.7)",
              }}
            >
              <Square className="h-4 w-4" />
              Stop recording
            </button>
          </div>

          {apiError && (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {apiError}
            </div>
          )}
        </section>

        <section className="glass rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Question {questions.length > 0 ? index + 1 : 0} of {questions.length}
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width:
                    questions.length > 0
                      ? `${((index + (status === "result" ? 1 : 0)) / questions.length) * 100}%`
                      : "0%",
                  background: "linear-gradient(90deg, var(--primary), var(--accent))",
                }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.h2
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="mt-4 text-2xl font-semibold leading-snug md:text-3xl"
            >
              {questions.length > 0 ? questions[index] : "Backend questions are not available"}
            </motion.h2>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {status === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-8 flex items-center gap-3 text-sm text-muted-foreground"
              >
                <Loader2 className="h-5 w-5 animate-spin text-[color:var(--accent-2)]" />
                Sending your answer to the backend for analysis…
              </motion.div>
            )}

            {status === "result" && currentResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-6 space-y-4"
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Captured answer
                  </div>
                  <p className="text-foreground/90">{currentResult.answer}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric label="Confidence" value={currentResult.confidence} tone="primary" />
                  <Metric label="Stress" value={currentResult.stress} tone="danger" invert />
                  <Metric label="Focus" value={currentResult.focus} tone="accent" />
                </div>

                <div
                  className="rounded-2xl border p-5"
                  style={{
                    borderColor: "color-mix(in oklab, var(--primary) 35%, transparent)",
                    background:
                      "linear-gradient(135deg, color-mix(in oklab, var(--primary) 10%, transparent), color-mix(in oklab, var(--accent) 10%, transparent))",
                  }}
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gradient">
                    HR-style feedback
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {currentResult.feedback}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={nextQuestion}
                    className="inline-flex items-center gap-2 rounded-xl btn-grad px-5 py-3 text-sm font-medium"
                  >
                    {index + 1 >= questions.length ? "See report" : "Next question"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => finishInterview(results)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium hover:bg-white/10"
                  >
                    <StopCircle className="h-4 w-4" />
                    End interview
                  </button>
                </div>
              </motion.div>
            )}

            {status === "waiting" && (
              <motion.p
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-8 text-sm text-muted-foreground"
              >
                When you&apos;re ready, press <span className="text-foreground">Start recording</span>. You
                have up to {QUESTION_SECONDS} seconds.
              </motion.p>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
  invert = false,
}: {
  label: string;
  value: number;
  tone: "primary" | "danger" | "accent";
  invert?: boolean;
}) {
  const color =
    tone === "primary"
      ? "var(--primary)"
      : tone === "accent"
        ? "var(--accent-2)"
        : "oklch(0.65 0.24 25)";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            background: invert
              ? `linear-gradient(90deg, oklch(0.7 0.2 160), ${color})`
              : `linear-gradient(90deg, ${color}, var(--accent))`,
          }}
        />
      </div>
    </div>
  );
}

function summarize(rs: AnswerResult[]) {
  if (rs.length === 0) {
    return { avgConfidence: 0, avgStress: 0, avgFocus: 0, finalScore: 0 };
  }

  const avg = (k: keyof AnswerResult) =>
    Math.round(rs.reduce((sum, result) => sum + (result[k] as number), 0) / rs.length);

  const avgConfidence = avg("confidence");
  const avgStress = avg("stress");
  const avgFocus = avg("focus");
  const finalScore = Math.max(
    0,
    Math.min(100, Math.round(avgConfidence * 0.5 + avgFocus * 0.35 + (100 - avgStress) * 0.15)),
  );

  return { avgConfidence, avgStress, avgFocus, finalScore };
}