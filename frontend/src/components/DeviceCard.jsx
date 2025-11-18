import React from "react";
import { Link } from "react-router-dom";

export default function DeviceCard({ deviceId, parsed, daily }) {
  const today = daily && daily[0] ? daily[0].kwh : parsed.total_kwh || 0;
  return (
    <div className="device-card">
      <div className="device-header">
        <h3>{deviceId}</h3>
        <small>Realtime monitor</small>
      </div>
      <div className="device-body">
        <div className="stat">
          <div className="value">{parsed.watt ?? "-"} W</div>
          <div className="label">Power</div>
        </div>
        <div className="stat">
          <div className="value">{parsed.voltage ?? "-"} V</div>
          <div className="label">Voltage</div>
        </div>
        <div className="stat">
          <div className="value">{parsed.current ?? "-"} A</div>
          <div className="label">Current</div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div>
          Today kWh: <strong>{today}</strong>
        </div>
        <Link className="btn" to={`/device/${deviceId}`}>
          Open Device Page
        </Link>
      </div>
    </div>
  );
}
