// controlDevice.js
const { TuyaContext } = require("@tuya/tuya-connector-nodejs");

const BASE = process.env.TUYA_BASE_URL || process.env.TUYA_API_ENDPOINT || "https://openapi.tuyaeu.com";
const ACCESS_ID = process.env.TUYA_ACCESS_ID;
const ACCESS_KEY = process.env.TUYA_ACCESS_KEY;

const tuya = new TuyaContext({
  baseUrl: BASE,
  accessKey: ACCESS_ID,
  secretKey: ACCESS_KEY,
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    const body = JSON.parse(event.body || "{}");
    const { device_id, action, dp_code } = body;
    if (!device_id || !action) return { statusCode: 400, body: JSON.stringify({ error: "device_id & action required" }) };

    const code = dp_code || "switch_1";
    const value = String(action).toLowerCase() === "on";

    const resp = await tuya.request({
      path: `/v1.0/iot-03/devices/${device_id}/commands`,
      method: "POST",
      body: { commands: [{ code, value }] },
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true, resp }) };
  } catch (err) {
    console.error("controlDevice error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
