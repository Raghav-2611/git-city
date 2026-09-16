import type { CityData, CityBlock } from '../types/contribution';
import { getMonth, getMonthName } from '../utils/mathUtils';
import { BLOCK_SPACING } from '../services/ContributionMapper';

export interface MonthGroup {
  month: number;           // 1–12
  monthName: string;
  districtName: string;    // e.g. "SECTOR 01: JANUARY"
  sectorCode: string;      // e.g. "SECTOR 01"
  zoneName: string;        // e.g. "ZONE 2025"
  startZ: number;
  endZ: number;
  blocks: CityBlock[];
}

/**
 * Groups city blocks by month (Sectors) and year (Zones),
 * computing world-space ranges for each month/sector.
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
    const year = this.cityData.year;
    const zoneName = `ZONE ${year}`;

    for (const [month, blocks] of Array.from(grouped.entries()).sort(([a], [b]) => a - b)) {
      const zPositions = blocks.map((b) => b.worldZ);
      const startZ = Math.min(...zPositions);
      const endZ = Math.max(...zPositions) + BLOCK_SPACING;
      const monthName = getMonthName(blocks[0].day.date);
      const sectorCode = `SECTOR ${month.toString().padStart(2, '0')}`;
      const districtName = `${sectorCode}: ${monthName.toUpperCase()}`;

      groups.push({
        month,
        monthName,
        districtName,
        sectorCode,
        zoneName,
        startZ,
        endZ,
        blocks,
      });
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

  getCityStart(): number {
    return 0;
  }

  getCityEnd(): number {
    return this.cityData.cityLength;
  }
}
