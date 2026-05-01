import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Home, Trophy, Activity, Target, Eye } from "lucide-react";
import { Logo } from "../components/app/Logo";
import { getCurrentUser } from "../lib/auth";
import type { AnswerResult } from "../lib/interview";
import { apiUrl } from "../lib/api";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Interview report — MindMock" },
      { name: "description", content: "Your personalized interview performance report." },
    ],
  }),
  component: Report,
});

function Report() {
  const navigate = useNavigate();
  const [results, setResults] = useState<AnswerResult[]>([]);

  useEffect(() => {
    if (!getCurrentUser()) {
      navigate({ to: "/login" });
      return;
    }
    try {
      const raw = localStorage.getItem("mockint_results");
      if (raw) {
        setResults(JSON.parse(raw));
        return;
      }
    } catch {
      // fall through to the backend cache
    }

    let cancelled = false;

    async function loadBackendResults() {
      try {
        const response = await fetch(apiUrl("/all-answers"));
        if (!response.ok) return;

        const payload = (await response.json()) as {
          answers?: Array<{
            question?: string;
            answer_text?: string;
            confidence_score?: number;
            stress_level?: number;
            eye_tracking?: { focus_score?: number };
            suggestions?: string;
          }>;
        };

        const mapped = (payload.answers || [])
          .map<AnswerResult | null>((answer) => {
            if (!answer.question) return null;
            return {
              question: answer.question,
              answer: answer.answer_text ?? "",
              confidence: answer.confidence_score ?? 50,
              stress: answer.stress_level ?? 50,
              focus: answer.eye_tracking?.focus_score ?? 50,
              feedback: answer.suggestions ?? "",
            };
          })
          .filter((answer): answer is AnswerResult => answer !== null);

        if (!cancelled && mapped.length > 0) {
          setResults(mapped.slice(-5));
        }
      } catch {
        // ignore backend load failures
      }
    }

    void loadBackendResults();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const summary = useMemo(() => {
    if (results.length === 0)
      return { avgConfidence: 0, avgStress: 0, avgFocus: 0, finalScore: 0 };
    const avg = (k: keyof AnswerResult) =>
      Math.round(results.reduce((s, r) => s + (r[k] as number), 0) / results.length);
    const avgConfidence = avg("confidence");
    const avgStress = avg("stress");
    const avgFocus = avg("focus");
    const finalScore = Math.max(
      0,
      Math.min(100, Math.round(avgConfidence * 0.5 + avgFocus * 0.35 + (100 - avgStress) * 0.15)),
    );
    return { avgConfidence, avgStress, avgFocus, finalScore };
  }, [results]);

  return (
    <div className="relative min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass mt-6 rounded-3xl p-8 md:p-10"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Final report
              </span>
              <h1 className="mt-2 text-4xl font-bold md:text-5xl">
                Score: <span className="text-gradient">{summary.finalScore}</span>
                <span className="text-muted-foreground text-2xl"> / 100</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Based on {results.length} answered question{results.length === 1 ? "" : "s"}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/interview"
                className="inline-flex items-center gap-2 rounded-xl btn-grad px-5 py-3 text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Restart interview
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <SummaryCard icon={Trophy} label="Final score" value={`${summary.finalScore}`} suffix="/100" />
          <SummaryCard icon={Activity} label="Avg confidence" value={`${summary.avgConfidence}`} suffix="%" />
          <SummaryCard icon={Target} label="Avg stress" value={`${summary.avgStress}`} suffix="%" tone="danger" />
          <SummaryCard icon={Eye} label="Avg focus" value={`${summary.avgFocus}`} suffix="%" />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 space-y-4"
        >
          <h2 className="text-xl font-semibold">Per-question breakdown</h2>
          {results.length === 0 && (
            <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">
              No results yet — take an interview to populate your report.
            </div>
          )}
          {results.map((r, i) => (
            <div key={i} className="glass glass-hover rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Question {i + 1}
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold">{r.question}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Bar label="Confidence" value={r.confidence} />
                <Bar label="Stress" value={r.stress} invert />
                <Bar label="Focus" value={r.focus} />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {r.feedback}
              </p>
            </div>
          ))}
        </motion.section>
      </main>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  suffix,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix?: string;
  tone?: "danger";
}) {
  return (
    <div className="glass glass-hover rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon
          className={`h-4 w-4 ${tone === "danger" ? "text-[oklch(0.7_0.2_25)]" : "text-[color:var(--accent-2)]"}`}
        />
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Bar({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const color = invert ? "oklch(0.65 0.24 25)" : "var(--primary)";
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-semibold" style={{ color }}>{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, var(--accent))` }}
        />
      </div>
    </div>
  );
}