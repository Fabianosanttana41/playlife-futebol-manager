export const API = "https://playlife-api.onrender.com";

function buildUrl(path) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!path.startsWith("/")) path = "/" + path;
  return API + path;
}

export async function apiGet(path) {
  const finalUrl = buildUrl(path);

  const res = await fetch(finalUrl);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} - ${body || "Erro ao buscar dados"}`);
  }
  return await res.json();
}

export async function apiPost(path, payload = {}) {
  const finalUrl = buildUrl(path);

  const res = await fetch(finalUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} - ${body || "Erro ao enviar dados"}`);
  }

  return await res.json();
}
