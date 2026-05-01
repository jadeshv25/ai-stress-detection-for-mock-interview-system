export const QUESTIONS = [
  "Tell me about yourself and what brought you to this role.",
  "Describe a challenging project you led. What made it hard, and how did you handle it?",
  "How do you handle disagreement with a teammate or manager?",
  "Tell me about a time you failed. What did you learn?",
  "Where do you see yourself in three to five years, and how does this role fit?",
];

export type AnswerResult = {
  question: string;
  answer: string;
  confidence: number;
  stress: number;
  focus: number;
  feedback: string;
};

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

export function scoreAnswer(question: string, answer: string): AnswerResult {
  const len = answer.trim().length;
  const base = Math.min(95, 55 + Math.floor(len / 10));
  const confidence = Math.max(40, Math.min(96, base + rand(-8, 8)));
  const stress = Math.max(8, Math.min(80, 100 - confidence + rand(-10, 10)));
  const focus = Math.max(45, Math.min(98, confidence + rand(-6, 6)));

  const feedback = buildFeedback(confidence, stress, focus, len);
  return {
    question,
    answer: answer.trim() || "(no spoken answer captured)",
    confidence,
    stress,
    focus,
    feedback,
  };
}

function buildFeedback(c: number, s: number, f: number, len: number) {
  const parts: string[] = [];
  if (c >= 80) parts.push("Your delivery came across as confident and self-assured.");
  else if (c >= 65) parts.push("Your answer landed with steady confidence, with room to push further.");
  else parts.push("Your confidence wavered at moments — slow down and lean into specifics.");

  if (s <= 30) parts.push("You stayed calm and composed throughout — excellent under pressure.");
  else if (s <= 55) parts.push("Mild signs of stress were detected; pacing and breathing can smooth this out.");
  else parts.push("Elevated stress signals were observed; a brief pause before answering can help.");

  if (f >= 80) parts.push("Your focus on the question was strong with minimal drift.");
  else parts.push("Focus could be sharper — anchor each sentence back to the question asked.");

  if (len < 80) parts.push("Consider expanding with a concrete example using the STAR framework.");
  return parts.join(" ");
}

export function pickRandomQuestions(n = 5) {
  return pickRandomQuestionsFrom(QUESTIONS, n);
}

export function pickRandomQuestionsFrom(source: string[], n = 5) {
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}