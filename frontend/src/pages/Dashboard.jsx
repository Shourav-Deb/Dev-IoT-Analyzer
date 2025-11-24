// frontend/src/pages/Dashboard.jsx  (debug version)
import React, { useEffect, useState } from "react";
import DeviceCard from "../components/DeviceCard";
import StatCard from "../components/StatCard";
import { fetchJSON } from "../utils/api";

export default function Dashboard() {
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const POLL = parseInt(import.meta.env.VITE_POLL_INTERVAL || 5000);

  async function load() {
    try {
      setErr(null);
      const res = await fetchJSON("/.netlify/functions/getDeviceData");
      // defensive: if response is not object, show raw
      if (!res || typeof res !== "object") {
        setDeviceData({ __raw: res });
      } else setDeviceData(res);
      setLoading(false);
    } catch (e) {
      console.error("Dashboard load error:", e);
      setErr(String(e));
      setDeviceData(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, POLL);
    return () => clearInterval(id);
  }, []);

  // Visible debug overlay
  if (loading) return <div style={{padding:24}}>Loading...</div>;
  if (err)
    return (
      <div style={{ padding: 24, background: "#071126", color: "#fbe" }}>
        <h2>Dashboard error</h2>
        <pre style={{ whiteSpace: "pre-wrap", color: "#ffdcdc" }}>{err}</pre>
        <p>
          Check <strong>Network → getDeviceData</strong> and copy the response here.
        </p>
      </div>
    );

  if (!deviceData)
    return (
      <div style={{ padding: 24 }}>
        <h2>No device data</h2>
        <p>
          The frontend fetched the API but received no data. This means the
          function may be returning null/500, or CORS/network issue.
        </p>
        <p style={{ color: "#9aa7b2" }}>
          Try curl <code>http://localhost:8888/.netlify/functions/getDeviceData</code>
        </p>
      </div>
    );

  // If function returned raw (string/primitive) show it
  if (deviceData.__raw) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Raw response</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(deviceData.__raw, null, 2)}</pre>
      </div>
    );
  }

  // Normal render path (copied from original with safeguards)
  try {
    const parsed = deviceData.parsed || {};
    const last5 = deviceData.last5 || [];
    const totalPower = parsed.watt || 0;
    const totalToday = last5[0] ? last5[0].kwh : parsed.total_kwh || 0;

    return (
      <div style={{ padding: 24 }}>
        <section style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <StatCard title="Live Power" value={`${totalPower} W`} sub="Current instantaneous power" />
            <StatCard title="Today's kWh" value={`${totalToday} kWh`} sub="From Supabase" />
            <StatCard title="Device" value={deviceData.device_id || "—"} sub="Monitored device" />
          </div>
        </section>

        <section style={{ marginTop: 16 }}>
          <DeviceCard deviceId={deviceData.device_id} parsed={parsed} daily={last5} />
        </section>

        <hr style={{ margin: "24px 0", opacity: 0.06 }} />
        <section>
          <h3>Debug info</h3>
          <pre style={{ whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto" }}>
            {JSON.stringify(deviceData, null, 2)}
          </pre>
        </section>
      </div>
    );
  } catch (e) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Render error</h2>
        <pre>{String(e)}</pre>
      </div>
    );
  }
}
