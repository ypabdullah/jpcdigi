import React from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";

const PPOBTestPage = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <div className="bg-gradient-to-b from-blue-600 to-blue-800 text-white">
        <div className="flex items-center gap-4 px-4 py-3">
          <button 
            onClick={() => navigate("/ppob")} 
            className="rounded-full w-8 h-8 flex items-center justify-center bg-white/20"
          >
            <Icons.chevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Test Page</h1>
            <p className="text-xs text-white/70">Testing icon rendering</p>
          </div>
        </div>
      </div>

      <div className="container max-w-md mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold mb-4">Available Icons</h2>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-1">
              <Icons.wallet className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xs">wallet</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-1">
              <Icons.smartphone className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-xs">smartphone</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-1">
              <Icons.zap className="h-6 w-6 text-amber-600" />
            </div>
            <span className="text-xs">zap</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-1">
              <Icons.gamepad className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xs">gamepad</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-1">
              <Icons.tv className="h-6 w-6 text-red-600" />
            </div>
            <span className="text-xs">tv</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-1">
              <Icons.shoppingCart className="h-6 w-6 text-red-600" />
            </div>
            <span className="text-xs">shoppingCart</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-1">
              <Icons.menu className="h-6 w-6 text-gray-600" />
            </div>
            <span className="text-xs">menu</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-1">
              <Icons.arrowRight className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xs">arrowRight</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mb-1">
              <Icons.arrowRight className="h-6 w-6 rotate-180 text-yellow-600" />
            </div>
            <span className="text-xs">arrowLeft (rotated)</span>
          </div>
        </div>
        
        <div className="mt-8">
          <Button onClick={() => navigate("/ppob")} className="w-full">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default PPOBTestPage;
