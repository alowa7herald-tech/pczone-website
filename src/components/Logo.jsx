
import { Monitor } from "lucide-react";

function Logo() {
  return (
    <a href="/" className="brand">
      <div className="brand-icon">
        <Monitor size={22} />
        <span className="brand-dot"></span>
      </div>

      <div className="brand-text">
        <span className="brand-name">
          PC<span>ZONE</span>
        </span>

        <span className="brand-tagline">
          GAMING LOUNGE
        </span>
      </div>
    </a>
  );
}

export default Logo;
