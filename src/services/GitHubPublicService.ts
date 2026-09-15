import type { ContributionData } from '../types/contribution';

const PUBLIC_API_BASE = 'https://github-contributions-api.jogruber.de/v4';

interface PublicContributionDay {
  date: string; // "YYYY-MM-DD"
  count: number;
  level: number;
}

interface PublicApiResponse {
  total: Record<string, number>;
  contributions: PublicContributionDay[];
}

export class GitHubPublicService {
  /**
   * Fetches public contribution history for any GitHub user without requiring an API token.
   */
  static async fetchContributions(username: string, year: number): Promise<ContributionData> {
    const url = `${PUBLIC_API_BASE}/${encodeURIComponent(username)}?y=${year}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub contributions for "${username}" (Status ${response.status})`);
    }

    const json: PublicApiResponse = await response.json();
    const todayStr = new Date().toISOString().split('T')[0];

    const days = (json.contributions || [])
      .filter((item) => item.date.startsWith(`${year}`))
      .map((item) => ({
        date: item.date,
        contributions: item.date > todayStr ? 0 : item.count,
        commits: item.count > 0 ? Math.ceil(item.count * 0.8) : 0,
      }));

    if (days.length === 0) {
      throw new Error(`No contribution data found for GitHub user "${username}" in year ${year}.`);
    }

    return {
      username,
      year,
      days,
    };
  }
}
