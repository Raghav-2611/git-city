import type { ContributionDay, ContributionData } from '../types/contribution';

/**
 * Generates a realistic full-year contribution dataset.
 * Mimics real developer activity: quiet periods, sprint bursts, weekends off.
 */
export function generateMockData(year: number = 2025, username: string = 'demo'): ContributionData {
  const days: ContributionDay[] = [];
  const startDate = new Date(`${year}-01-01T00:00:00`);
  const endDate = new Date(`${year}-12-31T00:00:00`);

  // Simulate developer activity patterns
  let currentDate = new Date(startDate);
  let streakActive = false;
  let streakLength = 0;
  let quietLength = 0;

  const todayStr = new Date().toISOString().split('T')[0];

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFuture = dateStr > todayStr;

    let contributions = 0;

    if (!isFuture) {
      if (streakActive) {
        // During a streak, contribute most days
        if (!isWeekend || Math.random() < 0.3) {
          const base = Math.floor(Math.random() * 8) + 1;
          // Occasional spike days
          if (Math.random() < 0.1) {
            contributions = Math.floor(Math.random() * 20) + 10; // 10–30
          } else {
            contributions = base;
          }
        }
        streakLength--;
        if (streakLength <= 0) {
          streakActive = false;
          quietLength = Math.floor(Math.random() * 14) + 3; // 3–17 days quiet
        }
      } else {
        // During quiet period, occasional small contributions
        if (!isWeekend && Math.random() < 0.2) {
          contributions = Math.floor(Math.random() * 3) + 1;
        }
        quietLength--;
        if (quietLength <= 0) {
          streakActive = true;
          streakLength = Math.floor(Math.random() * 21) + 5; // 5–25 day streak
        }
      }
    }

    days.push({
      date: dateStr,
      contributions,
      commits: contributions > 0 ? Math.ceil(contributions * 0.7) : 0,
      pullRequests: contributions > 5 ? Math.floor(Math.random() * 3) : 0,
      issues: contributions > 3 ? Math.floor(Math.random() * 2) : 0,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { username, year, days };
}
