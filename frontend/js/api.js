// ==========================================================
// Playlife - API helper (PRODUÇÃO)
// ==========================================================

// API fixa do Render
export const API = "https://playlife-api.onrender.com";

// monta URL final corretamente
function buildUrl(path) {
  // se já veio completo (https://...), usa direto
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  // garante que começa com /
  if (!path.startsWith("/")) path = "/" + path;

  return API + path;
}

// GET genérico
export async function apiGet(path) {
  const finalUrl = buildUrl(path);

  const res = await fetch(finalUrl);

  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch {}
    throw new Error(`HTTP ${res.status} - ${body || "Erro ao buscar dados"}`);
  }

  return await res.json();
}

// POST genérico
export async function apiPost(path, payload = {}) {
  const finalUrl = buildUrl(path);

  const res = await fetch(finalUrl, {
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
