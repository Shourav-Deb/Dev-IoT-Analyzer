// healthCheck.js - returns quick status of Tuya token endpoint and Supabase telemetry connectivity
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

exports.handler = async () => {
  const result = { tuya: null, supabase: null };
  // Tuya token test
  try {
    if (!ACCESS_ID || !ACCESS_KEY) {
      result.tuya = { ok: false, error: "Missing TUYA_ACCESS_ID or TUYA_ACCESS_KEY in env" };
    } else {
      const path = "/v1.0/token?grant_type=1";
      const t = String(Date.now());
      const sign = buildClassicSign(ACCESS_ID, ACCESS_KEY, "GET", path, t, "");
      const headers = { client_id: ACCESS_ID, sign, t, sign_method: "HMAC-SHA256" };
      const resp = await fetch(BASE + path, { method: "GET", headers, timeout: 10000 });
      const doc = await resp.json();
      result.tuya = { ok: resp.ok, status: resp.status, body: doc };
    }
  } catch (e) {
    result.tuya = { ok: false, error: e.message };
  }

  // Supabase telemetry test
  try {
    if (!SUPA_URL || !SUPA_KEY) {
      result.supabase = { ok: false, error: "Missing SUPABASE_URL or SUPABASE_KEY" };
    } else {
      // quick test: select 1 record from telemetry via REST
      const url = `${SUPA_URL}/rest/v1/telemetry?select=*&limit=1`;
      const resp = await fetch(url, {
        method: "GET",
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
        timeout: 8000
      });
      const doc = await resp.json();
      result.supabase = { ok: resp.ok, status: resp.status, sample: doc };
    }
  } catch (e) {
    result.supabase = { ok: false, error: e.message };
  }

  return { statusCode: 200, body: JSON.stringify(result) };
};
