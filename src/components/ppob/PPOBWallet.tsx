import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/Icons";
import { PPOBWalletWidget } from "./PPOBWalletWidget";

interface PPOBWalletProps {
  showFullDetails?: boolean;
}

export function PPOBWallet({ showFullDetails = false }: PPOBWalletProps) {
  const navigate = useNavigate();

  return (
    <Card className={`${showFullDetails ? 'bg-white border' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'}`}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Use the PPOBWalletWidget with appropriate mode */}
          <div className="w-full">
            <PPOBWalletWidget mini={false} dark={!showFullDetails} />
          </div>
          
          {showFullDetails ? (
            <div className="mt-6 md:mt-0 w-full md:w-auto space-y-2">
              <Button 
                className="w-full md:w-auto"
                onClick={() => navigate('/ppob/wallet')}
              >
                <Icons.plus className="mr-2 h-4 w-4" />
                Top Up Saldo
              </Button>
              <Button 
                variant="outline"
                className="w-full md:w-auto"
                onClick={() => navigate('/ppob/wallet')}
              >
                <Icons.arrowRight className="mr-2 h-4 w-4" />
                Tarik Saldo
              </Button>
            </div>
          ) : (
            <div className="mt-4 md:mt-0 md:ml-4">
              <Button 
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => navigate('/ppob/wallet')}
              >
                <Icons.arrowRight className="mr-2 h-4 w-4" />
                Kelola Wallet
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
