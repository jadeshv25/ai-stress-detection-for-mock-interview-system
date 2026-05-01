import { apiUrl } from "./api";

export type User = { name: string; email: string };

const KEY = "mockint_user";
const USERS_KEY = "mockint_users";

type StoredUser = User & { password: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function login(email: string, password: string): User {
  throw new Error("login() is now async; call loginUser() instead");
}

export async function loginUser(email: string, password: string): Promise<User> {
  const normalizedEmail = normalizeEmail(email);

  const localUser = readUsers().find((user) => user.email === normalizedEmail && user.password === password);
  if (localUser) {
    const user: User = { name: localUser.name, email: localUser.email };
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  }

  try {
    const response = await fetch(apiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    const payload = (await response.json()) as Partial<User> & { detail?: string };

    if (!response.ok) {
      throw new Error(payload.detail || "Invalid email or password");
    }

    const user = payload as User;
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  } catch {
    const users = readUsers();
    const found = users.find((u) => u.email === normalizedEmail && u.password === password);
    if (!found) throw new Error("Invalid email or password");
    const user: User = { name: found.name, email: found.email };
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  }
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const normalizedEmail = normalizeEmail(email);

  try {
    const response = await fetch(apiUrl("/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password }),
    });

    const payload = (await response.json()) as Partial<User> & { detail?: string };

    if (!response.ok) {
      throw new Error(payload.detail || "Registration failed");
    }

    const user = payload as User;
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  } catch {
    const users = readUsers();
    if (users.some((u) => u.email === normalizedEmail)) {
      throw new Error("An account with this email already exists");
    }
    users.push({ name: name.trim(), email: normalizedEmail, password });
    writeUsers(users);
    const user: User = { name: name.trim(), email: normalizedEmail };
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  }
}

export function logout() {
  localStorage.removeItem(KEY);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}