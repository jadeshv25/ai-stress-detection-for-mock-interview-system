import { Brain } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  return (
    <div className="flex items-center gap-3">
      <div
        className={`${dims} grid place-items-center rounded-xl btn-grad`}
        style={{ boxShadow: "0 8px 24px -6px color-mix(in oklab, var(--primary) 60%, transparent)" }}
      >
        <Brain className="h-5 w-5" />
      </div>
      <div className={`font-display font-semibold tracking-tight ${text}`} style={{ fontFamily: "var(--font-display)" }}>
        Mind<span className="text-gradient">Mock</span>
      </div>
    </div>
  );
}