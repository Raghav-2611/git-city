import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  username: string;
  onComplete?: () => void;
}

const LOADING_STEPS = [
  'Analyzing contribution history...',
  'Plotting city blocks...',
  'Constructing buildings...',
  'Paving streets...',
  'Installing streetlights...',
  'Your city is almost ready...',
];

export function LoadingScreen({ username, onComplete }: LoadingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, 450);
    const dotsTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 350);
    return () => {
      clearInterval(stepTimer);
      clearInterval(dotsTimer);
    };
  }, []);

  const progress = Math.round(((stepIndex + 1) / LOADING_STEPS.length) * 100);

  return (
    <div className="loading-screen">
      <div className="loading-city-silhouette">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="loading-building"
            style={{
              height: `${20 + Math.sin(i * 1.3) * 12 + Math.cos(i * 0.7) * 8}%`,
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>

      <div className="loading-content">
        <div className="loading-logo">
          <span className="logo-git">GIT</span>
          <span className="logo-city">CITY</span>
        </div>

        <p className="loading-username">
          BUILDING {username.toUpperCase()}'S CITY{dots}
        </p>

        <p className="loading-step">{LOADING_STEPS[stepIndex]}</p>

        <div className="loading-bar-container">
          <div
            className="loading-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="loading-percent">{progress}%</p>
      </div>
    </div>
  );
}
