// assets/js/api.js
// Playlife - API helper (PRODUÇÃO)

export const API = "https://playlife-api.onrender.com";

// GET genérico
export async function apiGet(path) {
  if (!path.startsWith("/")) path = "/" + path;

  const res = await fetch(API + path);
  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch {}
    throw new Error(`HTTP ${res.status} - ${body || "Erro ao buscar dados"}`);
  }
  return await res.json();
}

// POST genérico
export async function apiPost(path, payload = {}) {
  if (!path.startsWith("/")) path = "/" + path;

  const res = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch {}
    throw new Error(`HTTP ${res.status} - ${body || "Erro ao enviar dados"}`);
  }

  return await res.json();
}
