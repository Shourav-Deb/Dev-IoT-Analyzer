// getDevices.js - returns Tuya device details for each device_id in TUYA_DEVICE_IDS
const { TuyaContext } = require("@tuya/tuya-connector-nodejs");

const BASE = process.env.TUYA_BASE_URL;
const ACCESS_ID = process.env.TUYA_ACCESS_ID;
const ACCESS_KEY = process.env.TUYA_ACCESS_KEY;
const DEVICE_IDS = (process.env.TUYA_DEVICE_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const tuya = new TuyaContext({
  baseUrl: BASE,
  accessKey: ACCESS_ID,
  secretKey: ACCESS_KEY,
});

exports.handler = async () => {
  try {
    if (!BASE || !ACCESS_ID || !ACCESS_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "TUYA env vars not configured" }),
      };
    }
    if (!DEVICE_IDS.length)
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No TUYA_DEVICE_IDS configured" }),
      };

    const out = [];
    for (const id of DEVICE_IDS) {
      const detail = await tuya.device.detail({ device_id: id });
      out.push({ device_id: id, detail: detail?.result || detail });
    }
    return { statusCode: 200, body: JSON.stringify(out) };
  } catch (err) {
    console.error("getDevices error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
