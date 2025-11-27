import { Address } from 'viem';

// Contract addresses for different networks
export const CONTRACT_ADDRESSES: Record<number, Address> = {
  // Hardhat local network
  31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address,
  // Sepolia testnet
  11155111: '0x65Cfc68376c35B3eDeCb78164a8A55B95a8c9BD9' as Address,
};

// Default contract address (for Hardhat local)
export const DEFAULT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address;

/**
 * Get contract address for a given chain ID
 * @param chainId - The chain ID
 * @returns The contract address for the chain, or default address if not found
 */
export function getContractAddress(chainId?: number): Address {
  if (chainId && CONTRACT_ADDRESSES[chainId]) {
    return CONTRACT_ADDRESSES[chainId];
  }
  return DEFAULT_CONTRACT_ADDRESS;
}

