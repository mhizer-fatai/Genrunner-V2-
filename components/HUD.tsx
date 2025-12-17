
import React, { useEffect, useState } from 'react';
import { GameScore, RoomData, RoomPlayer } from '../types';
import { GAME_DURATION_MS, INITIAL_LIVES } from '../constants';

interface HUDProps {
  score: GameScore;
  isMuted: boolean;
  onToggleMute: () => void;
  startTime?: number;
  roomData?: RoomData | null;
  currentUserId?: string;
}

export const HUD: React.FC<HUDProps> = ({ score, isMuted, onToggleMute, startTime, roomData, currentUserId }) => {
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

  // opponents.score now contains XP (synced from App.tsx)
  const opponents = roomData ? (Object.values(roomData.players) as RoomPlayer[]).filter(p => p.uid !== currentUserId).sort((a,b) => b.score - a.score) : [];

  // Calculate local XP for "YOU" display to match opponents
  const currentXP = Math.floor((score.current + score.coins) / 2);

  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between overflow-hidden">
      
      {/* --- TOP ROW STATS --- */}
      <div className="flex justify-between items-center w-full relative">
        
        {/* LEFT: Lives & Distance Combined Pill */}
        <div className="flex items-center bg-black/30 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 gap-4 shadow-lg">
           {/* Lives Indicators */}
           <div className="flex gap-1">
               {Array.from({ length: Math.max(0, INITIAL_LIVES) }).map((_, i) => (
                 <div 
                   key={i} 
                   className={`w-2 h-2 rounded-full transition-all duration-300 ${i < score.lives ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]' : 'bg-white/10'}`}
                 />
               ))}
           </div>
           
           <div className="w-px h-4 bg-white/10"></div>
           
           {/* Score */}
           <div className="font-mono text-xl md:text-2xl text-white font-bold tracking-tighter leading-none">
             {Math.floor(score.current)}<span className="text-xs text-gray-400 ml-0.5 font-sans">m</span>
           </div>
        </div>
        
        {/* CENTER: Timer Pill */}
        {timeLeft && (
           <div className="absolute left-1/2 -translate-x-1/2 top-0">
             <div className="bg-black/30 backdrop-blur-sm border border-white/10 px-5 py-2 rounded-full shadow-lg flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${startTime ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                <span className="font-mono text-lg md:text-xl text-white font-bold tracking-widest">{timeLeft}</span>
             </div>
           </div>
        )}

        {/* RIGHT: Credits & Mute Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/30 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 gap-2 shadow-lg">
            <span className="text-blue-400 font-bold text-lg">$</span>
            <span className="font-mono text-xl md:text-2xl text-white font-bold tracking-tighter leading-none">
              {score.coins}
            </span>
          </div>
          
          <button 
            onClick={onToggleMute}
            className="pointer-events-auto bg-black/30 hover:bg-black/50 text-gray-300 hover:text-white p-2.5 rounded-full border border-white/10 backdrop-blur transition-all active:scale-95 flex items-center justify-center"
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* --- LIVE OPPONENT FEED (Bottom Right) --- */}
      {opponents.length > 0 && (
        <div className="self-end mt-auto max-w-[180px] w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-black/30 backdrop-blur-sm border border-white/5 rounded-lg p-3">
             <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-1">
                <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Live XP Rank</span>
             </div>
             <div className="space-y-1">
               {opponents.slice(0, 3).map((op, idx) => (
                 <div key={op.uid} className="flex justify-between items-center text-xs">
                   <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-gray-600 font-mono text-[9px] w-3">#{idx + 1 + (currentXP < op.score ? 1 : 0)}</span>
                      <span className="text-gray-400 truncate font-medium max-w-[80px]">{op.displayName}</span>
                   </div>
                   <span className="text-gray-600 font-mono text-[10px]">{Math.floor(op.score)}</span>
                 </div>
               ))}
               <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5 mt-1">
                  <div className="flex items-center gap-2">
                     <span className="text-white/20 font-mono text-[9px] w-3">#</span>
                     <span className="text-white font-bold text-[10px]">YOU</span>
                  </div>
                  <span className="text-white font-mono text-[10px]">{currentXP}</span>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};
