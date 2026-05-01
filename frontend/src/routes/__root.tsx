import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AnimatedBackground } from "../components/app/AnimatedBackground";

function NotFoundComponent() {
  return (
    <>
      <AnimatedBackground />
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass max-w-md rounded-2xl p-10 text-center">
          <h1 className="text-7xl font-bold text-gradient">404</h1>
          <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg btn-grad px-5 py-2.5 text-sm font-medium"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MindMock — AI Mock Interview & Stress Detection" },
      { name: "description", content: "Practice interviews with an AI that scores your confidence, stress, and focus in real time." },
      { name: "author", content: "MindMock" },
      { property: "og:title", content: "MindMock — AI Mock Interview & Stress Detection" },
      { property: "og:description", content: "Practice interviews with an AI that scores your confidence, stress, and focus in real time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@MindMock" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <AnimatedBackground />
      <Outlet />
    </>
  );
}
