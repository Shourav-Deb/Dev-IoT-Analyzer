import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { fetchJSON, postJSON } from "../utils/api";
import { useParams } from "react-router-dom";

export default function DevicePage() {
  const { id } = useParams();
  const [parsed, setParsed] = useState(null);
  const [last5, setLast5] = useState([]);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  async function load() {
    const url = id ? `/.netlify/functions/getDeviceData?device_id=${id}` : "/.netlify/functions/getDeviceData";
    try {
      const res = await fetchJSON(url);
      setParsed(res.parsed || {});
      setLast5(res.last5 || []);
    } catch (e) {
      console.error("Load error", e);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, parseInt(import.meta.env.VITE_POLL_INTERVAL || 5000));
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!canvasRef.current || !last5) return;
    const labels = last5.map((d) => d.date).reverse();
    const kwh = last5.map((d) => d.kwh).reverse();
    const watt = last5.map((d) => d.avg_watt).reverse();
    const curr = last5
      .map((d) => (d.avg_watt ? parseFloat((d.avg_watt / 230).toFixed(3)) : 0))
      .reverse();

    if (!chartRef.current) {
      chartRef.current = new Chart(canvasRef.current.getContext("2d"), {
        type: "line",
        data: {
          labels,
          datasets: [
            { label: "Daily kWh", data: kwh, yAxisID: "kwh", tension: 0.3 },
            { label: "Avg Watt", data: watt, yAxisID: "watt", tension: 0.3 },
            { label: "Avg Current (A)", data: curr, yAxisID: "amp", tension: 0.3 },
          ],
        },
        options: {
          responsive: true,
          scales: {
            kwh: { type: "linear", position: "left", beginAtZero: true },
            watt: { type: "linear", position: "right", beginAtZero: true, grid: { drawOnChartArea: false } },
            amp: { type: "linear", position: "right", beginAtZero: true, grid: { drawOnChartArea: false } },
          },
        },
      });
    } else {
      chartRef.current.data.labels = labels;
      chartRef.current.data.datasets[0].data = kwh;
      chartRef.current.data.datasets[1].data = watt;
      chartRef.current.data.datasets[2].data = curr;
      chartRef.current.update();
    }
  }, [last5]);

  const handleSwitch = async (action) => {
    try {
      const res = await postJSON("/.netlify/functions/controlDevice", {
        device_id: id,
        action,
      });
      alert(res?.resp ? "Command sent" : "Response received");
      load();
    } catch (e) {
      alert("Control failed: " + e.message);
    }
  };

  if (!parsed) return <p>Loading...</p>;
  return (
    <div>
      <h2>Device: {id}</h2>
      <div className="live-grid">
        <div>Power: <strong>{parsed.watt ?? "-"} W</strong></div>
        <div>Voltage: <strong>{parsed.voltage ?? "-"} V</strong></div>
        <div>Current: <strong>{parsed.current ?? "-"} A</strong></div>
        <div>kWh: <strong>{parsed.total_kwh ?? 0} kWh</strong></div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => handleSwitch("on")}>Turn ON</button>
        <button onClick={() => handleSwitch("off")}>Turn OFF</button>
      </div>

      <div style={{ maxWidth: 900, marginTop: 20 }}>
        <canvas ref={canvasRef} />
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Last 5 days</h3>
        <table className="table">
          <thead>
            <tr><th>Date</th><th>kWh</th><th>Avg Watt</th></tr>
          </thead>
          <tbody>
            {last5.map((d) => (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td>{d.kwh}</td>
                <td>{d.avg_watt ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
