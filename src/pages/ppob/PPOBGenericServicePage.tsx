import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Icons } from "@/components/Icons";

// Generic service page that can be used as a placeholder for all PPOB services
// that don't have specific implementations yet

const PPOBGenericServicePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract service name from URL path
  const getServiceNameFromPath = () => {
    const path = location.pathname;
    const servicePath = path.split("/").pop() || "";
    
    // Convert kebab-case to Title Case with spaces
    return servicePath
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const serviceName = getServiceNameFromPath();

  return (
    <MobileLayout>
      {/* Custom Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm sticky top-0 z-10">
        <button
          onClick={() => navigate("/ppob/all")}
          className="flex items-center justify-center w-10 h-10"
        >
          <Icons.arrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium">{serviceName}</h1>
        <button className="flex items-center justify-center w-10 h-10">
          <Icons.bell className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-col items-center justify-center p-6 mt-10">
        <div className="w-20 h-20 flex items-center justify-center rounded-full bg-blue-100 mb-4">
          <Icons.settings className="w-10 h-10 text-blue-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Layanan {serviceName}</h2>
        <p className="text-gray-500 text-center mb-8">
          Halaman ini sedang dalam pengembangan. Fitur {serviceName} akan segera tersedia.
        </p>
        <button
          onClick={() => navigate("/ppob/all")}
          className="px-6 py-3 bg-primary text-white rounded-lg font-medium shadow-sm"
        >
          Kembali ke Layanan
        </button>
      </div>
    </MobileLayout>
  );
};

export default PPOBGenericServicePage;
