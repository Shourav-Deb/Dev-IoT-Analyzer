import React, { useState } from "react";
import { postJSON } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function AddDevice() {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [loc, setLoc] = useState("");
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    // For persistence you would insert into Supabase devices table. For demo we call recordTelemetry or show note.
    setMsg(
      "For persistence please add device record in Supabase or update TUYA_DEVICE_IDS env var in Netlify."
    );
    setTimeout(() => nav("/"), 1000);
  };

  return (
    <div>
      <h2>Add Device</h2>
      <form onSubmit={submit}>
        <label>
          ID (device_id):
          <input value={id} onChange={(e) => setId(e.target.value)} required />
        </label>
        <label>
          Name:
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Location:
          <input value={loc} onChange={(e) => setLoc(e.target.value)} />
        </label>
        <button type="submit">Add Device</button>
      </form>
      <small>{msg}</small>
    </div>
  );
}
