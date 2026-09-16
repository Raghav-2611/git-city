import { useState, useCallback, useEffect } from 'react';
import { CityScene } from './components/scene/CityScene';
import { StartScreen } from './components/ui/StartScreen';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { HUD } from './components/ui/HUD';
import { TimelineBar } from './components/ui/TimelineBar';
import { BuildingInfoCard } from './components/ui/BuildingInfoCard';
import { useGitHubData } from './hooks/useGitHubData';
import { mapToCityData } from './services/ContributionMapper';
import { DateSystem } from './systems/DateSystem';
import type { AppPhase, CityData, CityBlock } from './types/contribution';
import type { MonthGroup } from './systems/DateSystem';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('start');
  const [username, setUsername] = useState('');
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

  const { data, state: fetchState, error, fetchData, loadDemo } = useGitHubData();

  // When data arrives, build city
  useEffect(() => {
    if (fetchState === 'success' && data) {
      const city = mapToCityData(data);
      setCityData(city);
      setDateSystem(new DateSystem(city));
      setPhase('driving');
    }
  }, [fetchState, data]);

  // Auto-start if username is stored or set in env
  useEffect(() => {
    const savedUsername = localStorage.getItem('gitcity_username') || (import.meta.env.VITE_GITHUB_USERNAME as string | undefined);
    if (savedUsername && phase === 'start') {
      const year = new Date().getFullYear() - 1; // default to past complete year or current
      setUsername(savedUsername);
      setPhase('loading');
      fetchData(savedUsername, year);
    }
  }, []);

  const handleStart = useCallback(
    async (uname: string, year: number, token?: string) => {
      localStorage.setItem('gitcity_username', uname);
      setUsername(uname);
      setPhase('loading');
      await fetchData(uname, year, token);
    },
    [fetchData]
  );

  const handleDemo = useCallback(() => {
    setUsername('demo');
    setPhase('loading');
    loadDemo();
  }, [loadDemo]);

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

  const handleMenu = useCallback(() => {
    setPhase('start');
    setCityData(null);
    setDateSystem(null);
    setNearBlock(null);
    setInfoVisible(false);
  }, []);

  // ESC key → menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && phase === 'driving') handleMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, handleMenu]);

  return (
    <div className="app-root">
      {/* ── Start screen ──────────────────────────────── */}
      {phase === 'start' && (
        <StartScreen onSubmit={handleStart} onDemo={handleDemo} />
      )}

      {/* ── Loading screen ────────────────────────────── */}
      {phase === 'loading' && (
        <LoadingScreen username={username} />
      )}

      {/* ── Error overlay ─────────────────────────────── */}
      {fetchState === 'error' && error && (
        <div className="error-overlay">
          <p className="error-message">{error}</p>
          <button className="btn-secondary" onClick={() => setPhase('start')}>
            TRY AGAIN
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
            onMenu={handleMenu}
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
