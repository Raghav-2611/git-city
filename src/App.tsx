import { useState, useCallback, useEffect } from 'react';
import { CityScene } from './components/scene/CityScene';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { HUD } from './components/ui/HUD';
import { TimelineBar } from './components/ui/TimelineBar';
import { BuildingInfoCard } from './components/ui/BuildingInfoCard';
import { useGitHubData } from './hooks/useGitHubData';
import { mapToCityData } from './services/ContributionMapper';
import { DateSystem } from './systems/DateSystem';
import type { AppPhase, CityData, CityBlock } from './types/contribution';
import type { MonthGroup } from './systems/DateSystem';

const TARGET_USERNAME = 'Raghav-2611';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('loading');
  const [username] = useState(TARGET_USERNAME);
  const [cityData, setCityData] = useState<CityData | null>(null);
  const [dateSystem, setDateSystem] = useState<DateSystem | null>(null);

  // HUD state
  const [currentDistrict, setCurrentDistrict] = useState<MonthGroup | null>(null);
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [speed, setSpeed] = useState(0);
  const [nearBlock, setNearBlock] = useState<CityBlock | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  // Month jump
  const [jumpToZ, setJumpToZ] = useState<number | null>(null);

  const { data, state: fetchState, error, fetchData } = useGitHubData();

  // Load Raghav-2611's city automatically on mount
  useEffect(() => {
    const year = new Date().getFullYear() - 1;
    fetchData(TARGET_USERNAME, year);
  }, [fetchData]);

  // When data arrives, build city
  useEffect(() => {
    if (fetchState === 'success' && data) {
      const city = mapToCityData(data);
      setCityData(city);
      setDateSystem(new DateSystem(city));
      setPhase('driving');
    }
  }, [fetchState, data]);

  const handleNearBlock = useCallback((block: CityBlock | null) => {
    setNearBlock(block);
    setInfoVisible(block !== null);
  }, []);

  const handleJumpToMonth = useCallback(
    (group: MonthGroup) => {
      setJumpToZ(group.startZ + 5);
    },
    []
  );

  const handleJumpConsumed = useCallback(() => setJumpToZ(null), []);

  const handleRestart = useCallback(() => {
    setJumpToZ(0); // Jump back to start of highway
  }, []);

  const handleRetry = useCallback(() => {
    setPhase('loading');
    const year = new Date().getFullYear() - 1;
    fetchData(TARGET_USERNAME, year);
  }, [fetchData]);

  return (
    <div className="app-root">
      {/* ── Loading screen ────────────────────────────── */}
      {phase === 'loading' && (
        <LoadingScreen username={username} />
      )}

      {/* ── Error overlay ─────────────────────────────── */}
      {fetchState === 'error' && error && (
        <div className="error-overlay">
          <p className="error-message">{error}</p>
          <button className="btn-secondary" onClick={handleRetry}>
            RETRY LOADING CITY
          </button>
        </div>
      )}

      {/* ── 3D City scene + HUD ───────────────────────── */}
      {phase === 'driving' && cityData && (
        <>
          <div className="scene-container">
            <CityScene
              cityData={cityData}
              onDistrictChange={setCurrentDistrict}
              onDateChange={setCurrentDate}
              onSpeedChange={setSpeed}
              onNearBlock={handleNearBlock}
              jumpToZ={jumpToZ}
              onJumpConsumed={handleJumpConsumed}
            />
          </div>

          <HUD
            username={username}
            year={cityData.year}
            currentDistrict={currentDistrict}
            currentDate={currentDate}
            speed={speed}
            onMenu={handleRestart}
          />

          {dateSystem && (
            <TimelineBar
              months={dateSystem.getMonthGroups()}
              currentMonth={currentDistrict?.month ?? null}
              onMonthClick={handleJumpToMonth}
            />
          )}

          <BuildingInfoCard
            block={nearBlock}
            visible={infoVisible}
          />
        </>
      )}
    </div>
  );
}
