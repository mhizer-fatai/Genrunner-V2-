
import { ethers } from 'ethers';
import { 
  GENLAYER_CHAIN_ID,
  GENLAYER_CHAIN_ID_HEX, 
  GENLAYER_RPC_URL, 
  GENLAYER_NETWORK_NAME, 
  GENLAYER_CURRENCY_SYMBOL, 
  GENLAYER_EXPLORER_URL,
  NFT_CONTRACT_ADDRESS
} from './constants';

// ABI for GenLayer NFT
const NFT_ABI = [
  "function mint() public returns (uint256)",
  // GenLayer Intelligent Contract uses snake_case as standard
  "function balance_of(address wallet) view returns (uint256)"
];

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  hasNFT: boolean;
  chainId: number | null;
}

export class BlockchainManager {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  constructor() {
    if ((window as any).ethereum) {
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
    }
  }

  async attemptSilentConnection(): Promise<WalletState | null> {
    if (!this.provider) return null;

    try {
      const accounts = await this.provider.send("eth_accounts", []);
      if (!accounts || accounts.length === 0) return null;

      const address = ethers.getAddress(accounts[0]);
      this.signer = await this.provider.getSigner();

      // Check NFT Balance directly from contract
      const hasNFT = await this.checkNFTBalance(address);
      const network = await this.provider.getNetwork();
      
      return {
        address,
        isConnected: true,
        hasNFT,
        chainId: Number(network.chainId)
      };
    } catch (error) {
      console.warn("[GenRunner 2] Silent connection failed:", error);
      return null;
    }
  }

  async connectWallet(): Promise<WalletState> {
    if (!this.provider) {
      throw new Error("No wallet found. Please install MetaMask.");
    }

    try {
      const accounts = await this.provider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) throw new Error("No accounts found");
      
      const address = ethers.getAddress(accounts[0]);
      this.signer = await this.provider.getSigner();

      // Always ensure we are on GenLayer for interactions
      await this.switchToGenLayer();
      
      const hasNFT = await this.checkNFTBalance(address);
      const network = await this.provider.getNetwork();

      return {
        address,
        isConnected: true,
        hasNFT,
        chainId: Number(network.chainId)
      };
    } catch (error) {
      console.error("[GenRunner 2] Wallet connection failed:", error);
      throw error;
    }
  }

  async switchToGenLayer() {
    if (!this.provider) return;
    
    try {
      await this.provider.send("wallet_switchEthereumChain", [{ chainId: GENLAYER_CHAIN_ID_HEX }]);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await this.provider.send("wallet_addEthereumChain", [{
            chainId: GENLAYER_CHAIN_ID_HEX,
            chainName: GENLAYER_NETWORK_NAME,
            rpcUrls: [GENLAYER_RPC_URL],
            nativeCurrency: {
              name: GENLAYER_CURRENCY_SYMBOL,
              symbol: GENLAYER_CURRENCY_SYMBOL,
              decimals: 18
            },
            blockExplorerUrls: [GENLAYER_EXPLORER_URL]
          }]);
        } catch (addError) {
          throw new Error("Failed to add GenLayer network");
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    }
  }

  /**
   * CORE VERIFICATION LOGIC
   * Queries the GenLayer contract directly for balance_of.
   */
  async checkNFTBalance(walletAddress: string): Promise<boolean> {
    const formattedAddress = ethers.getAddress(walletAddress);
    console.log(`[GenRunner 2] Verifying License for: ${formattedAddress}`);

    // Strategy 1: Dedicated RPC Provider (Bypasses wallet lag/wrong network)
    try {
      const rpcProvider = new ethers.JsonRpcProvider(GENLAYER_RPC_URL);
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, rpcProvider);
      
      // Force a query to the contract
      const rawBalance = await contract.balance_of(formattedAddress);
      const balance = BigInt(rawBalance);
      
      console.log(`[GenRunner 2] Contract Query SUCCESS. Balance: ${balance.toString()}`);
      return balance > 0n;
    } catch (rpcError) {
      console.warn("[GenRunner 2] RPC Query failed, attempting Wallet Provider fallback...", rpcError);
      
      // Strategy 2: Fallback to active browser provider
      if (this.provider) {
        try {
          const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, this.provider);
          const rawBalance = await contract.balance_of(formattedAddress);
          const balance = BigInt(rawBalance);
          return balance > 0n;
        } catch (walletError) {
          console.error("[GenRunner 2] All verification strategies failed.", walletError);
          return false;
        }
      }
      return false;
    }
  }

  async mintNFT(): Promise<boolean> {
    if (!this.signer) throw new Error("Wallet not connected");

    await this.switchToGenLayer();

    try {
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, this.signer);
      console.log("[GenRunner 2] Sending Mint Transaction...");
      const tx = await contract.mint();
      
      console.log("[GenRunner 2] Mint TX Hash:", tx.hash);
      await tx.wait();
      console.log("[GenRunner 2] Mint Confirmed.");

      return true;
    } catch (e: any) {
      console.error("[GenRunner 2] Minting failed:", e);
      // Double check if it actually exists now
      const address = await this.signer.getAddress();
      return await this.checkNFTBalance(address);
    }
  }

  async signStartGame(): Promise<string> {
    if (!this.signer) throw new Error("Wallet not connected");
    await this.switchToGenLayer();
    const address = await this.signer.getAddress();
    const tx = await this.signer.sendTransaction({
      to: address,
      value: 0,
      data: ethers.hexlify(ethers.toUtf8Bytes("GenRunner 2 Match Start"))
    });
    await tx.wait(); 
    return tx.hash;
  }

  shortenAddress(address: string): string {
    try {
      const formatted = ethers.getAddress(address);
      return `${formatted.substring(0, 6)}...${formatted.substring(formatted.length - 4)}`;
    } catch {
      return address;
    }
  }
}

export const blockchainManager = new BlockchainManager();
