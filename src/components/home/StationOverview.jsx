
import { ArrowRight, Clock, CheckCircle2, Wifi } from "lucide-react";
import { Link } from "react-router-dom";
import StationTile from "../StationTile";
import SectionHeading from "../SectionHeading";

const businessInfo = [
  {
    icon: Clock,
    label: "Open daily",
    value: "10:00 — 00:00",
  },
  {
    icon: CheckCircle2,
    label: "Walk-ins",
    value: "Held 15 min after start",
  },
  {
    icon: Wifi,
    label: "On every rig",
    value: "Fibre + 240Hz",
  },
];

function StationOverview({ stations = [], loading = false }) {
  const displayStations = stations.length > 0
    ? stations
    : Array.from({ length: 12 }, (_, index) => ({
        id: `PC-${String(index + 1).padStart(2, "0")}`,
        label: `PC ${String(index + 1).padStart(2, "0")}`,
        status: "available",
        occupied: false,
      }));

  return (
    <section className="station-overview-section">
      <div className="station-overview-container">
        <div className="station-heading">
          <SectionHeading
            title={`${stations.length || 12} stations, one grid`}
            description="Pick the machine you want by number. Cyan means it is free for your session — grey is already taken."
          />

          <Link to="/reserve" className="overview-book-button">
            Book a seat <ArrowRight size={16} />
          </Link>
        </div>

        <div className="overview-station-grid">
          {loading
            ? Array.from({ length: 12 }).map((_, index) => (
                <div className="station-tile" key={index}>
                  <span>PC {String(index + 1).padStart(2, "0")}</span>
                  <small>LOADING</small>
                </div>
              ))
            : displayStations.map((station) => (
                <StationTile key={station.id} station={station} />
              ))}
        </div>

        <div className="station-legend">
          <span>
            <i className="legend-available"></i>
            Available
          </span>

          <span>
            <i className="legend-occupied"></i>
            In use
          </span>

          <span>
            <i className="legend-maintenance"></i>
            Maintenance
          </span>
        </div>

        <div className="business-info-grid">
          {businessInfo.map(({ icon: Icon, label, value }) => (
            <div className="business-info-card" key={label}>
              <Icon />
              <div>
                <p>{label}</p>
                <strong>{value}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StationOverview;
