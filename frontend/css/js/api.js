// frontend/css/js/api.js
const API_URL = "https://playlife-api.onrender.com";

// monta URL final corretamente
function buildUrl(url) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (!url.startsWith("/")) url = "/" + url;
  return API_URL + url;
}

export async function apiGet(url) {
  const r = await fetch(buildUrl(url));
  if (!r.ok) throw new Error("Erro API: " + r.status);
  return await r.json();
}

export async function apiPost(url, body = null) {
  const opt = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };
  if (body !== null) opt.body = JSON.stringify(body);

  const r = await fetch(buildUrl(url), opt);

  if (!r.ok) {
    let msg = "Erro API: " + r.status;
    try {
      const j = await r.json();
      msg = j.detail || msg;
    } catch {}
    throw new Error(msg);
  }

  return await r.json();
}
