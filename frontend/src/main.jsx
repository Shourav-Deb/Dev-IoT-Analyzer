import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import DevicePage from "./pages/DevicePage";

import "./styles.css"; // optional; create or remove

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/device/:id" element={<DevicePage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
