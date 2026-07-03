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
  const method = String(options.method || "GET").toUpperCase();
  const requestPath = addAdminQuery(path, method);
  const requestOptions = addAdminDefaults(path, options, method);
  const response = await fetch(`${API_BASE}${requestPath}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(requestOptions.headers || {}),
    },
    ...requestOptions,
  });
  if (response.status === 401) {
    setToken(null);
    throw new Error("Authentication required.");
  }
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  return response.status === 204 ? null : response.json();
}

function addAdminQuery(path, method) {
  if (!path.startsWith("/1e/") || !isWriteMethod(method)) return path;

  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("actor_is_admin", "true");
  return `${pathname}?${params.toString()}`;
}

function addAdminDefaults(path, options, method) {
  if (!options.body || typeof options.body !== "string" || path.startsWith("/auth/")) return options;
  if (!isWriteMethod(method)) return options;
  try {
    const payload = JSON.parse(options.body);
    if (!payload || Array.isArray(payload) || typeof payload !== "object") return options;
    return {
      ...options,
      body: JSON.stringify({
        ...payload,
        actor_is_admin: true,
        actor_discord_user_id: payload.actor_discord_user_id || "dm-portal-admin",
      }),
    };
  } catch {
    return options;
  }
}

function isWriteMethod(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
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
    if (detail.some(isActorAdminError)) {
      return "Admin authorization was not accepted. Please refresh and try again.";
    }
    return "Unable to save changes. Please check the form and try again.";
  }

  if (typeof detail === "object") {
    const message = detail.msg || detail.detail || detail.message || "";
    if (isActorAdminError(detail) || String(message).includes("actor_is_admin")) {
      return "Admin authorization was not accepted. Please refresh and try again.";
    }
    return message || "Unable to save changes. Please check the form and try again.";
  }

  const text = String(detail);
  if (text.includes("actor_is_admin")) {
    return "Admin authorization was not accepted. Please refresh and try again.";
  }
  return text.replace(/^"|"$/g, "");
}

function isActorAdminError(detail) {
  const location = Array.isArray(detail?.loc) ? detail.loc.join(".") : "";
  return location.includes("actor_is_admin") || String(detail?.msg || "").includes("actor_is_admin");
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
