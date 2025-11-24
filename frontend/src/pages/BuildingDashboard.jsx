import React, { useEffect, useState } from "react";
import api from "../api/apiClient.js";
import RoomTile from "../components/RoomTile.jsx";

export default function BuildingDashboard() {
  const envList = (import.meta.env.VITE_DEVICE_IDS || "").trim();
  const fallback = ["dev-F1-R101", "dev-F1-R102", "dev-F2-R201"];
  const deviceIds = envList ? envList.split(",").map(s => s.trim()).filter(Boolean) : fallback;

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function refreshAll() {
    setLoading(true);
    setErr(null);
    const out = [];
    for (const id of deviceIds) {
      try {
        const res = await api.fetchJson(`/.netlify/functions/tuyaProxy`, { device_id: id });
        out.push({ id, parsed: res.parsed || res.result || res });
      } catch (e) {
        out.push({ id, error: String(e) });
      }
    }
    setDevices(out);
    setLoading(false);
  }

  useEffect(() => { refreshAll(); }, []);

  if (loading) return <div style={{ padding: 18 }}>Loading devices…</div>;
  if (err) return <div style={{ padding: 18, color: "tomato" }}>Error: {err}</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Building Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
        {devices.map(d => (
          <RoomTile key={d.id} room={{ id: d.id, parsed: d.parsed, error: d.error }} onRefresh={refreshAll} />
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <button onClick={refreshAll}>Refresh</button>
      </div>
    </div>
  );
}
