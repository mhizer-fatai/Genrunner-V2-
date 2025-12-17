
import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { RoomPlayer, RoomData } from '../types';
import { GAME_DURATION_MS } from '../constants';

interface SpectatorViewProps {
  roomData: RoomData;
  currentUserId: string;
  startTime?: number;
  onLeave: () => void;
}

export const SpectatorView: React.FC<SpectatorViewProps> = ({ roomData, currentUserId, startTime, onLeave }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!startTime) return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, GAME_DURATION_MS - elapsed);
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const activePlayers = (Object.values(roomData.players) as RoomPlayer[])
    .filter(p => p.status === 'playing')
    .sort((a, b) => b.score - a.score);

  const inactivePlayers = (Object.values(roomData.players) as RoomPlayer[])
    .filter(p => p.status !== 'playing')
    .sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 z-[90] p-6 backdrop-blur-sm">
      <div className="text-center mb-6">
        <h2 className="font-display text-4xl md:text-6xl text-gray-500 mb-2 uppercase tracking-tighter">ELIMINATED</h2>
        
        <div className="flex flex-col items-center gap-2">
            <p className="text-white text-xl font-mono">TIME LEFT: <span className="font-bold text-red-500">{timeLeft}</span></p>
            <div className="bg-gray-900 px-6 py-2 rounded-full border border-gray-700 animate-pulse">
               <p className="text-xs text-gray-300 uppercase tracking-widest font-bold">Waiting for round to finish...</p>
            </div>
        </div>
      </div>

      <div className="w-full max-w-xl bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-2xl mb-8">
        <h3 className="text-white text-xs font-bold uppercase mb-4 border-b border-gray-700 pb-2 tracking-wider flex justify-between">
           <span>Still Racing</span>
           <span className="text-green-500">{activePlayers.length} Active</span>
        </h3>
        
        {activePlayers.length === 0 ? (
          <p className="text-gray-500 italic text-sm text-center py-2">All drivers stopped. Round ending...</p>
        ) : (
          <div className="space-y-2 mb-6 max-h-32 overflow-y-auto">
            {activePlayers.map(p => (
              <div key={p.uid} className="flex justify-between items-center bg-black/50 p-2 rounded border-l-4 border-green-500">
                 <span className="text-white text-lg">{p.displayName}</span>
                 <span className="text-yellow-400 font-mono text-lg font-bold">{Math.floor(p.score)}</span>
              </div>
            ))}
          </div>
        )}

        <h3 className="text-gray-500 text-xs font-bold uppercase mb-4 border-b border-gray-800 pb-2 tracking-wider">Results / Waiting</h3>
        <div className="space-y-2 opacity-60 max-h-32 overflow-y-auto">
            {inactivePlayers.map(p => (
              <div key={p.uid} className="flex justify-between items-center text-base">
                 <span className={p.uid === currentUserId ? "text-red-400 font-bold" : "text-gray-400"}>
                    {p.displayName} {p.status === 'finished' ? '🏁' : '💀'}
                 </span>
                 <span className="text-gray-500 font-mono">{Math.floor(p.score)}</span>
              </div>
            ))}
        </div>
      </div>

      <Button variant="danger" onClick={onLeave} className="px-8 py-3 text-lg">
        LEAVE ROOM
      </Button>
    </div>
  );
};
