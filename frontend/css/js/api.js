// frontend/js/api.js
const API_URL = "https://playlife-api.onrender.com";

// monta URL final corretamente
function buildUrl(url) {
  // se já veio completo (https://...), usa direto
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  // garante que url começa com /
  if (!url.startsWith("/")) url = "/" + url;

  return API_URL + url;
}

export async function apiGet(url) {
  const finalUrl = buildUrl(url);

  const r = await fetch(finalUrl, {
    method: "GET",
  });

  if (!r.ok) throw new Error("Erro API: " + r.status);
  return await r.json();
}

export async function apiPost(url, body = null) {
  const finalUrl = buildUrl(url);

  const opt = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };

  if (body !== null) opt.body = JSON.stringify(body);

  const r = await fetch(finalUrl, opt);

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
