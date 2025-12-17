
import React from 'react';
import { Button } from './Button';
import { GameScore } from '../types';

interface GameOverProps {
  score: GameScore;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ score, onRestart, onMenu }) => {
  const isNewBest = score.current > score.best;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/95 z-[100] text-center p-6 animate-in fade-in duration-300">
      <h2 className="font-display text-7xl md:text-9xl font-bold text-white mb-4 tracking-tighter">
        CRASHED
      </h2>
      <p className="text-gray-500 mb-16 uppercase tracking-[0.5em] text-lg font-bold">System Failure</p>

      <div className="grid grid-cols-2 gap-10 mb-16 w-full max-w-lg">
        <div className="bg-black p-8 border border-gray-700 rounded-lg">
          <p className="text-gray-500 text-sm uppercase mb-2 font-bold tracking-widest">Distance</p>
          <p className="font-display text-4xl md:text-5xl text-white">{Math.floor(score.current)}m</p>
        </div>
        <div className="bg-black p-8 border border-gray-700 rounded-lg">
          <p className="text-gray-500 text-sm uppercase mb-2 font-bold tracking-widest">Credits</p>
          <p className="font-display text-4xl md:text-5xl text-white">{score.coins}</p>
        </div>
      </div>
      
      {isNewBest && (
        <div className="mb-12 bg-white w-full max-w-lg py-3 transform rotate-1">
          <p className="text-black font-black tracking-[0.2em] text-xl">NEW RECORD</p>
        </div>
      )}

      <div className="flex flex-col gap-6 w-full max-w-xs">
        <Button onClick={onRestart} variant="primary" className="text-xl py-4">
          Reboot System
        </Button>
        <Button onClick={onMenu} variant="secondary" className="text-xl py-4">
          Abort to Menu
        </Button>
      </div>
    </div>
  );
};
