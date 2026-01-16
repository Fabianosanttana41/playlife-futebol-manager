// frontend/js/api.js
export const API = "https://playlife-api.onrender.com";

export async function apiGet(path) {
  if (!path.startsWith("/")) path = "/" + path;

  const res = await fetch(API + path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function apiPost(path, payload = {}) {
  if (!path.startsWith("/")) path = "/" + path;

  const res = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
