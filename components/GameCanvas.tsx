

import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Entity, Particle, GameScore } from '../types';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  PLAYER_SIZE, 
  ENEMY_SIZE, 
  COIN_SIZE, 
  LANE_COUNT, 
  LANE_WIDTH, 
  INITIAL_SPEED, 
  COLORS, 
  MAX_SPEED,
  GAME_DURATION_MS,
  INITIAL_LIVES,
  INVULNERABILITY_TIME_MS
} from '../constants';
import { audioManager } from '../audio';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (score: GameScore) => void;
  onScoreUpdate: (score: GameScore) => void;
  startTime?: number; 
}

// Yellow Sports Car SVG Data URI
const CAR_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA5MCI+CiAgPCEtLSBDYXIgQm9keSAtLT4KICA8cGF0aCBkPSJNIDEwIDE1IFEgMjUgMCA0MCAxNSBMIDQ1IDI1IFEgNTAgMzUgNTAgNTUgTCA0OCA4MCBRIDQ1IDkwIDI1IDkwIFEgNSA5MCAyIDgwIEwgMCA1NSBRIDAgMzUgNSAyNSBaIiBmaWxsPSIjRkZFQjAwIiBzdHJva2U9IiNDQ0IwMDAiIHN0cm9rZS13aWR0aD0iMSIvPgogIAogIDwhLS0gV2luZHNoaWVsZCAtLT4KICA8cGF0aCBkPSJNIDEwIDMwIFEgMjUgMjUgNDAgMzAgTCA0MiA0NSBRIDI1IDQwIDggNDUgWiIgZmlsbD0iIzIyMiIvPgogIAogIDwhLS0gUm9vZiAtLT4KICA8cGF0aCBkPSJNIDggNDUgUSAyNSA0MCA0MiA0NSBMIDQwIDY1IFEgMjUgNjAgMTAgNjUgWiIgZmlsbD0iI0ZGRUIwMCIgb3BhY2l0eT0iMC45Ii8+CiAgCiAgPCEtLSBSZWFyIFdpbmRvdyAtLT4KICA8cGF0aCBkPSJNIDEwIDE1IFEgMjUgNjAgNDAgNjUgTCAzOCA3NSBRIDI1IDcwIDEyIDc1IFoiIGZpbGw9IiMyMjIiLz4KCiAgPCEtLSBIZWFkbGlnaHRzIC0tPgogIDxlbGxpcHNlIGN4PSI4IiBjeT0iMjAiIHJ4PSI0IiByeT0iNiIgZmlsbD0iI0ZGRkZGRSIvPgogIDxlbGxpcHNlIGN4PSI0MiIgY3k9IjIwIiByeD0iNCIgcnk9IjYiIGZpbGw9IiNGRkZGRkUiLz4KCiAgPCEtLSBTcG9pbGVyIC0tPgogIDxyZWN0IHg9IjUiIHk9IjgxIiB3aWR0aD0iNDAiIGhlaWdodD0iNCIgZmlsbD0iIzIyMiIvPgo8L3N2Zz4=`;

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onGameOver, onScoreUpdate, startTime }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game State Refs
  const playerRef = useRef<Entity>({
    id: 'player',
    pos: { x: GAME_WIDTH / 2 - PLAYER_SIZE.width / 2, y: GAME_HEIGHT - 180 },
    size: PLAYER_SIZE,
    speed: 0,
    color: COLORS.player,
    type: 'player'
  });
  
  const enemiesRef = useRef<Entity[]>([]);
  const coinsRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const speedLinesRef = useRef<{x: number, y: number, length: number, speed: number}[]>([]);
  
  const scoreRef = useRef<GameScore>({ current: 0, best: 0, coins: 0, lives: INITIAL_LIVES });
  const livesRef = useRef<number>(INITIAL_LIVES);
  const lastHitTimeRef = useRef<number>(0);
  const isGameOverRef = useRef<boolean>(false);
  const lastScoreSentRef = useRef<number>(0); 
  
  const gameSpeedRef = useRef(INITIAL_SPEED);
  const roadOffsetRef = useRef(0);
  const backgroundOffsetRef = useRef(0);
  
  // Time Tracking for 60 FPS Cap
  const lastTimeRef = useRef(0);
  const accumulatorRef = useRef(0);
  const TARGET_FPS = 60;
  const FRAME_DURATION = 1000 / TARGET_FPS;

  const keysPressed = useRef<Set<string>>(new Set());
  
  // Image Refs
  const carImageRef = useRef<HTMLImageElement | null>(null);

  // Load Car Image
  useEffect(() => {
    const img = new Image();
    img.src = CAR_SVG;
    img.onload = () => {
      carImageRef.current = img;
    };
  }, []);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.key);
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Touch controls helper for mobile - Use Passive listeners for better scroll/touch perf
    const handleTouchStart = (e: TouchEvent) => {
      const touchX = e.touches[0].clientX;
      const width = window.innerWidth;
      if (touchX < width / 2) {
        keysPressed.current.add('ArrowLeft');
      } else {
        keysPressed.current.add('ArrowRight');
      }
    };
    const handleTouchEnd = () => {
      keysPressed.current.delete('ArrowLeft');
      keysPressed.current.delete('ArrowRight');
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Stop engine when component unmounts
  useEffect(() => {
    return () => {
      audioManager.stopEngine();
    };
  }, []);

  const createExplosion = (x: number, y: number, color: string, count: number = 10) => {
    // Reduced particle count for performance
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() - 0.5) * 8, // Slower velocity
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color: color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };
  
  const drawHazardEnemy = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      // Base
      ctx.fillStyle = COLORS.enemy;
      drawRoundedRect(ctx, x, y, w, h, 8);
      ctx.fill();
      
      // Hazard Stripes
      ctx.save();
      ctx.clip();
      ctx.fillStyle = COLORS.enemyHighlight;
      const stripeWidth = 10;
      // Draw diagonal stripes
      for (let i = -h; i < w + h; i += stripeWidth * 2) {
          ctx.beginPath();
          ctx.moveTo(x + i, y);
          ctx.lineTo(x + i + stripeWidth, y);
          ctx.lineTo(x + i + stripeWidth - h, y + h);
          ctx.lineTo(x + i - h, y + h);
          ctx.fill();
      }
      ctx.restore();

      // Top/Bottom Caps for detail
      ctx.fillStyle = '#111';
      ctx.fillRect(x + 5, y + 5, w - 10, 4); // Top vent
      ctx.fillRect(x + 5, y + h - 10, w - 10, 4); // Bottom bumper
  };

  const checkCollision = (a: Entity, b: Entity, paddingX: number = 0, paddingY: number = 0) => {
    return (
      a.pos.x + paddingX < b.pos.x + b.size.width - paddingX &&
      a.pos.x + a.size.width - paddingX > b.pos.x + paddingX &&
      a.pos.y + paddingY < b.pos.y + b.size.height - paddingY &&
      a.pos.y + a.size.height - paddingY > b.pos.y + paddingY
    );
  };

  const spawnEnemy = () => {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const x = lane * LANE_WIDTH + (LANE_WIDTH - ENEMY_SIZE.width) / 2;
    const tooClose = enemiesRef.current.some(e => e.pos.y < 150); 
    if (tooClose) return;

    enemiesRef.current.push({
      id: Math.random().toString(),
      pos: { x, y: -200 },
      size: ENEMY_SIZE,
      speed: 0,
      color: COLORS.enemy,
      type: 'enemy'
    });
  };

  const spawnCoin = () => {
    if (Math.random() > 0.05) return;
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const x = lane * LANE_WIDTH + (LANE_WIDTH - COIN_SIZE.width) / 2;
    
    coinsRef.current.push({
      id: Math.random().toString(),
      pos: { x, y: -200 },
      size: COIN_SIZE,
      speed: 0,
      color: COLORS.coin,
      type: 'coin'
    });
  };
  
  const spawnSpeedLine = () => {
      // Spawn on edges
      const isLeft = Math.random() > 0.5;
      const x = isLeft ? Math.random() * 20 : GAME_WIDTH - Math.random() * 20;
      speedLinesRef.current.push({
          x: x,
          y: -100,
          length: Math.random() * 50 + 20,
          speed: Math.random() * 10 + 20
      });
  };

  const resetGame = useCallback(() => {
    playerRef.current.pos.x = GAME_WIDTH / 2 - PLAYER_SIZE.width / 2;
    playerRef.current.pos.y = GAME_HEIGHT - PLAYER_SIZE.height - 20; 
    
    enemiesRef.current = [];
    coinsRef.current = [];
    particlesRef.current = [];
    speedLinesRef.current = [];
    livesRef.current = INITIAL_LIVES;
    scoreRef.current = { current: 0, best: scoreRef.current.best, coins: 0, lives: INITIAL_LIVES };
    lastScoreSentRef.current = 0;
    
    gameSpeedRef.current = INITIAL_SPEED;
    lastHitTimeRef.current = 0;
    isGameOverRef.current = false;
    lastTimeRef.current = 0;
    accumulatorRef.current = 0; // Reset FPS accumulator
    audioManager.stopEngine();
  }, []);

  const animate = useCallback((time: number) => {
    if (isGameOverRef.current) return;

    if (gameState !== GameState.PLAYING) {
       audioManager.stopEngine();
       if (gameState === GameState.MENU || gameState === GameState.LOBBY) {
         resetGame();
       }
    }

    // --- FPS CAP LOGIC ---
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    
    // Accumulate time since last frame
    accumulatorRef.current += deltaTime;

    // Only update logic if enough time has passed for one frame (16.6ms)
    // This locks the update rate to approx 60hz even on 120hz screens
    // We use a "while" loop to catch up if we lagged, but capped to avoid spiral of death
    let numUpdates = 0;
    while (accumulatorRef.current >= FRAME_DURATION && numUpdates < 4) {
        
        // --- LOGIC UPDATE STEP (Fixed Time Step) ---
        if (gameState === GameState.PLAYING) {
          if (startTime) {
            const elapsed = Date.now() - startTime;
            if (elapsed >= GAME_DURATION_MS) {
                audioManager.stopEngine();
                onGameOver({...scoreRef.current});
                return;
            }
          }

          audioManager.updateEngine(gameSpeedRef.current / MAX_SPEED);

          const speedBonus = scoreRef.current.current / 500;
          gameSpeedRef.current = Math.min(MAX_SPEED, INITIAL_SPEED + speedBonus);
          
          scoreRef.current.current += (gameSpeedRef.current / 20);
          scoreRef.current.lives = livesRef.current;

          const currentIntScore = Math.floor(scoreRef.current.current);
          if (currentIntScore > lastScoreSentRef.current) {
             onScoreUpdate({ ...scoreRef.current }); 
             lastScoreSentRef.current = currentIntScore;
          }

          const moveSpeed = 10; 
          
          if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) {
            playerRef.current.pos.x -= moveSpeed;
          }
          if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) {
            playerRef.current.pos.x += moveSpeed;
          }
          playerRef.current.pos.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE.width, playerRef.current.pos.x));

          roadOffsetRef.current = (roadOffsetRef.current + gameSpeedRef.current) % 100;
          backgroundOffsetRef.current = (backgroundOffsetRef.current + gameSpeedRef.current * 0.5) % 100;

          const baseSpawnChance = 0.02 + (gameSpeedRef.current / 500);
          if (Math.random() < baseSpawnChance) spawnEnemy();
          
          // Spawn Speed Lines
          if (gameSpeedRef.current > 10 && Math.random() < 0.3) spawnSpeedLine();
          
          enemiesRef.current.forEach((enemy) => {
            enemy.pos.y += gameSpeedRef.current;
            
            if (checkCollision(playerRef.current, enemy, 2, 2)) {
               const now = Date.now();
               if (now - lastHitTimeRef.current > INVULNERABILITY_TIME_MS) {
                  livesRef.current -= 1;
                  lastHitTimeRef.current = now;
                  
                  createExplosion(playerRef.current.pos.x + PLAYER_SIZE.width/2, playerRef.current.pos.y + PLAYER_SIZE.height/2, COLORS.player, 10);
                  createExplosion(enemy.pos.x + ENEMY_SIZE.width/2, enemy.pos.y + ENEMY_SIZE.height/2, COLORS.enemy, 10);
                  audioManager.playCrash();
                  onScoreUpdate({ ...scoreRef.current, lives: livesRef.current }); 
                  enemy.toDelete = true;

                  if (livesRef.current <= 0) {
                     audioManager.stopEngine();
                     isGameOverRef.current = true;
                     onGameOver({...scoreRef.current});
                     return;
                  }
               }
            }
          });
          
          if (isGameOverRef.current) return;
          
          enemiesRef.current = enemiesRef.current.filter(e => e.pos.y < GAME_HEIGHT + 100 && !e.toDelete);

          spawnCoin();
          coinsRef.current.forEach((coin) => {
            coin.pos.y += gameSpeedRef.current;
            if (checkCollision(playerRef.current, coin, 0, 0)) {
              audioManager.playCoin();
              scoreRef.current.coins += 1;
              scoreRef.current.current += 100;
              createExplosion(coin.pos.x, coin.pos.y, COLORS.coin, 5);
              coin.pos.y = GAME_HEIGHT + 200; 
              onScoreUpdate({ ...scoreRef.current });
            }
          });
          coinsRef.current = coinsRef.current.filter(c => c.pos.y < GAME_HEIGHT + 100);

          particlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05; 
          });
          particlesRef.current = particlesRef.current.filter(p => p.life > 0);
          
          // Speed Lines
          speedLinesRef.current.forEach(sl => {
              sl.y += sl.speed + gameSpeedRef.current;
          });
          speedLinesRef.current = speedLinesRef.current.filter(sl => sl.y < GAME_HEIGHT);
        }

        accumulatorRef.current -= FRAME_DURATION;
        numUpdates++;
    }

    // --- RENDER STEP (Interpolation could go here, but simple draw is fine for now) ---
    // Use Alpha: false for performance boost on background clear
    const ctx = canvasRef.current?.getContext('2d', { alpha: false });
    if (!ctx) return;

    // 1. Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Background Grid (Subtle Scrolling)
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    // Vertical grid lines
    for(let i=0; i<GAME_WIDTH; i+=40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, GAME_HEIGHT);
        ctx.stroke();
    }
    // Horizontal scrolling grid lines
    const gridOffsetY = backgroundOffsetRef.current % 40;
    for(let i=-40; i<GAME_HEIGHT; i+=40) {
        const y = i + gridOffsetY;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_WIDTH, y);
        ctx.stroke();
    }

    // 3. Road
    const roadX = 0;
    const roadWidth = GAME_WIDTH;
    ctx.fillStyle = COLORS.road;
    ctx.fillRect(roadX, 0, roadWidth, GAME_HEIGHT);

    // 4. Road Markings
    ctx.strokeStyle = COLORS.roadMarking;
    ctx.lineWidth = 4;
    for (let i = 1; i < LANE_COUNT; i++) {
      ctx.beginPath();
      ctx.setLineDash([30, 40]);
      ctx.lineDashOffset = -roadOffsetRef.current;
      ctx.moveTo(i * LANE_WIDTH, 0);
      ctx.lineTo(i * LANE_WIDTH, GAME_HEIGHT);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // Side Rails
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(2, GAME_HEIGHT);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH - 2, 0);
    ctx.lineTo(GAME_WIDTH - 2, GAME_HEIGHT);
    ctx.stroke();
    
    // 5. Speed Lines (Below objects)
    ctx.fillStyle = COLORS.speedLine;
    speedLinesRef.current.forEach(sl => {
        ctx.fillRect(sl.x, sl.y, 2, sl.length);
    });

    // 6. Player
    if (gameState === GameState.PLAYING) {
        const isInvulnerable = Date.now() - lastHitTimeRef.current < INVULNERABILITY_TIME_MS;
        if (!isInvulnerable || Math.floor(Date.now() / 100) % 2 === 0) {
            if (carImageRef.current) {
              ctx.drawImage(
                carImageRef.current, 
                playerRef.current.pos.x, 
                playerRef.current.pos.y, 
                PLAYER_SIZE.width, 
                PLAYER_SIZE.height
              );
            } else {
              ctx.fillStyle = COLORS.player;
              drawRoundedRect(ctx, playerRef.current.pos.x, playerRef.current.pos.y, PLAYER_SIZE.width, PLAYER_SIZE.height, 4);
              ctx.fill();
            }
        }
    }

    // 7. Enemies (With Hazard Stripes)
    enemiesRef.current.forEach(enemy => {
      drawHazardEnemy(ctx, enemy.pos.x, enemy.pos.y, ENEMY_SIZE.width, ENEMY_SIZE.height);
    });

    // 8. Coins
    coinsRef.current.forEach(coin => {
      ctx.fillStyle = COLORS.coin;
      ctx.beginPath();
      ctx.arc(coin.pos.x + COIN_SIZE.width/2, coin.pos.y + COIN_SIZE.height/2, COIN_SIZE.width/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('$', coin.pos.x + 8, coin.pos.y + 24);
    });

    // 9. Particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [gameState, onGameOver, onScoreUpdate, resetGame, startTime]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
        resetGame();
        isGameOverRef.current = false;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(animate);
    }
  }, [gameState, resetGame, animate, startTime]);

  return (
    <canvas 
      ref={canvasRef} 
      width={GAME_WIDTH} 
      height={GAME_HEIGHT}
      className="w-full h-full object-contain bg-black"
    />
  );
};