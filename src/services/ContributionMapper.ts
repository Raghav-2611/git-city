import type { ContributionData, CityBlock, CityData } from '../types/contribution';

// World-space constants
export const BLOCK_SPACING = 22;       // Z distance per day (building depth + gap)
export const ROAD_HALF_WIDTH = 9;      // Half the road width
export const BUILDING_SETBACK = 2;     // Gap between road edge and building face

// Left side X and right side X
export const LEFT_X = -(ROAD_HALF_WIDTH + BUILDING_SETBACK + 6); // ~-17
export const RIGHT_X = (ROAD_HALF_WIDTH + BUILDING_SETBACK + 6);  // ~+17

/**
 * Maps raw ContributionData → CityData.
 * Days are placed in pairs on left/right sides of the road, chronologically.
 */
export function mapToCityData(data: ContributionData): CityData {
  const blocks: CityBlock[] = [];

  data.days.forEach((day, index) => {
    const blockIndex = Math.floor(index / 2);
    const side: 'left' | 'right' = index % 2 === 0 ? 'left' : 'right';
    const worldZ = blockIndex * BLOCK_SPACING;
    const worldX = side === 'left' ? LEFT_X : RIGHT_X;

    blocks.push({
      day,
      side,
      blockIndex,
      worldZ,
      worldX,
    });
  });

  const totalDays = data.days.length;
  const totalBlocks = Math.ceil(totalDays / 2);
  const cityLength = totalBlocks * BLOCK_SPACING;

  return {
    blocks,
    username: data.username,
    year: data.year,
    totalDays,
    cityLength,
  };
}
