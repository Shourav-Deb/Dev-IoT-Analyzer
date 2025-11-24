"""
Generate synthetic telemetry in the same DP scaling your devices use.
Run: python gen_synthetic_data.py --rooms 50 --days 30
It will post to Netlify function recordTelemetry or directly to Supabase REST.
"""
import argparse, random, time, requests, datetime, json
from pathlib import Path

SUPA_URL = "https://<your-supabase>.supabase.co"
SUPA_KEY = "<SUPA_KEY>"
POST_TO = "supabase"  # "supabase" or "function"
FUNCTION_URL = "https://your-site/.netlify/functions/recordTelemetry"

def load_baseline(csv_path):
    # expected CSV: timestamp, watt, voltage, current, energy_kwh
    import pandas as pd
    df = pd.read_csv(csv_path, parse_dates=["timestamp"])
    df = df.set_index("timestamp").resample("1min").mean().fillna(method="ffill").reset_index()
    return df

def synth_row(base_row, room_factor, noise_pct=0.03, off_prob=0.05):
    watt = float(base_row["watt"] or 0) * room_factor
    # occasional OFF
    if random.random() < off_prob:
        watt = 0.0
    watt *= (1 + random.uniform(-noise_pct, noise_pct))
    voltage = float(base_row["voltage"] or 230) * (1 + random.uniform(-0.01, 0.01))
    current = watt / max(1, voltage)
    energy = watt / 1000.0 / 60.0   # per minute
    return {
        "timestamp": base_row["timestamp"].isoformat(),
        "watt": round(watt, 3),
        "voltage": round(voltage, 2),
        "current": round(current, 4),
        "energy_kwh": round(energy, 6)
    }

def post_supabase(telemetry_rows):
    url = f"{SUPA_URL}/rest/v1/telemetry"
    headers = {"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}", "Content-Type": "application/json"}
    res = requests.post(url, headers=headers, data=json.dumps(telemetry_rows))
    return res.status_code, res.text

def post_func(rows):
    res = requests.post(FUNCTION_URL, json=rows)
    return res.status_code, res.text

def main(args):
    baseline = load_baseline(args.baseline)
    rooms = [f"F1-R{100+i}" for i in range(args.rooms)]
    output = []
    for r in rooms:
        factor = random.normalvariate(1.0, 0.12)
        for _, row in baseline.iterrows():
            s = synth_row(row, factor, noise_pct=0.05, off_prob=0.03)
            s["device_id"] = f"dev-{r}"
            s["room_id"] = r
            output.append(s)
            if len(output) >= 500:  # batch post
                if POST_TO == "supabase":
                    code, txt = post_supabase(output)
                else:
                    code, txt = post_func(output)
                print("posted batch", code)
                output = []
                time.sleep(0.5)
    if output:
        if POST_TO == "supabase":
            print(post_supabase(output))
        else:
            print(post_func(output))

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--baseline", required=True, help="CSV with baseline day")
    p.add_argument("--rooms", type=int, default=50)
    p.add_argument("--days", type=int, default=30)
    args = p.parse_args()
    main(args)
