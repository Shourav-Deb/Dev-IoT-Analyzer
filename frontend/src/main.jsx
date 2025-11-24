import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import BuildingDashboard from "./pages/BuildingDashboard.jsx";
import RoomPage from "./pages/RoomPage.jsx";
import "./styles.css";

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<BuildingDashboard />} />
          <Route path="room/:deviceId" element={<RoomPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
