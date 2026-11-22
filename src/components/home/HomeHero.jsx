
import { ArrowRight, Cpu, Gauge, MonitorPlay } from "lucide-react";
import { Link } from "react-router-dom";
import StationTile, { stationState } from "../StationTile";

function HomeHero({ user, stations = [], loading = false }) {
  const board = stations.slice(0, 12);

  const free = stations.filter(
    (station) => stationState(station) === "available"
  ).length;

  const firstName =
    user?.name?.split(" ")[0] ||
    user?.displayName?.split(" ")[0];

  return (
    <section className="hero-section">
      <div className="hero-glow hero-glow-left"></div>
      <div className="hero-glow hero-glow-right"></div>

      <div className="hero-container">
        <div className="hero-content">
          <div className="status-label">
            <span className="pulse-dot"></span>
            {loading ? "READING THE FLOOR" : `${free} RIGS FREE RIGHT NOW`}
          </div>

          <h1>
            {firstName ? (
              <>
                WELCOME BACK,
                <br />
                <span>{firstName}.</span>
              </>
            ) : (
              <>
                YOUR RIG
                <br />
                <span>IS WAITING.</span>
              </>
            )}
          </h1>

          <p className="hero-description">
            PC ZONE is a neon-lit gaming lounge built on high-performance PCs.
            Reserve the exact station you want before you arrive — walk in,
            sit down, and play. No queue, no waiting for a free machine.
          </p>

          <div className="hero-buttons">
            <Link to="/reserve" className="primary-button">
              Reserve a rig <ArrowRight size={17} />
            </Link>

            <Link to="/pricing" className="secondary-button">
              View pricing
            </Link>
          </div>

          <div className="hero-specs">
            <div>
              <Cpu />
              RTX-class GPUs
            </div>

            <div>
              <Gauge />
              240Hz displays
            </div>

            <div>
              <MonitorPlay />
              Fiber connection
            </div>
          </div>
        </div>

        <div className="floor-panel">
          <div className="corner corner-top"></div>
          <div className="corner corner-bottom"></div>

          <div className="floor-header">
            <span>LIVE FLOOR</span>

            <div className="live-indicator">
              <span></span>
              LIVE
            </div>
          </div>

          <div className="station-grid">
            {loading || board.length === 0
              ? Array.from({ length: 12 }).map((_, index) => (
                  <div className="station-tile" key={index}>
                    <MonitorPlay />
                    <span>PC {String(index + 1).padStart(2, "0")}</span>
                    <small>LOADING</small>
                  </div>
                ))
              : board.map((station) => (
                  <StationTile
                    key={station.id}
                    station={station}
                    compact
                  />
                ))}
          </div>

          <Link to="/reserve" className="floor-link">
            View all stations <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
