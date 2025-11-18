export async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch failed: " + res.status);
  return res.json();
}
export async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
