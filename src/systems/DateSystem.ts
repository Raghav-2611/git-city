import type { CityData, CityBlock } from '../types/contribution';
import { getMonth, getMonthName } from '../utils/mathUtils';
import { BLOCK_SPACING } from '../services/ContributionMapper';

export interface MonthGroup {
  month: number;           // 1–12
  monthName: string;
  districtName: string;
  startZ: number;
  endZ: number;
  blocks: CityBlock[];
}

const DISTRICT_NAMES = [
  'Harbor District',
  'Mercer District',
  'Capitol Hill',
  'Pioneer Square',
  'Eastside Quarter',
  'Belltown',
  'South End',
  'Lakefront',
  'Midtown',
  'The Heights',
  'Riverside',
  'Northgate',
];

/**
 * Groups city blocks by month, computes world-space ranges for each month,
 * and provides district name lookup.
 */
export class DateSystem {
  private monthGroups: MonthGroup[];
  private cityData: CityData;

  constructor(cityData: CityData) {
    this.cityData = cityData;
    this.monthGroups = this.buildMonthGroups();
  }

  private buildMonthGroups(): MonthGroup[] {
    const grouped = new Map<number, CityBlock[]>();

    for (const block of this.cityData.blocks) {
      const month = getMonth(block.day.date);
      if (!grouped.has(month)) grouped.set(month, []);
      grouped.get(month)!.push(block);
    }

    const groups: MonthGroup[] = [];
    let districtIndex = 0;

    for (const [month, blocks] of Array.from(grouped.entries()).sort(([a], [b]) => a - b)) {
      const zPositions = blocks.map((b) => b.worldZ);
      const startZ = Math.min(...zPositions);
      const endZ = Math.max(...zPositions) + BLOCK_SPACING;

      groups.push({
        month,
        monthName: getMonthName(blocks[0].day.date),
        districtName: DISTRICT_NAMES[districtIndex % DISTRICT_NAMES.length],
        startZ,
        endZ,
        blocks,
      });

      districtIndex++;
    }

    return groups;
  }

  getMonthGroups(): MonthGroup[] {
    return this.monthGroups;
  }

  /** Returns the district/month for a given world-space Z position */
  getDistrictAtZ(z: number): MonthGroup | null {
    for (const group of this.monthGroups) {
      if (z >= group.startZ && z <= group.endZ) return group;
    }
    return null;
  }

  /** Returns the world Z start position of a given month (1-indexed) */
  getMonthStartZ(month: number): number {
    const group = this.monthGroups.find((g) => g.month === month);
    return group?.startZ ?? 0;
  }

  /** Returns city start Z (oldest contributions) */
  getCityStart(): number {
    return 0;
  }

  /** Returns city end Z (newest contributions) */
  getCityEnd(): number {
    return this.cityData.cityLength;
  }
}
