import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/apiClient.js";

export default function RoomPage() {
  const { deviceId } = useParams();
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await api.fetchJson(`/.netlify/functions/tuyaProxy`, { device_id: deviceId });
      setParsed(res.parsed || res.result || res);
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [deviceId]);

  async function toggle(action) {
    await api.postJson(`/.netlify/functions/controlDevice`, { device_id: deviceId, action });
    load();
  }

  if (loading) return <div style={{ padding: 18 }}>Loading device {deviceId}…</div>;
  if (err) return <div style={{ padding: 18, color: "tomato" }}>Error: {err}</div>;

  return (
    <div style={{ padding: 18 }}>
      <Link to="/">← Back</Link>
      <h2>{deviceId}</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(parsed, null, 2)}</pre>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => toggle("on")}>Turn ON</button>
        <button onClick={() => toggle("off")} style={{ marginLeft: 8 }}>Turn OFF</button>
      </div>
    </div>
  );
}
