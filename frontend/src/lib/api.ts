const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const ACCESS_KEY = "utg_access";
const REFRESH_KEY = "utg_refresh";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const tokens = {
  get access() {
    return typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

async function refreshAccess(): Promise<boolean> {
  const refresh = tokens.refresh;
  if (!refresh) return false;
  const res = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  tokens.set(data.access, data.refresh);
  return true;
}

async function request(path: string, init: RequestInit, retry = true): Promise<Response> {
  const headers = new Headers(init.headers);
  if (tokens.access) headers.set("Authorization", `Bearer ${tokens.access}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 401 && retry && tokens.refresh && (await refreshAccess())) {
    return request(path, init, false);
  }
  return res;
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data?.detail ?? `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export const api = {
  async get<T>(path: string): Promise<T> {
    return parse<T>(await request(path, { method: "GET" }));
  },
  async post<T>(path: string, body?: unknown): Promise<T> {
    const isForm = body instanceof FormData;
    return parse<T>(
      await request(path, {
        method: "POST",
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      }),
    );
  },
  async patch<T>(path: string, body: unknown): Promise<T> {
    return parse<T>(await request(path, { method: "PATCH", body: JSON.stringify(body) }));
  },
  async put<T>(path: string, body: unknown): Promise<T> {
    return parse<T>(await request(path, { method: "PUT", body: JSON.stringify(body) }));
  },
  async delete(path: string): Promise<void> {
    return parse<void>(await request(path, { method: "DELETE" }));
  },
  /** Fetch an authenticated file and open it in a new tab. */
  async openFile(path: string): Promise<void> {
    const res = await request(path, { method: "GET" });
    if (!res.ok) throw new ApiError("Could not open file", res.status);
    const url = URL.createObjectURL(await res.blob());
    window.open(url, "_blank");
  },
};
