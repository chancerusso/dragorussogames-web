const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_KEY = "drg_dm_admin_token";
const PLAYER_TOKEN_KEY = "drg_player_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getPlayerToken() {
  return localStorage.getItem(PLAYER_TOKEN_KEY);
}

export function setPlayerToken(token) {
  if (token) localStorage.setItem(PLAYER_TOKEN_KEY, token);
  else localStorage.removeItem(PLAYER_TOKEN_KEY);
}

export async function api(path, options = {}) {
  const { auth = "admin", ...fetchOptions } = options;
  const token = auth === "player" ? getPlayerToken() : auth === "admin" ? getToken() : null;
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(fetchOptions.headers || {}),
    },
    ...fetchOptions,
  });
  if (response.status === 401) {
    if (auth === "player" || auth === "admin") {
      if (auth === "player") setPlayerToken(null);
      if (auth === "admin") setToken(null);
      throw new Error("Authentication required.");
    }
  }
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  return response.status === 204 ? null : response.json();
}

async function getErrorMessage(response) {
  const fallback = `Request failed (${response.status}).`;

  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      return cleanErrorDetail(payload.detail ?? payload.message ?? payload) || fallback;
    }

    const text = await response.text();
    return cleanErrorDetail(text) || fallback;
  } catch {
    return fallback;
  }
}

function cleanErrorDetail(detail) {
  if (!detail) return "";

  if (Array.isArray(detail)) {
    return detail.map((item) => {
      if (typeof item === "string") return item;
      const location = Array.isArray(item?.loc) ? item.loc.filter((part) => part !== "body").join(".") : "";
      return [location, item?.msg].filter(Boolean).join(": ");
    }).filter(Boolean).join("; ");
  }

  if (typeof detail === "object") {
    const message = detail.msg || detail.detail || detail.message || "";
    return message || "Unable to save changes. Please check the form and try again.";
  }

  const text = String(detail);
  return text.replace(/^"|"$/g, "");
}

export async function login(password) {
  const payload = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  setToken(payload.token);
  return payload.user;
}

export async function playerLogin(username, password) {
  const payload = await api("/player/login", {
    auth: "none",
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setPlayerToken(payload.token);
  return payload.user;
}

export async function logout() {
  try {
    await api("/auth/logout", { method: "POST" });
  } finally {
    setToken(null);
  }
}

export async function playerLogout() {
  try {
    await api("/player/logout", { auth: "player", method: "POST" });
  } finally {
    setPlayerToken(null);
  }
}
