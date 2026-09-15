import { useEffect, useRef } from 'react';
import type { CarInputs } from '../systems/CarController';

/**
 * Tracks keyboard input for car controls.
 * Returns a ref to the current inputs object (updated every keydown/keyup).
 */
export function useCarControls() {
  const inputs = useRef<CarInputs>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    inputs.current.forward   = true; break;
        case 'KeyS': case 'ArrowDown':  inputs.current.backward  = true; break;
        case 'KeyA': case 'ArrowLeft':  inputs.current.left      = true; break;
        case 'KeyD': case 'ArrowRight': inputs.current.right     = true; break;
        case 'Space':                   inputs.current.handbrake = true; e.preventDefault(); break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    inputs.current.forward   = false; break;
        case 'KeyS': case 'ArrowDown':  inputs.current.backward  = false; break;
        case 'KeyA': case 'ArrowLeft':  inputs.current.left      = false; break;
        case 'KeyD': case 'ArrowRight': inputs.current.right     = false; break;
        case 'Space':                   inputs.current.handbrake = false; break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return inputs;
}
