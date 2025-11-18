import React from "react";
export default function StatCard({ title, value, sub }) {
  return (
    <div className="statcard">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}
