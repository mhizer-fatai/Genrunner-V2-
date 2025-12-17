
import React from 'react';
import { Button } from './Button';
import { RoomPlayer } from '../types';

interface LeaderboardProps {
  players: RoomPlayer[];
  currentUserId: string;
  onLeave: () => void;
  onRestartLobby?: () => void;
  isHost?: boolean;
  xpEarned: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ 
  players, 
  currentUserId, 
  onLeave, 
  onRestartLobby,
  isHost,
  xpEarned 
}) => {
  // Sort by score desc (Note: 'score' field now contains XP from App.tsx)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-[100] p-6 animate-in fade-in zoom-in duration-300">
      <h2 className="font-display text-6xl md:text-8xl text-white mb-8 tracking-tighter">
        RACE RESULTS
      </h2>
      
      <div className="bg-white text-black p-6 rounded-md border-4 border-gray-300 mb-10 text-center min-w-[300px] shadow-[0_0_30px_rgba(255,255,255,0.2)]">
        <p className="text-black/60 text-sm uppercase mb-2 font-bold tracking-widest">XP EARNED</p>
        <p className="font-display text-6xl font-black">+{Math.floor(xpEarned)} XP</p>
      </div>

      <div className="w-full max-w-2xl bg-black rounded-xl overflow-hidden border border-gray-800 mb-12 shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-900 text-gray-400 text-sm uppercase tracking-wider">
            <tr>
              <th className="p-5 font-bold">Rank</th>
              <th className="p-5 font-bold">Driver</th>
              <th className="p-5 text-right font-bold">XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sortedPlayers.map((p, idx) => (
              <tr key={p.uid} className={`text-xl ${p.uid === currentUserId ? 'bg-gray-900' : ''}`}>
                <td className="p-5 font-bold text-gray-500">#{idx + 1}</td>
                <td className="p-5 text-white">
                   {p.displayName} {p.uid === currentUserId && <span className="text-gray-400 text-sm ml-3 uppercase font-bold tracking-wider">(YOU)</span>}
                   {p.status === 'crashed' && <span className="text-red-500 text-sm ml-3 font-bold uppercase">CRASHED</span>}
                </td>
                <td className="p-5 text-right font-mono text-white font-bold">{Math.floor(p.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-xs">
        {isHost && onRestartLobby && (
          <Button onClick={onRestartLobby} variant="primary" className="text-xl py-4">
            Start New Round
          </Button>
        )}
        <Button onClick={onLeave} variant={isHost ? "secondary" : "primary"} className="text-xl py-4">
          Return to Lobby
        </Button>
      </div>
    </div>
  );
};
