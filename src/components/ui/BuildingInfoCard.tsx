import type { CityBlock } from '../../types/contribution';
import { formatDate } from '../../utils/mathUtils';

interface BuildingInfoCardProps {
  block: CityBlock | null;
  visible: boolean;
}

export function BuildingInfoCard({ block, visible }: BuildingInfoCardProps) {
  if (!block) return null;

  const { day } = block;
  const floorCount = day.contributions;

  return (
    <div className={`info-card ${visible ? 'info-card--visible' : ''}`}>
      <div className="info-card-date">{formatDate(day.date)}</div>

      <div className="info-card-contributions">
        <span className="info-card-count">{day.contributions}</span>
        <span className="info-card-label">
          {day.contributions === 1 ? 'CONTRIBUTION' : 'CONTRIBUTIONS'}
        </span>
      </div>

      <div className="info-card-floors">
        <div className="floor-bars">
          {Array.from({ length: Math.min(floorCount, 20) }).map((_, i) => (
            <div
              key={i}
              className="floor-bar"
              style={{ animationDelay: `${i * 30}ms` }}
            />
          ))}
          {floorCount > 20 && (
            <span className="floor-overflow">+{floorCount - 20}</span>
          )}
        </div>
        <span className="floor-label">
          {floorCount === 0 ? 'EMPTY LOT' : `${floorCount} FLOOR${floorCount !== 1 ? 'S' : ''}`}
        </span>
      </div>

      {day.commits !== undefined && day.commits > 0 && (
        <div className="info-card-meta">
          <span>{day.commits} commits</span>
          {day.pullRequests !== undefined && day.pullRequests > 0 && (
            <span>{day.pullRequests} PR{day.pullRequests !== 1 ? 's' : ''}</span>
          )}
          {day.issues !== undefined && day.issues > 0 && (
            <span>{day.issues} issue{day.issues !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}
    </div>
  );
}
