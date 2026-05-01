import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, LogOut, Trophy, Activity, Target, Clock } from "lucide-react";
import { Logo } from "../components/app/Logo";
import { getCurrentUser, initials, logout, type User } from "../lib/auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MindMock" },
      { name: "description", content: "Your personal interview practice dashboard." },
    ],
  }),
  component: Dashboard,
});

type LastSession = {
  date: string;
  questions: number;
  avgConfidence: number;
  avgStress: number;
  finalScore: number;
};

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [last, setLast] = useState<LastSession | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      navigate({ to: "/login" });
      return;
    }
    setUser(u);
    try {
      const raw = localStorage.getItem("mockint_last");
      if (raw) setLast(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [navigate]);

  if (!user) return null;

  const stats = [
    {
      icon: Trophy,
      label: "Final score",
      value: last ? `${last.finalScore}` : "—",
      hint: last ? "out of 100" : "Take your first interview",
    },
    {
      icon: Activity,
      label: "Avg confidence",
      value: last ? `${last.avgConfidence}%` : "—",
      hint: "Last session",
    },
    {
      icon: Target,
      label: "Avg stress",
      value: last ? `${last.avgStress}%` : "—",
      hint: "Lower is better",
    },
    {
      icon: Clock,
      label: "Questions answered",
      value: last ? `${last.questions}` : "0",
      hint: "Last session",
    },
  ];

  return (
    <div className="relative min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <button
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass mt-6 rounded-3xl p-8 md:p-10"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="grid h-16 w-16 place-items-center rounded-2xl btn-grad text-xl font-semibold">
                {initials(user.name) || "U"}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                <h1 className="text-3xl font-bold">
                  {user.name.split(" ")[0]} <span className="text-gradient">👋</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Link
              to="/interview"
              className="group inline-flex items-center justify-center gap-2 rounded-xl btn-grad px-6 py-3 text-sm font-medium"
            >
              Start interview
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="glass glass-hover rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <s.icon className="h-4 w-4 text-[color:var(--accent-2)]" />
              </div>
              <div className="mt-3 text-3xl font-bold">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>
            </div>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass mt-8 rounded-3xl p-8"
        >
          <h2 className="text-xl font-semibold">How it works</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              { n: "01", t: "Get a question", d: "Curated, role-appropriate prompts." },
              { n: "02", t: "Answer on camera", d: "Webcam + timer with live feedback." },
              { n: "03", t: "Read your report", d: "Confidence, stress, focus & HR feedback." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-gradient font-semibold">{s.n}</div>
                <div className="mt-2 font-semibold">{s.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
}