// controlDevice.js - send ON/OFF or DP commands to Tuya device (Netlify)
const fetch = require("node-fetch");
const crypto = require("crypto");

const BASE = process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com";
const ACCESS_ID = process.env.TUYA_ACCESS_ID;
const ACCESS_KEY = process.env.TUYA_ACCESS_KEY;

function buildClassicSign(clientId, secretKey, method, path, t, accessToken = "", body = "") {
  const bodyHash = crypto.createHash("sha256").update(body || "").digest("hex");
  const stringToSign = [method.toUpperCase(), bodyHash, "", path].join("\n");
  const message = clientId + accessToken + t + stringToSign;
  return crypto.createHmac("sha256", secretKey).update(message).digest("hex").toUpperCase();
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST")
      return { statusCode: 405, body: "Method Not Allowed" };

    const body = JSON.parse(event.body || "{}");
    const { device_id, action, dp_code } = body;
    if (!device_id || !action)
      return { statusCode: 400, body: JSON.stringify({ error: "device_id & action required" }) };

    // get token from env or fetch? Prefer short cached token in env (set from getToken)
    const ACCESS_TOKEN = process.env.TUYA_ACCESS_TOKEN || "";

    const code = dp_code || "switch_1";
    const value = String(action).toLowerCase() === "on" ? true : false;
    const path = `/v1.0/iot-03/devices/${device_id}/commands`;
    const payload = JSON.stringify({ commands: [{ code, value }] });
    const t = String(Date.now());
    const sign = buildClassicSign(ACCESS_ID, ACCESS_KEY, "POST", path, t, ACCESS_TOKEN, payload);

    const headers = {
      client_id: ACCESS_ID,
      sign,
      t,
      sign_method: "HMAC-SHA256",
      "access_token": ACCESS_TOKEN,
      "Content-Type": "application/json"
    };

    const resp = await fetch(BASE + path, {
      method: "POST",
      headers,
      body: payload,
      timeout: 15000
    });
    const data = await resp.json();
    return { statusCode: 200, body: JSON.stringify({ ok: true, resp: data }) };
  } catch (err) {
    console.error("controlDevice error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
