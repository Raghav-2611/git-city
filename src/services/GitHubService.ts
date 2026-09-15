import type { ContributionData } from '../types/contribution';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

interface GitHubContributionDay {
  date: string;
  contributionCount: number;
}

interface GitHubWeek {
  contributionDays: GitHubContributionDay[];
}

interface GitHubContributionsCollection {
  contributionCalendar: {
    weeks: GitHubWeek[];
  };
}

interface GitHubUserData {
  contributionsCollection: GitHubContributionsCollection;
}

function buildQuery(username: string, from: string, to: string): string {
  return `
    query {
      user(login: "${username}") {
        contributionsCollection(from: "${from}", to: "${to}") {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;
}

export class GitHubService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async fetchContributions(username: string, year: number): Promise<ContributionData> {
    const from = `${year}-01-01T00:00:00Z`;
    const to = `${year}-12-31T23:59:59Z`;

    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: buildQuery(username, from, to) }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (json.errors) {
      const msg = json.errors[0]?.message ?? 'Unknown GitHub API error';
      throw new Error(msg);
    }

    const userData: GitHubUserData | null = json.data?.user;
    if (!userData) {
      throw new Error(`GitHub user "${username}" not found.`);
    }

    const weeks = userData.contributionsCollection.contributionCalendar.weeks;
    const days = weeks.flatMap((week) =>
      week.contributionDays.map((d) => ({
        date: d.date,
        contributions: d.contributionCount,
      }))
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const filtered = days
      .filter((d) => d.date.startsWith(`${year}`))
      .map((d) => ({
        ...d,
        contributions: d.date > todayStr ? 0 : d.contributions,
      }));

    return { username, year, days: filtered };
  }
}
