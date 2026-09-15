// Core contribution data types

export interface ContributionDay {
  date: string; // "YYYY-MM-DD"
  contributions: number;
  commits?: number;
  pullRequests?: number;
  issues?: number;
}

export interface ContributionData {
  username: string;
  year: number;
  days: ContributionDay[];
}

export interface CityBlock {
  day: ContributionDay;
  side: 'left' | 'right';
  blockIndex: number;     // sequential index along the road
  worldZ: number;         // Z position in 3D world
  worldX: number;         // X position in 3D world
}

export interface CityData {
  blocks: CityBlock[];
  username: string;
  year: number;
  totalDays: number;
  cityLength: number;     // total world-space length of city
}

export type AppPhase =
  | 'start'       // username input screen
  | 'loading'     // building the city
  | 'cinematic'   // intro flyover
  | 'driving';    // player in control
