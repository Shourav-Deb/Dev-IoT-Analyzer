// collector.js - poll devices every N seconds (trigger via cron or netlify scheduler)
const fetch = require("node-fetch");
const crypto = require("crypto");

const BASE = process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com";
const ACCESS_ID = process.env.TUYA_ACCESS_ID;
const ACCESS_KEY = process.env.TUYA_ACCESS_KEY;
const DEVICE_LIST = (process.env.TUYA_DEVICE_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_KEY;

function buildClassicSign(clientId, secretKey, method, path, t, accessToken = "", body = "") {
  const bodyHash = crypto.createHash("sha256").update(body || "").digest("hex");
  const stringToSign = [method.toUpperCase(), bodyHash, "", path].join("\n");
  const message = clientId + accessToken + t + stringToSign;
  return crypto.createHmac("sha256", secretKey).update(message).digest("hex").toUpperCase();
}

async function fetchStatus(device_id, access_token) {
  const path = `/v1.0/iot-03/devices/${device_id}/status`;
  const t = String(Date.now());
  const sign = buildClassicSign(ACCESS_ID, ACCESS_KEY, "GET", path, t, access_token);
  const headers = {
    client_id: ACCESS_ID,
    sign,
    t,
    access_token,
    sign_method: "HMAC-SHA256"
  };
  const resp = await fetch(BASE + path, { method: "GET", headers, timeout: 15000 });
  return resp.json();
}

async function recordToSupabase(device_id, parsed) {
  if (!SUPA_URL || !SUPA_KEY) return;
  try {
    await fetch(`${SUPA_URL}/rest/v1/telemetry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
      },
      body: JSON.stringify({
        device_id,
        timestamp: parsed.timestamp,
        watt: parsed.watt ?? null,
        voltage: parsed.voltage ?? null,
        current: parsed.current ?? null,
        energy_kwh: parsed.total_kwh ?? null,
        raw: parsed.raw ?? null
      }),
    });
  } catch (e) {
    console.warn("Supabase insert failed", e.message);
  }
}

function parseDpArray(dpArray) {
  const parsed = { raw: { result: dpArray } };
  (dpArray || []).forEach((dp) => {
    const code = dp.code;
    const value = dp.value;
    if (code === "switch_1") parsed.switch = !!value;
    else if (code === "cur_power") parsed.watt = value / 10.0;
    else if (code === "cur_voltage") parsed.voltage = value / 10.0;
    else if (code === "cur_current") parsed.current = value / 1000.0;
    else if (code === "add_ele") parsed.total_kwh = value / 1000.0;
    else parsed[code] = value;
  });
  parsed.timestamp = new Date().toISOString();
  return parsed;
}

exports.handler = async () => {
  try {
    const ACCESS_TOKEN = process.env.TUYA_ACCESS_TOKEN || "";
    if (!DEVICE_LIST.length) return { statusCode: 400, body: JSON.stringify({ error: "No devices in TUYA_DEVICE_IDS" }) };

    const out = [];
    for (const id of DEVICE_LIST) {
      const status = await fetchStatus(id, ACCESS_TOKEN);
      const dp = status?.result || [];
      const parsed = parseDpArray(dp);
      parsed.raw = status;
      await recordToSupabase(id, parsed);
      out.push({ device: id, ok: true });
    }
    return { statusCode: 200, body: JSON.stringify(out) };
  } catch (err) {
    console.error("collector error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
