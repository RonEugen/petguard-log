import { useAccount, useReadContract, useWaitForTransactionReceipt, useChainId, useWalletClient } from 'wagmi';
import { useFHEVM } from './useFHEVM';
import { useState, useEffect } from 'react';
import { Address } from 'viem';
import { Contract } from 'ethers';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import PETGUARD_ABI_JSON from '../contracts/PetGuard.abi.json';
const PETGUARD_ABI = PETGUARD_ABI_JSON as const;
import { getContractAddress } from '../config/contracts';

export interface CareLog {
  id: bigint;
  owner: Address;
  logType: number;
  title: string;
  description: string;
  timestamp: bigint;
  hasEncryptedData: boolean;
  encryptedSensitiveData: string;
  decryptedSensitiveData?: bigint | null;
}

// Helper to convert walletClient to ethers signer
function walletClientToSigner(walletClient: any): Promise<JsonRpcSigner> {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };

  const provider = new BrowserProvider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}

export function usePetGuard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { instance } = useFHEVM();
  const { data: walletClient } = useWalletClient();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const { isLoading: isConfirming, isSuccess, isError: receiptError } = useWaitForTransactionReceipt({ hash: txHash });

  const contractAddress = getContractAddress(chainId);

  // Get total logs
  const { data: totalLogs } = useReadContract({
    address: contractAddress,
    abi: PETGUARD_ABI,
    functionName: 'getTotalLogs',
    query: { enabled: !!contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000' },
  });

  // Get owner logs - refresh when transaction succeeds
  const { data: ownerLogIds, refetch: refetchOwnerLogs } = useReadContract({
    address: contractAddress,
    abi: PETGUARD_ABI,
    functionName: 'getOwnerLogs',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && !!contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: isConfirming ? 2000 : false, // Poll while confirming
    },
  });

  // Refetch owner logs when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      // Small delay to ensure blockchain state is updated
      setTimeout(() => {
        refetchOwnerLogs();
      }, 1000);
    }
  }, [isSuccess, refetchOwnerLogs]);

  const createCareLog = async (
    logType: number,
    title: string,
    description: string,
    sensitiveData?: number
  ) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Contract address not configured');
    }

    // externalEuint32 is encoded as bytes32 in the ABI, so we pass the handle directly
    // For non-encrypted logs, use zero hash and empty proof
    let encryptedData = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
    let inputProof = '0x' as `0x${string}`;

    if (sensitiveData !== undefined && sensitiveData !== null) {
      if (!instance) {
        throw new Error('FHEVM not initialized. Please wait a moment and try again.');
      }
      
      try {
        // Encrypt the sensitive data
        const input = instance.createEncryptedInput(contractAddress, address);
        input.add32(sensitiveData);
        const encrypted = await input.encrypt();

        console.log('Encryption result:', {
          handles: encrypted.handles,
          handleType: typeof encrypted.handles[0],
          handleIsArray: Array.isArray(encrypted.handles[0]),
          handleIsUint8Array: encrypted.handles[0] instanceof Uint8Array,
          handleValue: encrypted.handles[0],
          inputProofType: typeof encrypted.inputProof,
          inputProofIsArray: Array.isArray(encrypted.inputProof),
          inputProofIsUint8Array: encrypted.inputProof instanceof Uint8Array,
          inputProofLength: encrypted.inputProof?.length,
        });

        // externalEuint32 is bytes32, so pass the handle directly, not as an object
        // Handle can be a hex string, Uint8Array, or array - convert to hex string
        const handle = encrypted.handles[0];
        if (typeof handle === 'string') {
          encryptedData = handle.startsWith('0x') ? handle as `0x${string}` : (`0x${handle}` as `0x${string}`);
        } else if (handle instanceof Uint8Array) {
          // Convert Uint8Array to hex string
          encryptedData = ('0x' + Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
        } else if (Array.isArray(handle)) {
          // Convert array to hex string
          encryptedData = ('0x' + handle.map(b => (typeof b === 'number' ? b : parseInt(String(b), 10)).toString(16).padStart(2, '0')).join('')) as `0x${string}`;
        } else {
          // Fallback: try to convert to string and add 0x prefix if needed
          const handleStr = String(handle);
          encryptedData = handleStr.startsWith('0x') ? handleStr as `0x${string}` : (`0x${handleStr}` as `0x${string}`);
        }
        
        console.log('Processed encryptedData:', {
          type: typeof encryptedData,
          length: encryptedData.length,
          preview: encryptedData.substring(0, 66) + '...',
        });
        
        // inputProof should be passed directly as-is (ethers Contract will handle the encoding)
        // It can be a hex string, Uint8Array, or ArrayLike<number>
        const proof = encrypted.inputProof;
        if (typeof proof === 'string') {
          inputProof = proof as `0x${string}`;
        } else if (proof instanceof Uint8Array) {
          // Convert Uint8Array to hex string
          inputProof = ('0x' + Array.from(proof).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
        } else if (Array.isArray(proof)) {
          // Convert array to hex string
          inputProof = ('0x' + proof.map(b => (typeof b === 'number' ? b : parseInt(b)).toString(16).padStart(2, '0')).join('')) as `0x${string}`;
        } else {
          inputProof = String(proof) as `0x${string}`;
        }
        
        console.log('Processed inputProof:', {
          type: typeof inputProof,
          length: inputProof.length,
          preview: inputProof.substring(0, 100),
        });
      } catch (e) {
        console.error('Encryption failed:', e);
        throw new Error('Failed to encrypt sensitive data. Please ensure FHEVM is initialized.');
      }
    }

    console.log('Creating care log:', {
      logType,
      title,
      description,
      encryptedData,
      inputProof,
      contractAddress,
      chainId,
    });

    try {
      if (!walletClient) {
        throw new Error('Wallet client not available');
      }

      // Use ethers Contract instead of viem writeContract for better FHEVM compatibility
      const signer = await walletClientToSigner(walletClient);
      const petGuardContract = new Contract(contractAddress, PETGUARD_ABI, signer);

      console.log('Calling contract.createCareLog with:', {
        logType,
        title,
        description,
        encryptedData,
        inputProofType: typeof inputProof,
        inputProofLength: inputProof.length,
      });
      
      // Pass inputProof directly - ethers will handle encoding
      // If inputProof is already a hex string, ethers will use it as-is
      // If it's an array, ethers will convert it
      const tx = await petGuardContract.createCareLog(
        logType,
        title,
        description,
        encryptedData,
        inputProof
      );

      console.log('Transaction sent, hash:', tx.hash);
      setTxHash(tx.hash as `0x${string}`);
    } catch (error: any) {
      console.error('Write contract error:', error);
      throw new Error(error?.message || 'Failed to submit transaction. Please check your wallet and try again.');
    }
  };

  const getCareLog = async (logId: bigint): Promise<CareLog | null> => {
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    try {
      // We'll need to use a read contract hook or direct call
      // For now, return a placeholder - this will be handled in the component
      return null;
    } catch (e) {
      console.error('Failed to get care log:', e);
      return null;
    }
  };

  return {
    contractAddress,
    totalLogs: totalLogs || 0n,
    ownerLogIds: ownerLogIds || [],
    createCareLog,
    getCareLog,
    isPending: isConfirming,
    isConfirming,
    isSuccess,
    hash: txHash,
    error: receiptError ? new Error('Transaction failed') : null,
    refetchOwnerLogs,
  };
}

