import React, { useEffect, useState } from "react";
import DeviceCard from "../components/DeviceCard";
import StatCard from "../components/StatCard";
import { fetchJSON } from "../utils/api";

export default function Dashboard() {
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const POLL = parseInt(import.meta.env.VITE_POLL_INTERVAL || 5000);

  async function load() {
    try {
      const res = await fetchJSON("/.netlify/functions/getDeviceData");
      setDeviceData(res);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, POLL);
    return () => clearInterval(id);
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!deviceData) return <p>No data</p>;

  const parsed = deviceData.parsed || {};
  const last5 = deviceData.last5 || [];

  const totalPower = parsed.watt || 0;
  const totalToday = last5[0] ? last5[0].kwh : parsed.total_kwh || 0;

  return (
    <div>
      <section className="overview">
        <StatCard
          title="Live Power"
          value={`${totalPower} W`}
          sub="Current instantaneous power"
        />
        <StatCard
          title="Today's kWh"
          value={`${totalToday} kWh`}
          sub="From Supabase"
        />
        <StatCard
          title="Device"
          value={deviceData.device_id}
          sub="Monitored device"
        />
      </section>

      <section style={{ marginTop: 16 }}>
        <DeviceCard
          deviceId={deviceData.device_id}
          parsed={parsed}
          daily={last5}
        />
      </section>
    </div>
  );
}
