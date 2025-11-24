const API_BASE = import.meta.env.VITE_API_BASE || "";

async function fetchJson(path, params = {}) {
  const url = new URL((API_BASE || "") + path, window.location.origin);
  if (params && Object.keys(params).length) {
    Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));
  }
  const resp = await fetch(url.toString());
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

async function postJson(path, body) {
  const url = (API_BASE || "") + path;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  try { return JSON.parse(text); } catch(e) { return text; }
}

export default { fetchJson, postJson };
