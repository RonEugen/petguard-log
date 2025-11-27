import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PetProfile from "@/components/PetProfile";
import CareLogCard from "@/components/CareLogCard";
import AddLogDialog from "@/components/AddLogDialog";
import WalletStatus from "@/components/WalletStatus";
import { useAccount, useReadContract } from "wagmi";
import { usePetGuard, CareLog } from "@/hooks/usePetGuard";
import { useFHEVM } from "@/hooks/useFHEVM";
import { formatDistanceToNow } from "date-fns";
import { Address } from "viem";

const PETGUARD_ABI = [
  {
    inputs: [{ name: 'logId', type: 'uint256' }],
    name: 'getCareLog',
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'logType', type: 'uint8' },
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'hasEncryptedData', type: 'bool' },
      { name: 'encryptedSensitiveData', type: 'bytes32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const Index = () => {
  const { address, isConnected } = useAccount();
  const { contractAddress, ownerLogIds, totalLogs } = usePetGuard();
  const { decryptEuint32 } = useFHEVM();
  const [logs, setLogs] = useState<Array<{
    type: "feeding" | "medication" | "activity";
    title: string;
    time: string;
    description: string;
    isEncrypted: boolean;
    sensitiveInfo?: string;
    logId: bigint;
  }>>([]);
  const [decryptingLogs, setDecryptingLogs] = useState<Set<bigint>>(new Set());

  // Fetch all logs for the owner
  useEffect(() => {
    if (!isConnected || !address || ownerLogIds.length === 0 || contractAddress === '0x0000000000000000000000000000000000000000') {
      setLogs([]);
      return;
    }

    const fetchLogs = async () => {
      const logPromises = ownerLogIds.map(async (logId) => {
        try {
          // We'll need to use a different approach since useReadContract doesn't work well in loops
          // For now, we'll create a component that fetches individual logs
          return { logId, fetched: false };
        } catch (e) {
          console.error(`Failed to fetch log ${logId}:`, e);
          return null;
        }
      });

      const results = await Promise.all(logPromises);
      // This will be handled by individual log fetchers
    };

    fetchLogs();
  }, [ownerLogIds, address, isConnected, contractAddress]);

  // Show message if no logs
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-8 animate-fade-in">
            <WalletStatus />
            <PetProfile />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Care History</h2>
                <p className="text-sm text-muted-foreground mt-1">Track your pet's daily care with privacy</p>
              </div>
              <AddLogDialog />
            </div>
            <div className="text-center py-12">
              <p className="text-muted-foreground">Connect your wallet to view and create care logs</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (ownerLogIds.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-8 animate-fade-in">
            <WalletStatus />
            <PetProfile />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Care History</h2>
                <p className="text-sm text-muted-foreground mt-1">Track your pet's daily care with privacy</p>
              </div>
              <AddLogDialog />
            </div>
            <div className="text-center py-12">
              <p className="text-muted-foreground">No care logs yet. Create your first one!</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-8 animate-fade-in">
          <WalletStatus />
          
          <PetProfile />
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Care History</h2>
              <p className="text-sm text-muted-foreground mt-1">Track your pet's daily care with privacy</p>
            </div>
            <AddLogDialog />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ownerLogIds.map((logId) => (
              <LogCardFetcher
                key={logId.toString()}
                logId={logId}
                contractAddress={contractAddress}
                decryptEuint32={decryptEuint32}
                address={address as Address}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Component to fetch and display individual log
function LogCardFetcher({
  logId,
  contractAddress,
  decryptEuint32,
  address,
}: {
  logId: bigint;
  contractAddress: Address;
  decryptEuint32: (contractAddress: string, handle: string) => Promise<bigint | null>;
  address: Address;
}) {
  const { data: logData, isLoading } = useReadContract({
    address: contractAddress,
    abi: PETGUARD_ABI,
    functionName: 'getCareLog',
    args: [logId],
    query: { enabled: contractAddress !== '0x0000000000000000000000000000000000000000' },
  });

  const [decryptedValue, setDecryptedValue] = useState<bigint | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleDecrypt = async () => {
    if (!logData || !logData[5] || !logData[6]) return; // hasEncryptedData, encryptedSensitiveData

    setIsDecrypting(true);
    try {
      const value = await decryptEuint32(contractAddress, logData[6] as string);
      setDecryptedValue(value);
    } catch (e) {
      console.error('Decryption failed:', e);
    } finally {
      setIsDecrypting(false);
    }
  };

  // Extract data safely
  const owner = logData?.[0];
  const logType = logData?.[1];
  const title = logData?.[2];
  const description = logData?.[3];
  const timestamp = logData?.[4];
  const hasEncryptedData = logData?.[5];
  const encryptedSensitiveData = logData?.[6];


  if (isLoading || !logData) {
    return (
      <div className="p-4 bg-card border border-border rounded-lg animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    );
  }

  const typeMap: Record<number, "feeding" | "medication" | "activity"> = {
    0: "feeding",
    1: "medication",
    2: "activity",
  };

  const time = formatDistanceToNow(new Date(Number(timestamp) * 1000), { addSuffix: true });

  return (
    <CareLogCard
      type={typeMap[Number(logType)] || "feeding"}
      title={title}
      time={time}
      description={description}
      isEncrypted={hasEncryptedData}
      sensitiveInfo={
        hasEncryptedData
          ? decryptedValue !== null
            ? `Encrypted value: ${decryptedValue.toString()}`
            : isDecrypting
            ? "Decrypting..."
            : owner.toLowerCase() !== address.toLowerCase()
            ? "Encrypted"
            : undefined
          : undefined
      }
      onDecrypt={hasEncryptedData && owner.toLowerCase() === address.toLowerCase() ? handleDecrypt : undefined}
      isDecrypting={isDecrypting}
    />
  );
}

export default Index;
