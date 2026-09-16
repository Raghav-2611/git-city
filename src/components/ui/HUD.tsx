import type { MonthGroup } from '../../systems/DateSystem';

interface HUDProps {
  username: string;
  year: number;
  currentDistrict: MonthGroup | null;
  currentDate: string | null;
  speed: number;
  onMenu: () => void;
}

export function HUD({ username, year, currentDistrict, currentDate, speed, onMenu }: HUDProps) {
  const speedKmh = Math.round(Math.abs(speed) * 3.6);
  const displayName = username.toLowerCase() === 'raghav-2611' ? "RAGHAV'S CITY" : `${username.toUpperCase()}'S CITY`;

  return (
    <div className="hud">
      {/* Top-left: branding */}
      <div className="hud-topleft">
        <div className="hud-logo">
          <span className="hud-logo-git">GIT</span>
          <span className="hud-logo-city">CITY</span>
        </div>
        <div className="hud-tagline">{displayName}</div>
        <div className="hud-username">ZONE {year} · @{username}</div>
      </div>

      {/* Top-right: current date */}
      <div className="hud-topright">
        {currentDate && (
          <div className="hud-date">
            {formatHUDDate(currentDate)}
          </div>
        )}
      </div>

      {/* Bottom-left: sector name */}
      <div className="hud-bottomleft">
        {currentDistrict && (
          <>
            <div className="hud-district-label">CURRENT LOCATION</div>
            <div className="hud-district-name">{currentDistrict.districtName}</div>
            <div className="hud-district-month">{currentDistrict.zoneName}</div>
          </>
        )}
      </div>

      {/* Bottom-right: controls */}
      <div className="hud-bottomright">
        <div className="hud-speed">
          <span className="hud-speed-value">{speedKmh}</span>
          <span className="hud-speed-unit">km/h</span>
        </div>
        <div className="hud-controls">
          <div className="hud-control-row">
            <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
            <span>DRIVE</span>
          </div>
          <div className="hud-control-row">
            <kbd>SPACE</kbd>
            <span>BRAKE</span>
          </div>
          <div className="hud-control-row">
            <kbd>R</kbd>
            <span>RESET</span>
          </div>
          <div className="hud-control-row">
            <kbd>ESC</kbd>
            <span onClick={onMenu} style={{ cursor: 'pointer' }}>RESTART</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatHUDDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}
