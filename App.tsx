
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { MainMenu } from './components/MainMenu';
import { GameOver } from './components/GameOver';
import { HUD } from './components/HUD';
import { Lobby } from './components/Lobby';
import { Leaderboard } from './components/Leaderboard';
import { SpectatorView } from './components/SpectatorView';
import { GameState, GameScore, RoomData } from './types';
import { STORAGE_KEY_HIGHSCORE, STORAGE_KEY_XP, STORAGE_KEY_LEVEL, GAME_DURATION_MS, INITIAL_LIVES, MAX_PLAYERS_PER_ROOM } from './constants';
import { audioManager } from './audio';
import { blockchainManager } from './blockchain';

// Firebase imports
import { db, auth } from './firebase';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState<GameScore>({ current: 0, best: 0, coins: 0, lives: INITIAL_LIVES });
  const [isMuted, setIsMuted] = useState(false);
  
  // Stats
  const [totalXP, setTotalXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [earnedXP, setEarnedXP] = useState(0);

  // Multiplayer State
  const [userId, setUserId] = useState<string>('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const lastScoreSync = useRef(0);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Blockchain State
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hasNFT, setHasNFT] = useState(false);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);

  const latestScoreRef = useRef<GameScore>(score);

  useEffect(() => {
    const savedBest = localStorage.getItem(STORAGE_KEY_HIGHSCORE);
    const savedXP = localStorage.getItem(STORAGE_KEY_XP);
    const savedLevel = localStorage.getItem(STORAGE_KEY_LEVEL);

    if (savedBest) setScore(prev => ({ ...prev, best: parseFloat(savedBest) }));
    if (savedXP) setTotalXP(parseInt(savedXP));
    if (savedLevel) setLevel(parseInt(savedLevel));

    auth.signInAnonymously()
      .then(cred => {
        setUserId(cred.user!.uid);
      })
      .catch((err) => {
        console.warn("Firebase Auth fallback used.", err);
        const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
        setUserId(guestId);
        setAuthError("Guest Mode Active");
      });

    // Auto-Connect Wallet
    setIsCheckingWallet(true);
    blockchainManager.attemptSilentConnection().then(result => {
      if (result) {
        setWalletAddress(result.address);
        setHasNFT(result.hasNFT);
      }
      setIsCheckingWallet(false);
    });

    if ((window as any).ethereum) {
      const handleUpdates = () => window.location.reload();
      (window as any).ethereum.on('accountsChanged', handleUpdates);
      (window as any).ethereum.on('chainChanged', handleUpdates);
      return () => {
         if ((window as any).ethereum.removeListener) {
            (window as any).ethereum.removeListener('accountsChanged', handleUpdates);
            (window as any).ethereum.removeListener('chainChanged', handleUpdates);
         }
      }
    }
  }, []);

  useEffect(() => {
    latestScoreRef.current = score;
  }, [score]);

  const calculateXP = (s: GameScore) => Math.floor((s.current + s.coins) / 2);

  const handleGameOver = useCallback(async (finalScore: GameScore) => {
    const xp = calculateXP(finalScore);
    setEarnedXP(xp);
    const newTotalXP = totalXP + xp;
    const newLevel = Math.floor(newTotalXP / 1000) + 1; 
    
    setTotalXP(newTotalXP);
    setLevel(newLevel);
    
    localStorage.setItem(STORAGE_KEY_XP, newTotalXP.toString());
    localStorage.setItem(STORAGE_KEY_LEVEL, newLevel.toString());

    if (finalScore.current > score.best) {
      localStorage.setItem(STORAGE_KEY_HIGHSCORE, finalScore.current.toString());
      setScore(prev => ({ ...prev, best: finalScore.current }));
    }

    if (roomId && userId) {
       const roomRef = db.collection('rooms').doc(roomId);
       const status = finalScore.lives > 0 ? 'finished' : 'crashed';
       roomRef.update({
           [`players.${userId}.score`]: xp, 
           [`players.${userId}.status`]: status
       }).catch(console.error);
       setGameState(GameState.SPECTATING);
    } else {
      setGameState(GameState.GAME_OVER);
    }
  }, [roomId, userId, totalXP, score.best]);

  const startGame = useCallback(() => {
    audioManager.init();
    audioManager.startEngine();
    const initialScore = { current: 0, best: score.best, coins: 0, lives: INITIAL_LIVES };
    setScore(initialScore);
    latestScoreRef.current = initialScore;
    setEarnedXP(0);
    setGameState(GameState.PLAYING);
  }, [score.best]);

  // Handle Enter Lobby - Now with Auto-Verification/Mint Flow
  const handleEnterLobby = async () => {
    if (!walletAddress) return;
    
    setIsCheckingWallet(true);
    try {
      // 1. Force a refresh of the verification state
      const verified = await blockchainManager.checkNFTBalance(walletAddress);
      
      if (verified) {
        setHasNFT(true);
        setGameState(GameState.LOBBY);
      } else {
        // 2. If not verified, try to mint automatically or prompt
        const wantToMint = confirm("You need a 'Proof of Gamer' license to compete in multiplayer lobbies. Would you like to mint one for free now?");
        if (wantToMint) {
          const success = await blockchainManager.mintNFT();
          if (success) {
            setHasNFT(true);
            setGameState(GameState.LOBBY);
          } else {
            alert("Minting failed. Please ensure you have GEN testnet tokens.");
          }
        }
      }
    } catch (e) {
      console.error("Lobby entry error:", e);
      alert("Verification failed. Please check your network connection.");
    } finally {
      setIsCheckingWallet(false);
    }
  };

  useEffect(() => {
    if (!roomId) {
      setRoomData(null);
      return;
    }

    const unsub = db.collection('rooms').doc(roomId).onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const data = docSnap.data() as RoomData;
        setRoomData(data);
        
        if (data.status === 'playing') {
          const myPlayer = data.players[userId];
          if (myPlayer?.status === 'playing' || myPlayer?.status === 'ready') {
             if (gameState === GameState.LOBBY || gameState === GameState.SPECTATING || gameState === GameState.GAME_OVER) {
                startGame();
             }
          }
        }

        if (data.status === 'finished') {
           if (gameState === GameState.PLAYING) handleGameOver(latestScoreRef.current); 
           else if (gameState === GameState.SPECTATING) setGameState(GameState.GAME_OVER);
        }

        if (data.status === 'waiting' && (gameState === GameState.GAME_OVER || gameState === GameState.SPECTATING)) {
             setGameState(GameState.LOBBY);
        }

        if (userId && data.players[userId]?.isHost && data.status === 'playing') {
          const timeIsUp = data.startTime && Date.now() - data.startTime > GAME_DURATION_MS;
          const activePlayersCount = Object.values(data.players).filter(p => p.status === 'playing').length;
          if (timeIsUp || activePlayersCount === 0) {
            docSnap.ref.update({ status: 'finished' });
          }
        }
      }
    }, (err) => {
      console.error("Room sync error:", err);
      setRoomId(null);
      setGameState(GameState.MENU);
    });

    return () => unsub();
  }, [roomId, gameState, userId, handleGameOver, startGame]); 

  const handleCreateRoom = async (playerName: string) => {
    if (!userId) return;
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomRef = db.collection('rooms').doc(newRoomId);
    const newRoom: RoomData = {
      id: newRoomId,
      createdAt: Date.now(),
      status: 'waiting',
      players: {
        [userId]: {
          uid: userId,
          displayName: playerName,
          score: 0,
          isHost: true,
          status: 'ready'
        }
      }
    };
    try {
      await roomRef.set(newRoom);
      setRoomId(newRoomId);
      setGameState(GameState.LOBBY);
    } catch (e) {
      alert("Could not create room.");
    }
  };

  const handleJoinRoom = async (id: string, playerName: string) => {
    if (!userId) return;
    const roomRef = db.collection('rooms').doc(id);
    try {
      const snap = await roomRef.get();
      if (snap.exists) {
        const data = snap.data() as RoomData;
        if (Object.keys(data.players).length >= MAX_PLAYERS_PER_ROOM) {
           alert("Room full");
           return;
        }
        if (data.status === 'playing') {
          alert("Game in progress");
          return;
        }
        await roomRef.update({
          [`players.${userId}`]: {
            uid: userId,
            displayName: playerName,
            score: 0,
            isHost: false,
            status: 'ready'
          }
        });
        setRoomId(id);
        setGameState(GameState.LOBBY);
      } else {
        alert("Room not found");
      }
    } catch (e) {
      console.error("Error joining room:", e);
    }
  };

  const handleStartMatch = async () => {
     if (!roomId || !roomData) return;
     try {
       await blockchainManager.signStartGame();
       const updates: any = { status: 'playing', startTime: Date.now() };
       Object.keys(roomData.players).forEach(pid => {
         updates[`players.${pid}.status`] = 'playing';
         updates[`players.${pid}.score`] = 0;
       });
       await db.collection('rooms').doc(roomId).update(updates);
     } catch (e) {
       alert("Failed to start match. Transaction signature required.");
     }
  };

  const handleRestartLobby = async () => {
    if (!roomId || !roomData) return;
     try {
       const updates: any = { status: 'waiting', startTime: null };
       Object.keys(roomData.players).forEach(pid => {
         updates[`players.${pid}.status`] = 'ready';
         updates[`players.${pid}.score`] = 0;
       });
       await db.collection('rooms').doc(roomId).update(updates);
     } catch (e) { console.error(e); }
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setGameState(GameState.MENU);
  };
  
  const connectWallet = async () => {
    setIsCheckingWallet(true);
    try {
      const result = await blockchainManager.connectWallet();
      setWalletAddress(result.address);
      setHasNFT(result.hasNFT);
    } catch (e) {
      throw e;
    } finally {
      setIsCheckingWallet(false);
    }
  };

  const handleScoreUpdate = useCallback((newScore: GameScore) => {
    setScore(prev => ({ 
      ...prev, 
      current: newScore.current, 
      coins: newScore.coins,
      lives: newScore.lives
    }));
    latestScoreRef.current = newScore;
    
    const now = Date.now();
    if (roomId && userId && now - lastScoreSync.current > 2000) {
      const roomRef = db.collection('rooms').doc(roomId);
      roomRef.update({
        [`players.${userId}.score`]: calculateXP(newScore)
      }).catch(console.error);
      lastScoreSync.current = now;
    }
  }, [roomId, userId]);

  const toggleMute = useCallback(() => {
    const newState = !isMuted;
    setIsMuted(newState);
    audioManager.setMuted(newState);
  }, [isMuted]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden md:p-8">
      <div className="relative h-full w-full max-w-[500px] aspect-[9/16] shadow-2xl overflow-hidden bg-black md:rounded-lg md:border md:border-gray-800">
        <GameCanvas 
          gameState={gameState} 
          onGameOver={handleGameOver} 
          onScoreUpdate={handleScoreUpdate}
          startTime={roomData?.startTime}
        />
        {gameState === GameState.PLAYING && (
          <HUD 
            score={score} 
            isMuted={isMuted} 
            onToggleMute={toggleMute}
            startTime={roomData?.startTime}
            roomData={roomData}
            currentUserId={userId}
          />
        )}
      </div>

      {gameState === GameState.MENU && (
        <MainMenu 
          onStart={handleEnterLobby} 
          bestScore={score.best} 
          userStats={{ level, xp: totalXP }}
          authError={authError}
          onConnectWallet={connectWallet}
          walletAddress={walletAddress}
          hasNFT={hasNFT}
          onMintSuccess={() => setHasNFT(true)}
          isCheckingWallet={isCheckingWallet}
        />
      )}

      {gameState === GameState.LOBBY && (
        <Lobby 
          currentRoom={roomData}
          currentUserId={userId}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onStartMatch={handleStartMatch}
          onLeave={handleLeaveRoom}
        />
      )}

      {gameState === GameState.SPECTATING && roomData && (
        <SpectatorView 
          roomData={roomData}
          currentUserId={userId}
          startTime={roomData.startTime}
          onLeave={handleLeaveRoom}
        />
      )}

      {gameState === GameState.GAME_OVER && roomId && roomData ? (
        <Leaderboard 
            players={Object.values(roomData.players)} 
            currentUserId={userId}
            onLeave={() => setGameState(GameState.LOBBY)} 
            onRestartLobby={handleRestartLobby}
            isHost={roomData.players[userId]?.isHost}
            xpEarned={earnedXP}
        />
      ) : gameState === GameState.GAME_OVER && (
        <GameOver 
          score={score} 
          onRestart={() => startGame()} 
          onMenu={() => setGameState(GameState.MENU)} 
        />
      )}
    </div>
  );
};

export default App;
