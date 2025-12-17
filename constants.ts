

export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;

export const PLAYER_SIZE = { width: 32, height: 60 }; 
export const ENEMY_SIZE = { width: 24, height: 40 }; // Reduced size
export const COIN_SIZE = { width: 20, height: 20 };

export const LANE_COUNT = 4;
export const LANE_WIDTH = GAME_WIDTH / LANE_COUNT;

export const INITIAL_SPEED = 6; 
export const MAX_SPEED = 18; 
export const ACCELERATION = 0.005;

export const INITIAL_LIVES = 3;
export const INVULNERABILITY_TIME_MS = 2000; // 2 seconds of safety after hit
export const COLLISION_TOLERANCE = 10; // Pixels to shave off hitboxes

// 3 Minutes in milliseconds
export const GAME_DURATION_MS = 3 * 60 * 1000; 

export const MAX_PLAYERS_PER_ROOM = 30;

// Realistic Racing Palette
export const COLORS = {
  player: '#FFFF00',       // Yellow (Keep)
  playerAccent: '#000000', 
  enemy: '#D32F2F',        // Darker Red base
  enemyHighlight: '#FF5252', // Lighter Red for stripes
  coin: '#2979FF',         // Electric Blue
  // Use Very Dark Grey instead of Pure Black to prevent OLED Smear/Ghosting on mobile
  road: '#1a1a1a',         
  roadMarking: '#444444',  
  background: '#0F0F0F',   
  grid: '#222222',         // Subtle background grid
  speedLine: '#FFFFFF20'   // Faint white transparent
};

export const STORAGE_KEY_HIGHSCORE = 'neon_rush_highscore';
export const STORAGE_KEY_XP = 'neon_rush_total_xp';
export const STORAGE_KEY_LEVEL = 'neon_rush_level';

// --- BLOCKCHAIN CONFIG ---
export const GENLAYER_CHAIN_ID = 4221;
export const GENLAYER_CHAIN_ID_HEX = '0x107D'; // 4221 in hex
// Updated to the stable HTTPS RPC endpoint
export const GENLAYER_RPC_URL = 'https://rpc-testnet.genlayer.xyz';
export const GENLAYER_EXPLORER_URL = 'https://genlayer-testnet.explorer.caldera.xyz/';
export const GENLAYER_NETWORK_NAME = 'GenLayer Testnet Asimov';
export const GENLAYER_CURRENCY_SYMBOL = 'GEN';

export const NFT_CONTRACT_ADDRESS = '0x62ab4C39D42B8531b7baA37D1aB7352Ea49b93b3';
