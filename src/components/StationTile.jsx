
import { Monitor, Wrench } from "lucide-react";

export function stationState(station) {
  const status = (station.status || "").toLowerCase();

  if (status === "maintenance") return "maintenance";
  if (status === "offline") return "offline";
  if (status === "occupied" || station.occupied) return "occupied";

  return "available";
}

function StationTile({ station, compact = false, onClick }) {
  const state = stationState(station);

  const Icon = state === "maintenance" ? Wrench : Monitor;

  const labels = {
    available: "AVAILABLE",
    occupied: "IN USE",
    maintenance: "MAINTENANCE",
    offline: "OFFLINE",
  };

  return (
    <button
      type="button"
      className={`station-tile ${state} ${compact ? "compact" : ""}`}
      disabled={state !== "available"}
      onClick={onClick}
    >
      <Icon />
      <span>{station.label || station.id}</span>
      <small>{labels[state]}</small>
    </button>
  );
}

export default StationTile;
