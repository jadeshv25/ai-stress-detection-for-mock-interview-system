const DEFAULT_API_BASE = "http://localhost:8000";

export function getApiBaseUrl() {
  return (import.meta.env.VITE_BACKEND_URL as string | undefined) || DEFAULT_API_BASE;
}

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}