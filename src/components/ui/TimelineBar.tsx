import type { MonthGroup } from '../../systems/DateSystem';

interface TimelineBarProps {
  months: MonthGroup[];
  currentMonth: number | null;
  onMonthClick: (month: MonthGroup) => void;
}

export function TimelineBar({ months, currentMonth, onMonthClick }: TimelineBarProps) {
  return (
    <div className="timeline-bar">
      <div className="timeline-track">
        {months.map((m) => (
          <button
            key={m.month}
            className={`timeline-month ${currentMonth === m.month ? 'timeline-month--active' : ''}`}
            onClick={() => onMonthClick(m)}
            title={`Jump to Sector ${m.month.toString().padStart(2, '0')}: ${m.monthName}`}
          >
            <span className="timeline-month-abbr">
              S{m.month.toString().padStart(2, '0')} · {m.monthName.slice(0, 3).toUpperCase()}
            </span>
            <div className="timeline-month-dot" />
          </button>
        ))}
      </div>
    </div>
  );
}
