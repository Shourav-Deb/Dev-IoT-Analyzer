// fetch wrapper
export async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return await res.json();
}

export async function postJSON(url, body) {
  return await fetchJSON(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
