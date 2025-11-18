// getDeviceData.js
const { TuyaContext } = require("@tuya/tuya-connector-nodejs");
const fetch = require("node-fetch");

const BASE = process.env.TUYA_BASE_URL;
const ACCESS_ID = process.env.TUYA_ACCESS_ID;
const ACCESS_KEY = process.env.TUYA_ACCESS_KEY;
const DEVICE_IDS = (process.env.TUYA_DEVICE_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_KEY;

// init SDK
const tuya = new TuyaContext({
  baseUrl: BASE,
  accessKey: ACCESS_ID,
  secretKey: ACCESS_KEY,
});

// parse DP array to friendly metrics using known scalings
function parseDpArray(dpArray) {
  const parsed = {};
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

// record telemetry to Supabase (if configured)
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
      }),
    });
  } catch (e) {
    console.warn("Supabase insert failed", e.message);
  }
}

// fetch last N days aggregated kWh & avg watt
async function fetchLastNDays(device_id, n = 5) {
  if (!SUPA_URL || !SUPA_KEY) return null;
  try {
    const since = new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();
    const res = await fetch(
      `${SUPA_URL}/rest/v1/telemetry?device_id=eq.${device_id}&timestamp=gte.${since}`,
      {
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
      }
    );
    const rows = await res.json();
    const agg = {};
    rows.forEach((r) => {
      const day = (r.timestamp || "").slice(0, 10);
      if (!agg[day]) agg[day] = { kwh: 0, count: 0, wattSum: 0 };
      agg[day].kwh += parseFloat(r.energy_kwh || 0);
      agg[day].count += 1;
      agg[day].wattSum += parseFloat(r.watt || 0);
    });
    const out = [];
    for (let i = 0; i < n; i++) {
      const dayStr = new Date(Date.now() - i * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);
      const entry = agg[dayStr] || { kwh: 0, count: 0, wattSum: 0 };
      out.push({
        date: dayStr,
        kwh: parseFloat(entry.kwh.toFixed(6)),
        avg_watt: entry.count
          ? parseFloat((entry.wattSum / entry.count).toFixed(2))
          : 0,
      });
    }
    return out;
  } catch (e) {
    console.warn("fetchLastNDays error", e.message);
    return null;
  }
}

exports.handler = async (event) => {
  try {
    if (!BASE || !ACCESS_ID || !ACCESS_KEY)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "TUYA env vars missing" }),
      };

    // allow ?device_id param
    const qs = event.queryStringParameters || {};
    const device_id = qs.device_id || DEVICE_IDS[0];

    if (!device_id)
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No device_id configured" }),
      };

    // call Tuya status endpoint
    const status = await tuya.request({
      path: `/v1.0/iot-03/devices/${device_id}/status`,
      method: "GET",
    });
    const dpArray = status?.result || status.result || [];
    const parsed = parseDpArray(dpArray);

    // save into Supabase for history (if configured)
    await recordToSupabase(device_id, parsed);

    // get last 5 days aggregated data
    const last5 = await fetchLastNDays(device_id, 5);

    return {
      statusCode: 200,
      body: JSON.stringify({ device_id, parsed, last5 }),
    };
  } catch (err) {
    console.error("getDeviceData error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
