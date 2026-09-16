import type { MonthGroup } from '../../systems/DateSystem';

interface TimelineBarProps {
  selectedYear: number;
  months: MonthGroup[];
  currentMonth: number | null;
  onYearChange: (year: number) => void;
  onMonthClick: (month: MonthGroup) => void;
}

export function TimelineBar({
  selectedYear,
  months,
  currentMonth,
  onYearChange,
  onMonthClick,
}: TimelineBarProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i); // [2026, 2025, 2024, 2023, 2022, 2021]

  return (
    <div className="timeline-bar">
      <div className="timeline-track">
        {/* Zone (Year) Selector */}
        <div className="timeline-zone-selector">
          <span className="zone-lbl">ZONE</span>
          <select
            className="zone-select"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            title="Select City Zone (Year)"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="timeline-divider" />

        {/* Sector (Month) Buttons */}
        <div className="timeline-sectors">
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
    </div>
  );
}
