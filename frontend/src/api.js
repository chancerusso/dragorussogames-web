const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_KEY = "drg_dm_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (response.status === 401) {
    setToken(null);
    throw new Error("Authentication required.");
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

export async function login(password) {
  const payload = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  setToken(payload.token);
  return payload.user;
}

export async function logout() {
  try {
    await api("/auth/logout", { method: "POST" });
  } finally {
    setToken(null);
  }
}
