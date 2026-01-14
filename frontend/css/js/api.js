// frontend/js/api.js
export const API = "http://127.0.0.1:8001";

export async function apiGet(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Erro API: " + r.status);
  return await r.json();
}

export async function apiPost(url, body = null) {
  const opt = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };
  if (body !== null) opt.body = JSON.stringify(body);

  const r = await fetch(url, opt);
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
