import React from "react";
import { Link } from "react-router-dom";

export default function RoomTile({ room, onRefresh }) {
  const parsed = room.parsed || {};
  const watt = parsed.watt ?? (parsed.cur_power ? parsed.cur_power / 10 : 0);
  const is_on = parsed.switch ?? parsed.switch_1 ?? false;

  const color = watt > 800 ? "tile-red" : watt > 200 ? "tile-amber" : "tile-green";

  return (
    <div className={`room-tile ${color}`}>
      <div className="tile-head">
        <div className="room-name">{room.id}</div>
        <div className="room-id">{is_on ? "ON" : "OFF"}</div>
      </div>
      <div className="tile-body">
        <div className="big-metric">{(watt || 0).toFixed(1)} W</div>
      </div>
      <div className="tile-actions">
        <Link to={`/room/${room.id}`}><button>Open</button></Link>
        <button onClick={onRefresh}>↻</button>
      </div>
    </div>
  );
}
