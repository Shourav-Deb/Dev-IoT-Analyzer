// recordTelemetry.js - accept POST telemetry and write to Supabase (or just accept)
const fetch = require("node-fetch");
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_KEY;

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    if (!SUPA_URL || !SUPA_KEY) return { statusCode: 500, body: JSON.stringify({ error: "Supabase not configured" }) };
    const body = JSON.parse(event.body || "{}");
    await fetch(`${SUPA_URL}/rest/v1/telemetry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
      },
      body: JSON.stringify(body),
    });
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("recordTelemetry error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
