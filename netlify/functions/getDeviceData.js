// getDeviceData.js
const { TuyaContext } = require("@tuya/tuya-connector-nodejs");
const fetch = require("node-fetch");

const BASE = process.env.TUYA_BASE_URL || process.env.TUYA_API_ENDPOINT || "https://openapi.tuyaeu.com";
const ACCESS_ID = process.env.TUYA_ACCESS_ID;
const ACCESS_KEY = process.env.TUYA_ACCESS_KEY;
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_KEY;

// init SDK
const tuya = new TuyaContext({
  baseUrl: BASE,
  accessKey: ACCESS_ID,
  secretKey: ACCESS_KEY,
});

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

async function fetchDevice(device_id) {
  const res = await tuya.request({
    path: `/v1.0/devices/${device_id}/status`,
    method: "GET",
  });
  return res;
}

async function fetchLast5DaysFromSupabase(device_id) {
  if (!SUPA_URL || !SUPA_KEY) return [];
  // Query last 5 days aggregations from telemetry table (Supabase REST)
  const since = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
  const url = `${SUPA_URL}/rest/v1/telemetry?device_id=eq.${device_id}&timestamp=gte.${since}`;
  const res = await fetch(url, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
  });
  if (!res.ok) return [];
  const rows = await res.json();
  // produce date buckets (YYYY-MM-DD) with kwh and avg watt
  const agg = {};
  rows.forEach((r) => {
    const day = (r.timestamp || "").slice(0, 10);
    if (!agg[day]) agg[day] = { kwh: 0, count: 0, wattSum: 0 };
    agg[day].kwh += parseFloat(r.energy_kwh || 0);
    agg[day].count += 1;
    agg[day].wattSum += parseFloat(r.watt || 0);
  });
  const out = Object.keys(agg)
    .sort()
    .slice(-5)
    .map((d) => ({
      date: d,
      kwh: +(agg[d].kwh || 0).toFixed(3),
      avg_watt: agg[d].count ? +(agg[d].wattSum / agg[d].count).toFixed(2) : null,
    }));
  return out;
}

exports.handler = async (event) => {
  try {
    // Accept optional device_id query or return first device from env var
    const device_id = (event.queryStringParameters && event.queryStringParameters.device_id) 
                      || process.env.TUYA_DEVICE_ID
                      || (process.env.TUYA_DEVICE_IDS && process.env.TUYA_DEVICE_IDS.split(",")[0]);

    if (!device_id) {
      return { statusCode: 400, body: JSON.stringify({ error: "device_id required" }) };
    }

    const status = await fetchDevice(device_id);
    if (!status || !status.success) {
      return { statusCode: 500, body: JSON.stringify({ error: "tuya fetch failed", detail: status }) };
    }

    // parse DP array
    const parsed = parseDpArray(status.result);

    // optionally fetch last 5 days from Supabase
    const last5 = await fetchLast5DaysFromSupabase(device_id);

    return {
      statusCode: 200,
      body: JSON.stringify({ device_id, parsed, last5, raw: status }),
    };
  } catch (err) {
    console.error("getDeviceData error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
