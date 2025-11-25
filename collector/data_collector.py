# collector/data_collector.py
"""
Headless data collector (friend-style poll -> parse -> record).
Usage:
  - pip install requests
  - export COLLECTOR_TARGET_URL (e.g. http://localhost:8888/.netlify/functions/recordTelemetry)
  - export DEVICE_ID or set devices.json and pass via args
  - python data_collector.py
"""

import time
import json
import os
import requests
from datetime import datetime

# Configuration via env or defaults
NETLIFY_BASE = os.environ.get("NETLIFY_BASE", "http://localhost:8888")  # netlify dev default
RECORD_ENDPOINT = os.environ.get("RECORD_ENDPOINT", NETLIFY_BASE + "/.netlify/functions/recordTelemetry")
GET_DEVICE_ENDPOINT = os.environ.get("GET_DEVICE_ENDPOINT", NETLIFY_BASE + "/.netlify/functions/getDeviceData")
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "10"))  # seconds
DEVICE_ID = os.environ.get("DEVICE_ID")
DEVICES_FILE = os.path.join(os.path.dirname(__file__), "..", "devices.json")
TUYA_DIRECT = os.environ.get("TUYA_DIRECT", "false").lower() in ("1", "true", "yes")

# If you want to talk directly to Tuya (instead of via netlify functions),
# set TUYA_DIRECT = true and populate TUYA_BASE, TUYA_ACCESS_ID, TUYA_ACCESS_KEY and DEVICE_ID in env.
TUYA_BASE = os.environ.get("TUYA_BASE")
TUYA_ACCESS_ID = os.environ.get("TUYA_ACCESS_ID")
TUYA_ACCESS_KEY = os.environ.get("TUYA_ACCESS_KEY")

def load_devices():
    if DEVICE_ID:
        return [DEVICE_ID]
    if os.path.exists(DEVICES_FILE):
        with open(DEVICES_FILE, "r") as f:
            j = json.load(f)
            ds = j.get("devices", [])
            return [d["id"] for d in ds]
    return []

def parse_parsed_object(parsed):
    """
    Ensure we have the right numeric fields; parsed expected keys:
    { watt, voltage, current, total_kwh, timestamp, ... }
    Convert to numeric and attach device_id + timestamp for recording.
    """
    out = {
        "device_id": parsed.get("device_id"),
        "timestamp": parsed.get("timestamp") or datetime.utcnow().isoformat(),
        "watt": None,
        "voltage": None,
        "current": None,
        "total_kwh": None,
        "raw": parsed
    }
    try:
        if "watt" in parsed and parsed["watt"] is not None:
            out["watt"] = float(parsed["watt"])
    except:
        pass
    try:
        if "voltage" in parsed and parsed["voltage"] is not None:
            out["voltage"] = float(parsed["voltage"])
    except:
        pass
    try:
        if "current" in parsed and parsed["current"] is not None:
            out["current"] = float(parsed["current"])
    except:
        pass
    try:
        if "total_kwh" in parsed and parsed["total_kwh"] is not None:
            out["total_kwh"] = float(parsed["total_kwh"])
    except:
        pass
    return out

def fetch_device_via_netlify(device_id):
    try:
        url = GET_DEVICE_ENDPOINT + "?device_id=" + device_id
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        j = r.json()
        # The netlify function returns { device_id, parsed, last5, raw }
        parsed = j.get("parsed") or {}
        parsed["device_id"] = device_id
        return parsed
    except Exception as e:
        print("Error fetching via netlify:", e)
        return None

def record_to_netlify(payload):
    try:
        r = requests.post(RECORD_ENDPOINT, json=payload, timeout=10)
        if r.status_code >= 200 and r.status_code < 300:
            return True
        else:
            print("record_to_netlify failed:", r.status_code, r.text)
            return False
    except Exception as e:
        print("record_to_netlify exception:", e)
        return False

def run_collector():
    devices = load_devices()
    if not devices:
        print("No devices found. Set DEVICE_ID env or provide devices.json in repo root.")
        return

    print("Collector targets:", devices)
    print("POLL_INTERVAL:", POLL_INTERVAL, "seconds")
    while True:
        for dev in devices:
            try:
                if TUYA_DIRECT:
                    # Direct Tuya call is left minimal; redirect to netlify is recommended
                    print("TUYA_DIRECT mode currently not implemented in collector. Use netlify endpoint instead.")
                    continue
                parsed = fetch_device_via_netlify(dev)
                if not parsed:
                    print("No parsed data for", dev)
                    continue
                record = parse_parsed_object(parsed)
                # Add any additional metadata
                record["collected_at"] = datetime.utcnow().isoformat()
                # Post to record endpoint (Netlify function) or directly to Supabase if you configured it
                ok = record_to_netlify(record)
                if ok:
                    print(f"[{datetime.utcnow().isoformat()}] Recorded telemetry for {dev} watt={record['watt']}")
                else:
                    print(f"[{datetime.utcnow().isoformat()}] Failed to record for {dev}")
            except Exception as e:
                print("Collector loop error:", e)
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    run_collector()
