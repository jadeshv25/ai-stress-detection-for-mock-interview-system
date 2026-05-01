export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full opacity-40 animate-blob"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, var(--primary), transparent 60%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full opacity-35 animate-blob"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, var(--accent), transparent 60%)",
          filter: "blur(70px)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="absolute bottom-[-12rem] left-1/4 h-[34rem] w-[34rem] rounded-full opacity-25 animate-blob"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, var(--accent-2), transparent 60%)",
          filter: "blur(80px)",
          animationDelay: "-12s",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
    </div>
  );
}