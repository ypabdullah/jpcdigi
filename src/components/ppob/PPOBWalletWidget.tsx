import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/Icons";

interface PPOBWalletWidgetProps {
  mini?: boolean;
  showActions?: boolean;
  className?: string;
  dark?: boolean;
}

export function PPOBWalletWidget({ 
  mini = false, 
  showActions = true,
  className = "",
  dark = true
}: PPOBWalletWidgetProps) {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch for balance
    const fetchBalance = async () => {
      setLoading(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Mock response
        setBalance(750000);
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (mini) {
    return (
      <Card 
        className={`hover:bg-muted/50 cursor-pointer transition-colors ${className} ${dark ? 'bg-transparent border-transparent' : ''}`} 
        onClick={() => navigate("/ppob/wallet")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icons.wallet className={`h-5 w-5 ${dark ? 'text-white' : 'text-primary'}`} />
              <span className="font-medium">PPOB Wallet</span>
            </div>
            {loading ? (
              <Skeleton className={`h-6 w-24 ${dark ? 'bg-white/20' : ''}`} />
            ) : (
              <span className="font-bold">{balance !== null ? formatCurrency(balance) : "Error"}</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${dark ? 'bg-transparent border-transparent' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2">
          <Icons.wallet className={`h-5 w-5 ${dark ? 'text-white' : 'text-primary'}`} />
          <span>PPOB Wallet</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className={`text-sm ${dark ? 'text-white/70' : 'text-muted-foreground'}`}>Saldo Anda</p>
          {loading ? (
            <Skeleton className={`h-8 w-36 ${dark ? 'bg-white/20' : ''}`} />
          ) : (
            <p className="text-2xl font-bold">
              {balance !== null ? formatCurrency(balance) : "Error memuat saldo"}
            </p>
          )}
        </div>
      </CardContent>
      {showActions && (
        <CardFooter className="flex justify-between pt-0">
          <Button 
            variant={dark ? "secondary" : "outline"} 
            size="sm" 
            className="flex-1 mr-2"
            onClick={() => navigate("/ppob/wallet")}
          >
            <Icons.plus className="mr-2 h-4 w-4" />
            Top Up
          </Button>
          <Button 
            variant={dark ? "secondary" : "outline"} 
            size="sm" 
            className="flex-1"
            onClick={() => navigate("/ppob/wallet")}
          >
            <Icons.arrowRight className="mr-2 h-4 w-4" />
            Transfer
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
