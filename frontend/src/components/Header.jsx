import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="header">
      <div className="brand">
        <h1>Dev IoT Analyzer</h1>
        <small>Realtime energy monitoring — Demo</small>
      </div>
      <nav>
        <Link to="/">Dashboard</Link>
        <Link to="/add-device">Add Device</Link>
        <Link to="/knowledge">Knowledge Book</Link>
      </nav>
    </header>
  );
}
