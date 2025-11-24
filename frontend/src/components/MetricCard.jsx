import React from "react";

export default function MetricCard({ title, value, sub }) {
  return (
    <div className="metric-card">
      <div className="mc-header">{title}</div>
      <div className="mc-value">{value}</div>
      {sub && <div className="mc-sub">{sub}</div>}
    </div>
  );
}
