import React from "react";
import devices from "../../devices.json";

export default function App() {
  const firstDevice = (devices && devices.devices && devices.devices[0] && devices.devices[0].id) || devices.default_device;
  return (
    <div style={{ padding: 24 }}>
      <h1>Dev IoT Analyzer</h1>
      <p>
        <a href={`/device/${firstDevice}`}>Open first device</a>
      </p>
      <p>Or add the device id to the route: /device/:id</p>
    </div>
  );
}
