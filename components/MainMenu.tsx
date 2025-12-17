
import React, { useState } from 'react';
import { Button } from './Button';
import { blockchainManager } from '../blockchain';

interface MainMenuProps {
  onStart: () => void;
  bestScore?: number;
  userStats?: { level: number; xp: number };
  authError?: string | null;
  onConnectWallet: () => Promise<void>;
  walletAddress: string | null;
  hasNFT: boolean;
  onMintSuccess: () => void;
  isCheckingWallet?: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({ 
  onStart, 
  authError,
  onConnectWallet,
  walletAddress,
  isCheckingWallet
}) => {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleAction = async () => {
    setLocalError(null);
    if (!walletAddress) {
      try {
        await onConnectWallet();
      } catch (e: any) {
        setLocalError(e.message || "Connection failed.");
      }
    } else {
      onStart();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] text-center animate-in fade-in duration-500 overflow-y-auto pb-20">
      <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-12 gap-6 md:gap-10 max-w-4xl mx-auto">
        
        {/* Status Messaging */}
        <div className="fixed top-6 left-6 text-left pointer-events-none z-[110]">
          {authError && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest opacity-50">{authError}</p>}
          {localError && <p className="text-red-500 text-xs font-bold mt-2 max-w-xs">{localError}</p>}
        </div>

        {/* Connected Wallet Info */}
        {walletAddress && (
          <div className="fixed top-6 right-6 text-right z-[110]">
             <div className="flex flex-col items-end opacity-40 hover:opacity-100 transition-opacity">
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Driver</span>
                <span className="text-white font-mono text-xs">{blockchainManager.shortenAddress(walletAddress)}</span>
             </div>
          </div>
        )}

        {/* Brand Section */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-20 h-20 md:w-28 md:h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
              <path d="M50 10 L90 90 L75 90 L50 35 L25 90 L10 90 Z" />
              <path d="M50 55 L65 85 L35 85 Z" fill="black" /> 
            </svg>
          </div>
          <h1 className="font-display text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">
            GENRUNNER 2
          </h1>
          <p className="font-display text-gray-500 tracking-[0.4em] text-xs md:text-lg uppercase font-bold">
            The Next Generation
          </p>
        </div>

        {/* Content Section - Adjusted for lighter weight and smaller scale */}
        <div className="space-y-8 text-center max-w-3xl">
          <p className="text-gray-300 text-lg md:text-xl font-medium leading-relaxed">
            GenRunner is an updated version of the community made GenRunner 1 which introduced blockchain technology. 
            This version allows users to mint their <span className="text-yellow-400 font-bold">Proof of Gamer (POG) NFT</span> and have real ownership of in-game assets.
          </p>
          
          <p className="text-white text-xl md:text-3xl font-bold uppercase tracking-tight leading-snug italic mx-auto">
            Players must sign a transaction on the GenLayer testnet before proceeding to start the game.
          </p>

          <div className="pt-4 border-t border-white/5">
            <h2 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-4 font-display">GenLayer Protocol</h2>
            <p className="text-gray-400 text-base md:text-lg font-medium leading-relaxed">
              GenLayer is building the world's first "Intelligent Blockchain." Standard blockchains only follow simple rules, 
              but GenLayer uses AI so that smart contracts can actually understand the real world and talk to it, 
              making decentralization much smarter and easier for everyone.
            </p>
          </div>
        </div>

        {/* Action Section */}
        <div className="flex flex-col items-center gap-6 mt-4">
          <Button 
            onClick={handleAction} 
            disabled={isCheckingWallet}
            className={`text-xl md:text-3xl px-12 py-4 md:px-20 md:py-6 transition-all hover:scale-105 active:scale-95 ${!walletAddress ? 'animate-pulse' : ''}`}
          >
            {isCheckingWallet ? "INITIALIZING..." : (!walletAddress ? "CONNECT WALLET" : "START ENGINE")}
          </Button>
          
          <div className="flex flex-col gap-1">
            <p className="text-gray-600 text-[10px] md:text-xs uppercase tracking-widest font-bold">
              POG License Verification Required
            </p>
            <p className="text-gray-800 text-[9px] uppercase tracking-widest font-bold">
              v2.0.2 • Powered by GenLayer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
