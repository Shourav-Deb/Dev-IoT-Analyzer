// tuyaProxy.js - GET device status + optional history from Supabase
const fetch = require("node-fetch");
const crypto = require("crypto");

const BASE = process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com";
const ACCESS_ID = process.env.TUYA_ACCESS_ID;
const ACCESS_KEY = process.env.TUYA_ACCESS_KEY;
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_KEY;

function buildClassicSign(clientId, secretKey, method, path, t, accessToken = "", body = "") {
  const bodyHash = crypto.createHash("sha256").update(body || "").digest("hex");
  const stringToSign = [method.toUpperCase(), bodyHash, "", path].join("\n");
  const message = clientId + accessToken + t + stringToSign;
  return crypto.createHmac("sha256", secretKey).update(message).digest("hex").toUpperCase();
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

exports.handler = async (event) => {
  try {
    const qs = event.queryStringParameters || {};
    const device_id = qs.device_id;
    if (!device_id) return { statusCode: 400, body: JSON.stringify({ error: "device_id required" }) };

    const ACCESS_TOKEN = process.env.TUYA_ACCESS_TOKEN || "";
    const path = `/v1.0/iot-03/devices/${device_id}/status`;
    const t = String(Date.now());
    const sign = buildClassicSign(ACCESS_ID, ACCESS_KEY, "GET", path, t, ACCESS_TOKEN);

    const headers = {
      client_id: ACCESS_ID,
      sign,
      t,
      sign_method: "HMAC-SHA256",
      access_token: ACCESS_TOKEN
    };

    const resp = await fetch(BASE + path, { method: "GET", headers, timeout: 15000 });
    const data = await resp.json();
    const dpArray = (data?.result) || [];

    const parsed = parseDpArray(dpArray);
    parsed.raw = data;

    // write to Supabase telemetry if configured
    await recordToSupabase(device_id, parsed);

    return { statusCode: 200, body: JSON.stringify({ device_id, parsed }) };
  } catch (err) {
    console.error("tuyaProxy error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
