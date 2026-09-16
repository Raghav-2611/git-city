import { useState, type FormEvent } from 'react';

interface StartScreenProps {
  onSubmit: (username: string, year: number, token?: string) => void;
  onDemo: () => void;
}

export function StartScreen({ onSubmit, onDemo }: StartScreenProps) {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onSubmit(username.trim(), year, token.trim() || undefined);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="start-screen">
      <div className="start-bg-overlay" />

      <div className="start-content">
        <div className="start-logo">
          <span className="logo-git">GIT</span>
          <span className="logo-city">CITY</span>
        </div>
        <p className="start-tagline">YOUR GITHUB, AS A CITY</p>

        <div className="start-concept">
          <span>Every contribution builds a floor.</span>
          <span>Every day builds a building.</span>
          <span>Every month becomes a district.</span>
        </div>

        <form className="start-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username-input">GITHUB USERNAME</label>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. torvalds"
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="year-select">YEAR</label>
            <select
              id="year-select"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="form-toggle" onClick={() => setShowToken(!showToken)}>
            <span>{showToken ? '▾' : '▸'}</span>
            <span>GITHUB TOKEN (optional, for real data)</span>
          </div>

          {showToken && (
            <div className="form-group">
              <label htmlFor="token-input">PERSONAL ACCESS TOKEN</label>
              <input
                id="token-input"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxx"
              />
              <span className="form-hint">
                Requires <code>read:user</code> scope. Stored in memory only.
              </span>
            </div>
          )}

          <div className="start-actions">
            <button type="submit" className="btn-primary" disabled={!username.trim()}>
              BUILD MY CITY
            </button>
            <button type="button" className="btn-secondary" onClick={onDemo}>
              EXPLORE DEMO CITY
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
