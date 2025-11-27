import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Shield, Wallet, AlertCircle } from 'lucide-react';

const WalletStatus = () => {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Card className="p-6 bg-accent/20 border-accent shadow-soft animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-accent/30">
            <AlertCircle className="w-6 h-6 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">Wallet Not Connected</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Connect your wallet to enable encryption features and sync your pet profiles securely.
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent-foreground" />
                Secure field-level encryption
              </li>
              <li className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-accent-foreground" />
                Decentralized data ownership
              </li>
            </ul>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-primary/10 border-primary shadow-soft animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-primary/20">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-2">Wallet Connected</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Your pet profiles are synced and encrypted data is ready to decrypt.
          </p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-foreground">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WalletStatus;
