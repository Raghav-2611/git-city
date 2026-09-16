import type { CityBlock } from '../../types/contribution';
import { formatDate } from '../../utils/mathUtils';

interface BuildingInfoCardProps {
  block: CityBlock | null;
  visible: boolean;
}

export function BuildingInfoCard({ block, visible }: BuildingInfoCardProps) {
  if (!block) return null;

  const { day } = block;
  const count = day.contributions;

  // Impact level calculation
  let surgeTitle = 'REST DAY / EMPTY LOT';
  let surgeColor = '#888899';
  if (count === 1) {
    surgeTitle = 'LIGHT MAINTENANCE';
    surgeColor = '#4ae3b5';
  } else if (count >= 2 && count <= 5) {
    surgeTitle = 'ACTIVE SPRINT';
    surgeColor = '#f5c842';
  } else if (count >= 6 && count <= 14) {
    surgeTitle = 'MAJOR FEATURE RELEASE';
    surgeColor = '#ff8833';
  } else if (count >= 15) {
    surgeTitle = 'LEGENDARY CODE SURGE 👑';
    surgeColor = '#ff3366';
  }

  return (
    <div className={`info-card ${visible ? 'info-card--visible' : ''}`}>
      <div className="info-card-header">
        <span className="info-card-surge-badge" style={{ borderColor: surgeColor, color: surgeColor }}>
          {surgeTitle}
        </span>
        <div className="info-card-date">{formatDate(day.date)}</div>
      </div>

      <div className="info-card-contributions">
        <span className="info-card-count">{count}</span>
        <span className="info-card-label">
          {count === 1 ? 'TOTAL CONTRIBUTION' : 'TOTAL CONTRIBUTIONS'}
        </span>
      </div>

      <div className="info-card-floors">
        <div className="floor-bars">
          {Array.from({ length: Math.min(count, 20) }).map((_, i) => (
            <div
              key={i}
              className="floor-bar"
              style={{ animationDelay: `${i * 30}ms`, backgroundColor: surgeColor }}
            />
          ))}
          {count > 20 && (
            <span className="floor-overflow">+{count - 20}</span>
          )}
        </div>
        <span className="floor-label">
          {count === 0 ? 'EMPTY LOT' : `${count} FLOOR TOWER`}
        </span>
      </div>

      {count > 0 && (
        <div className="info-card-grid">
          <div className="info-metric-item">
            <span className="metric-icon">🔨</span>
            <div className="metric-details">
              <span className="metric-val">{day.commits ?? Math.ceil(count * 0.7)}</span>
              <span className="metric-lbl">COMMITS</span>
            </div>
          </div>

          <div className="info-metric-item">
            <span className="metric-icon">🔀</span>
            <div className="metric-details">
              <span className="metric-val">{day.pullRequests ?? (count > 2 ? 1 : 0)}</span>
              <span className="metric-lbl">PULL REQUESTS</span>
            </div>
          </div>

          <div className="info-metric-item">
            <span className="metric-icon">🐛</span>
            <div className="metric-details">
              <span className="metric-val">{day.issues ?? (count > 4 ? 1 : 0)}</span>
              <span className="metric-lbl">ISSUES</span>
            </div>
          </div>

          <div className="info-metric-item">
            <span className="metric-icon">📦</span>
            <div className="metric-details">
              <span className="metric-val">{day.repositories ?? Math.min(Math.ceil(count / 3), 4)}</span>
              <span className="metric-lbl">REPOS IMPACTED</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
