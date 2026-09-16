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

  return (
    <div className="hud">
      {/* Top-left: branding */}
      <div className="hud-topleft">
        <div className="hud-logo">
          <span className="hud-logo-git">GIT</span>
          <span className="hud-logo-city">CITY</span>
        </div>
        <div className="hud-tagline">YOUR GITHUB, AS A CITY</div>
        <div className="hud-username">@{username} · {year}</div>
      </div>

      {/* Top-right: current date */}
      <div className="hud-topright">
        {currentDate && (
          <div className="hud-date">
            {formatHUDDate(currentDate)}
          </div>
        )}
      </div>

      {/* Bottom-left: district name */}
      <div className="hud-bottomleft">
        {currentDistrict && (
          <>
            <div className="hud-district-label">DISTRICT</div>
            <div className="hud-district-name">{currentDistrict.districtName}</div>
            <div className="hud-district-month">{currentDistrict.monthName.toUpperCase()}</div>
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
            <span onClick={onMenu} style={{ cursor: 'pointer' }}>MENU</span>
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
