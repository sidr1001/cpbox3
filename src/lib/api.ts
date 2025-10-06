// Lightweight REST API client for the frontend

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function getAuthToken(): string | null {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch(url, { ...options, headers });
  if (resp.status === 401) {
    try { localStorage.removeItem("token"); } catch {}
    throw new Error("Unauthorized");
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `HTTP ${resp.status}`);
  }
  // try json first
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return resp.json();
  // fallback to text
  // @ts-ignore
  return resp.text();
}

function buildQuery(params?: Record<string, any>) {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    usp.set(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export const apiClient = {
  // Auth
  async register(email: string, password: string, displayName?: string) {
    return request("/auth/register", { method: "POST", body: JSON.stringify({ email, password, displayName }) });
  },
  async login(email: string, password: string) {
    const res = await request<{ user: any; token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    try { localStorage.setItem("token", res.token); } catch {}
    return res;
  },
  logout() {
    try { localStorage.removeItem("token"); } catch {}
  },

  // Settings
  getSettings() { return request("/settings"); },
  updateSettings(payload: Record<string, any>) { return request("/settings", { method: "PUT", body: JSON.stringify(payload) }); },
  getVkAuthUrl() { return request<{ auth_url: string }>("/vk/oauth/url"); },
  getVkMe(vkToken: string) { return request(`/vk/me${buildQuery({ vk_token: vkToken })}`); },

  // Posts
  getPosts(params?: Record<string, any>) { return request(`/posts${buildQuery(params)}`); },
  createPost(payload: Record<string, any>) { return request("/posts", { method: "POST", body: JSON.stringify(payload) }); },
  publishPost(postId: string | number) { return request(`/posts/${postId}/publish`, { method: "POST" }); },
};

