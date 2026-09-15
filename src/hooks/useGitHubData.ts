import { useState, useCallback } from 'react';
import type { ContributionData } from '../types/contribution';
import { GitHubService } from '../services/GitHubService';
import { GitHubPublicService } from '../services/GitHubPublicService';
import { generateMockData } from '../services/MockService';

type FetchState = 'idle' | 'loading' | 'success' | 'error';

interface UseGitHubDataResult {
  data: ContributionData | null;
  state: FetchState;
  error: string | null;
  fetchData: (username: string, year: number, token?: string) => Promise<void>;
  loadDemo: (year?: number) => void;
}

/**
 * Hook for fetching GitHub contribution data.
 * Tries official authenticated GraphQL API if token present,
 * otherwise fetches real public profile data via public API without token,
 * falling back to mock data if offline.
 */
export function useGitHubData(): UseGitHubDataResult {
  const [data, setData] = useState<ContributionData | null>(null);
  const [state, setState] = useState<FetchState>('idle');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (username: string, year: number, token?: string) => {
    setState('loading');
    setError(null);

    const authToken = token?.trim() || (import.meta.env.VITE_GITHUB_TOKEN as string | undefined);

    if (authToken) {
      try {
        const service = new GitHubService(authToken);
        const result = await service.fetchContributions(username, year);
        setData(result);
        setState('success');
        return;
      } catch (err: unknown) {
        console.warn('Authenticated GitHub API failed, trying public endpoint...', err);
      }
    }

    // Unauthenticated: Fetch real public contribution data (no PAT required!)
    try {
      const result = await GitHubPublicService.fetchContributions(username, year);
      setData(result);
      setState('success');
    } catch (publicErr: unknown) {
      console.warn('Public GitHub API failed, falling back to mock data:', publicErr);
      const mock = generateMockData(year, username);
      setData(mock);
      setState('success');
    }
  }, []);

  const loadDemo = useCallback((year: number = new Date().getFullYear() - 1) => {
    setState('loading');
    setTimeout(() => {
      const mock = generateMockData(year, 'demo');
      setData(mock);
      setState('success');
    }, 1500);
  }, []);

  return { data, state, error, fetchData, loadDemo };
}
