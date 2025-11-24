import React from "react";
import { Outlet, Link } from "react-router-dom";

export default function App() {
  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand">Deb IoT Analyzer — BEMS (FUB)</div>
        <nav>
          <Link to="/">Dashboard</Link>
        </nav>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        <small>Deb IoT Analyzer — local dev</small>
      </footer>
    </div>
  );
}
