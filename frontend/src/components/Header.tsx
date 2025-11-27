import { Lock } from "lucide-react";
import logo from "@/assets/logo.png";
import WalletButton from "./WalletButton";
import { useAccount } from "wagmi";

const Header = () => {
  const { isConnected } = useAccount();

  return (
    <header className="border-b border-border bg-gradient-card shadow-soft">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Pet Care Log" className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pet Care Log</h1>
              <p className="text-sm text-muted-foreground">Care With Privacy, Grow With Love.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Encrypted</span>
              </div>
            )}
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
