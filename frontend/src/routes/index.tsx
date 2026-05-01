import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Activity, Brain, Eye } from "lucide-react";
import { Logo } from "../components/app/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MindMock — Master Your Next Interview" },
      {
        name: "description",
        content:
          "AI-powered mock interviews with real-time stress, focus, and confidence detection.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg btn-grad px-4 py-2 text-sm font-medium"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-12 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent-2)]" />
            Now with live emotion analysis
          </span>
          <h1 className="mt-6 text-5xl font-bold leading-[1.05] md:text-7xl">
            Train smarter. <br />
            <span className="text-gradient">Interview fearless.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            MindMock simulates real interviews and analyzes your confidence,
            stress, and focus in real time — so you walk in ready.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-xl btn-grad px-6 py-3 text-sm font-medium"
            >
              Start free
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium hover:bg-white/10"
            >
              I have an account
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-20 grid max-w-5xl gap-5 md:grid-cols-3"
        >
          {[
            {
              icon: Brain,
              title: "AI question engine",
              desc: "Tailored questions across roles, with adaptive difficulty.",
            },
            {
              icon: Activity,
              title: "Stress & confidence",
              desc: "Live signals scored from voice, pace, and micro-expressions.",
            },
            {
              icon: Eye,
              title: "Focus tracking",
              desc: "Eye-contact and attention insights with HR-style feedback.",
            },
          ].map((f) => (
            <div key={f.title} className="glass glass-hover rounded-2xl p-6">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg btn-grad">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
