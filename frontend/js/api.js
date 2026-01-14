// ==========================================================
// Playlife - API helper (FUNCIONA NO PC E NO CELULAR)
// ==========================================================

// API dinâmica:
// - Se abrir no PC em http://127.0.0.1:8080 -> API = http://127.0.0.1:8001
// - Se abrir no celular em http://192.168.x.x:8080 -> API = http://192.168.x.x:8001
export const API = `${location.protocol}//${location.hostname}:8001`;

// GET genérico
export async function apiGet(url) {
  const res = await fetch(url);

  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch (e) {}
    throw new Error(`HTTP ${res.status} - ${body || "erro ao buscar dados"}`);
  }

  return await res.json();
}

// POST genérico (caso você use agora ou futuramente)
export async function apiPost(path, payload = {}) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch (e) {}
    throw new Error(`HTTP ${res.status} - ${body || "erro ao enviar dados"}`);
  }

  return await res.json();
}
