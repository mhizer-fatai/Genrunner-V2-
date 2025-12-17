
import React, { useState } from 'react';
import { Button } from './Button';
import { RoomData, RoomPlayer } from '../types';
import { MAX_PLAYERS_PER_ROOM } from '../constants';

interface LobbyProps {
  currentRoom: RoomData | null;
  currentUserId: string;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  onStartMatch: () => Promise<void>;
  onLeave: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ 
  currentRoom, 
  currentUserId,
  onCreateRoom, 
  onJoinRoom, 
  onStartMatch,
  onLeave
}) => {
  const [playerName, setPlayerName] = useState('Racer-' + Math.floor(Math.random()*1000));
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const handleStartClick = async () => {
    setIsStarting(true);
    try {
      await onStartMatch();
    } catch (e) {
      // Error is usually handled upstream, but we need to ensure loading stops
    } finally {
      setIsStarting(false);
    }
  };

  const handleCreate = () => {
    if (!playerName.trim()) return;
    onCreateRoom(playerName);
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomIdInput) return;
    onJoinRoom(roomIdInput, playerName);
  };

  // Waiting Room View
  if (currentRoom) {
    const isHost = currentRoom.players[currentUserId]?.isHost;
    const players = Object.values(currentRoom.players) as RoomPlayer[];
    const isFinished = currentRoom.status === 'finished';

    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/95 z-[100] p-6 backdrop-blur-md">
        <div className="flex flex-col items-center mb-12">
            <h2 className="font-display text-5xl md:text-7xl text-white mb-2">ROOM: {currentRoom.id}</h2>
            <div className="bg-gray-800 px-4 py-1 rounded text-sm text-gray-300 font-bold uppercase tracking-widest">
                {players.length} / {MAX_PLAYERS_PER_ROOM} Players
            </div>
        </div>
        
        <p className="text-gray-400 mb-8 text-xl tracking-widest uppercase">
          {isFinished ? "Ready for next round" : "Waiting for drivers..."}
        </p>

        <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl p-6 mb-12 shadow-2xl h-[40vh] flex flex-col">
          <h3 className="text-gray-300 font-bold mb-6 uppercase tracking-wider text-base border-b border-gray-700 pb-4 shrink-0">Connected Drivers</h3>
          <div className="space-y-3 overflow-y-auto grow pr-2">
            {players.map(p => (
              <div key={p.uid} className="flex justify-between items-center bg-black p-4 rounded border border-gray-800">
                <span className={`text-lg md:text-xl ${p.uid === currentUserId ? 'text-white font-bold' : 'text-gray-400'}`}>
                  {p.displayName} {p.uid === currentUserId && '(YOU)'}
                </span>
                {p.isHost && <span className="text-xs bg-white text-black px-3 py-1 font-bold uppercase rounded-sm">HOST</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
           {isHost ? (
             <Button onClick={handleStartClick} disabled={isStarting} className="text-xl px-10 py-4">
               {isStarting ? "SIGNING..." : (isFinished ? "Start New Round" : "Start Race")}
             </Button>
           ) : (
             <div className="text-gray-500 italic flex items-center text-lg animate-pulse">Waiting for host...</div>
           )}
           
           <Button variant="danger" onClick={onLeave} className="text-xl px-10 py-4">Leave</Button>
        </div>
      </div>
    );
  }

  // Create/Join View
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-[100] p-6">
      <h2 className="font-display text-6xl md:text-8xl text-white mb-16 tracking-tighter">MULTIPLAYER</h2>

      <div className="w-full max-w-md space-y-10">
        <div>
          <label className="block text-gray-500 text-sm uppercase mb-1 font-bold tracking-widest">Driver Name (Discord Username)</label>
          <input 
            type="text" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full bg-black border-2 border-gray-700 text-white px-6 py-4 rounded text-2xl focus:border-white focus:outline-none transition-colors"
            maxLength={40}
            placeholder="Enter Discord Username"
          />
        </div>

        <div className="border-t border-gray-800 pt-10">
          <Button onClick={handleCreate} className="w-full mb-6 text-xl py-4">
            Create New Room
          </Button>
          
          <div className="relative flex items-center gap-4 mb-6">
            <div className="h-px bg-gray-800 flex-1"></div>
            <span className="text-gray-500 text-sm uppercase font-bold">OR JOIN</span>
            <div className="h-px bg-gray-800 flex-1"></div>
          </div>

          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="ROOM ID"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
              className="flex-1 bg-black border-2 border-gray-700 text-white px-6 py-4 rounded text-xl focus:border-white focus:outline-none uppercase placeholder-gray-700"
            />
            <Button variant="secondary" onClick={handleJoin} disabled={!roomIdInput} className="text-xl px-8">
              Join
            </Button>
          </div>
        </div>
        
        <Button variant="danger" onClick={onLeave} className="w-full mt-12 py-4">
          Back
        </Button>
      </div>
    </div>
  );
};