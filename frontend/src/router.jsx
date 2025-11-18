import React from "react";
import { Routes, Route } from "react-router-dom";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import DevicePage from "./pages/DevicePage";
import AddDevice from "./pages/AddDevice";
import KnowledgeBook from "./pages/KnowledgeBook";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Dashboard />} />
        <Route path="device/:id" element={<DevicePage />} />
        <Route path="add-device" element={<AddDevice />} />
        <Route path="knowledge" element={<KnowledgeBook />} />
      </Route>
    </Routes>
  );
}
