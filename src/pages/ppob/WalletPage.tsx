import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

export function WalletPage() {
  const navigate = useNavigate();
  
  // Redirect to the new wallet page
  useEffect(() => {
    navigate('/ppob/wallet');
  }, [navigate]);
  
  return (
    <>
      <Helmet>
        <title>Redirecting to PPOB Wallet - JPC Digi</title>
      </Helmet>
      <div className="flex items-center justify-center h-screen">
        <p>Redirecting to new wallet page...</p>
      </div>
    </>
  );
}
