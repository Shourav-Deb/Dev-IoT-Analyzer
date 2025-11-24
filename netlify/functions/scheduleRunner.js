// scheduleRunner.js - scan schedules and execute actions (cron)
const fetch = require("node-fetch");
const crypto = require("crypto");

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_KEY;
const CONTROL_ENDPOINT = process.env.CONTROL_ENDPOINT || "/.netlify/functions/controlDevice";

async function fetchActiveSchedules() {
  if (!SUPA_URL || !SUPA_KEY) return [];
  // Active schedules with a matching cron/time window should be pre-expanded in the UI.
  const res = await fetch(`${SUPA_URL}/rest/v1/schedules?is_active=eq.true`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
  });
  return res.json();
}

async function callControl(device_id, action) {
  const resp = await fetch(process.env.SITE_URL + CONTROL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id, action })
  });
  return resp.json();
}

exports.handler = async () => {
  try {
    const schedules = await fetchActiveSchedules();
    const executed = [];
    for (const s of schedules) {
      // Basic cron-like evaluation: here we rely on fields like cron_spec or repeat_weekdays
      // For production, use a cron parser to evaluate current time against cron_spec.
      // We'll execute single-run schedules where start_time <= now <= end_time.
      const now = new Date();
      if (s.start_time && new Date(s.start_time) > now) continue;
      if (s.end_time && new Date(s.end_time) < now) continue;
      // repeat_weekdays evaluation
      if (s.repeat_weekdays && s.repeat_weekdays.length) {
        const wd = now.getDay(); // 0 Sunday..6
        if (!s.repeat_weekdays.includes(wd)) continue;
      }
      // if passes checks -> run
      const res = await callControl(s.device_id, s.action);
      executed.push({ schedule: s.id, res });
    }
    return { statusCode: 200, body: JSON.stringify({ executed }) };
  } catch (err) {
    console.error("scheduleRunner error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
