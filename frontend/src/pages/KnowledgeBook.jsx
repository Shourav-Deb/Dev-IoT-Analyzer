import React from "react";

export default function KnowledgeBook() {
  return (
    <div className="kb">
      <h2>Knowledge Book — How to use Dev IoT Analyzer</h2>

      <section>
        <h3>Overview</h3>
        <p>
          Dev IoT Analyzer monitors energy usage and controls a Tuya smart plug.
          It shows real-time readings, daily summaries and last-5-days charts.
        </p>
      </section>

      <section>
        <h3>Dashboard</h3>
        <ol>
          <li>
            Overview cards show live power, today's kWh, and the monitored
            device id.
          </li>
          <li>
            Device card shows watt, voltage, current and quick link to device
            page.
          </li>
        </ol>
      </section>

      <section>
        <h3>Device Page</h3>
        <p>
          Shows live readings, ON/OFF control and a combined last-5-days chart
          (kWh, avg watt, avg current).
        </p>
      </section>

      <section>
        <h3>Adding new devices</h3>
        <p>
          To add a device: add its device_id to TUYA_DEVICE_IDS (comma
          separated) in Netlify env vars and redeploy. For persistent metadata
          create a devices table in Supabase.
        </p>
      </section>

      <section>
        <h3>Notes for demo</h3>
        <ul>
          <li>
            Keep polling interval modest (e.g. 5s or 10s) to avoid rate limits.
          </li>
          <li>Keep keys private; use Netlify env vars for production.</li>
        </ul>
      </section>
    </div>
  );
}
