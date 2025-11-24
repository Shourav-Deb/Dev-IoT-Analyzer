// getToken.js - classic Tuya token request (Netlify function)
const crypto = require("crypto");
const fetch = require("node-fetch");

const BASE = process.env.TUYA_BASE_URL || "https://openapi.tuyaeu.com";
const ACCESS_ID = process.env.TUYA_ACCESS_ID;
const ACCESS_KEY = process.env.TUYA_ACCESS_KEY;

// build classic sign used across functions
function buildClassicSign(clientId, secretKey, method, path, t, accessToken = "", body = "") {
  const bodyHash = crypto.createHash("sha256").update(body || "").digest("hex");
  // string to sign: METHOD + \n + bodyHash + \n + '' + \n + path
  const stringToSign = [method.toUpperCase(), bodyHash, "", path].join("\n");
  const message = clientId + accessToken + t + stringToSign;
  const sign = crypto.createHmac("sha256", secretKey).update(message).digest("hex").toUpperCase();
  return sign;
}

exports.handler = async () => {
  try {
    if (!ACCESS_ID || !ACCESS_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing TUYA envs" }) };
    }
    const path = "/v1.0/token?grant_type=1";
    const t = String(Date.now());
    const sign = buildClassicSign(ACCESS_ID, ACCESS_KEY, "GET", path, t, "");
    const headers = {
      client_id: ACCESS_ID,
      sign: sign,
      t: t,
      sign_method: "HMAC-SHA256",
    };
    const resp = await fetch(BASE + path, { method: "GET", headers });
    const data = await resp.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error("getToken error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
