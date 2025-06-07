import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Icons } from "@/components/Icons";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet";
import { getPPOBServices } from "@/services/ppobService";
import type { PPOBService } from "@/integrations/supabase/ppob-types";

// Define category colors
const categoryColors: Record<string, { bg: string; icon: string }> = {
  'Top Up': { bg: '#E3F2FD', icon: '#1976D2' },
  'Tagihan': { bg: '#FFF3E0', icon: '#F57C00' },
  'Investasi': { bg: '#E8F5E9', icon: '#388E3C' },
  'Lainnya': { bg: '#F5F5F5', icon: '#757575' },
};

// Helper function to get gradient start color
const getGradientFrom = (colorClass: string) => {
  if (colorClass.includes('green')) return '#bbf7d0';
  if (colorClass.includes('blue')) return '#bfdbfe';
  if (colorClass.includes('amber')) return '#fef3c7';
  if (colorClass.includes('red')) return '#fee2e2';
  if (colorClass.includes('orange')) return '#fed7aa';
  if (colorClass.includes('pink')) return '#fbcfe8';
  return '#ddd6fe'; // default purple
};

// Helper function to get gradient end color
const getGradientTo = (colorClass: string) => {
  if (colorClass.includes('green')) return '#86efac';
  if (colorClass.includes('blue')) return '#93c5fd';
  if (colorClass.includes('amber')) return '#fcd34d';
  if (colorClass.includes('red')) return '#fca5a5';
  if (colorClass.includes('orange')) return '#fdba74';
  if (colorClass.includes('pink')) return '#f9a8d4';
  return '#c4b5fd'; // default purple
};

const PPOBAllServicesPage = () => {
  const navigate = useNavigate();
  const [animateItems, setAnimateItems] = useState(false);
  const [services, setServices] = useState<PPOBService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Start animation after component mounts
    setAnimateItems(true);
    
    // Fetch services from Supabase
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const servicesData = await getPPOBServices();
        setServices(servicesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching PPOB services:", err);
        setError('Failed to load services. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServices();
  }, []);

  // Group services by category for display
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'Lainnya';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, PPOBService[]>);

  // Helper function to render service icons
  const renderIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case "wallet":
        return <Icons.wallet className={className} />;
      case "smartphone":
        return <Icons.smartphone className={className} />;
      case "wifi":
        return <Icons.wifi className={className} />;
      case "globe":
        return <Icons.package className={className} />;
      case "zap":
        return <Icons.zap className={className} />;
      case "creditCard":
        return <Icons.creditCard className={className} />;
      case "tv":
        return <Icons.tv className={className} />;
      case "shield":
        return <Icons.shield className={className} />;
      case "droplet":
        return <Icons.droplet className={className} />;
      case "calculator":
        return <Icons.barChart className={className} />;
      case "home":
        return <Icons.home className={className} />;
      case "phone":
        return <Icons.phone className={className} />;
      case "receipt":
        return <Icons.file className={className} />;
      case "graduationCap":
        return <Icons.file className={className} />;
      case "heart":
        return <Icons.heart className={className} />;
      case "gift":
        return <Icons.package className={className} />;
      case "banknote":
        return <Icons.creditCard className={className} />;
      case "plus":
        return <Icons.plus className={className} />;
      case "users":
        return <Icons.users className={className} />;
      default:
        return <Icons.bell className={className} />;
    }
  };

  const handleServiceClick = (route: string) => {
    navigate(route);
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <Helmet>
          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
              }
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
              }
              .animate-item {
                animation: fadeIn 0.5s ease forwards;
                opacity: 0;
              }
              .service-icon:hover {
                animation: bounce 0.6s ease infinite;
              }
              .pulse-effect {
                animation: pulse 2s infinite ease-in-out;
              }
              .baru-badge {
                animation: pulse 1.5s infinite;
              }
            `}
          </style>
        </Helmet>
        {/* Header */}
        <div className="bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => navigate("/ppob")}
              className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-all duration-200"
            >
              <Icons.chevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold ml-4">Semua Layanan </h1>
          </div>
        </div>

        {/* Service Categories */}
        <div className="pb-6 bg-gray-50 min-h-screen">
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout>
        <Helmet>
          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
              }
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
              }
              .animate-item {
                animation: fadeIn 0.5s ease forwards;
                opacity: 0;
              }
              .service-icon:hover {
                animation: bounce 0.6s ease infinite;
              }
              .pulse-effect {
                animation: pulse 2s infinite ease-in-out;
              }
              .baru-badge {
                animation: pulse 1.5s infinite;
              }
            `}
          </style>
        </Helmet>
        {/* Header */}
        <div className="bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => navigate("/ppob")}
              className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-all duration-200"
            >
              <Icons.chevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold ml-4">Semua Layanan </h1>
          </div>
        </div>

        {/* Service Categories */}
        <div className="pb-6 bg-gray-50 min-h-screen">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <Helmet>
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
            .animate-item {
              animation: fadeIn 0.5s ease forwards;
              opacity: 0;
            }
            .service-icon:hover {
              animation: bounce 0.6s ease infinite;
            }
            .pulse-effect {
              animation: pulse 2s infinite ease-in-out;
            }
            .baru-badge {
              animation: pulse 1.5s infinite;
            }
          `}
        </style>
      </Helmet>
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate("/ppob")}
            className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-all duration-200"
          >
            <Icons.chevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold ml-4">Semua Layanan </h1>
        </div>
      </div>

      {/* Service Categories */}
      <div className="pb-6 bg-gray-50 min-h-screen">
        {Object.entries(groupedServices).map(([category, catServices]) => (
          <div key={category} className="mt-4 px-4">
            <h2 className="text-lg font-semibold mb-3">{category}</h2>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="grid grid-cols-4 gap-y-6">
                {catServices.map((service, idx) => (
                  <div
                    key={service.id}
                    className={cn(
                      "flex flex-col items-center relative animate-item",
                      animateItems ? "" : "opacity-0",
                    )}
                    onClick={() => handleServiceClick(service.route || '/ppob/generic')}
                    style={{ animationDelay: `${idx * 0.07}s` }}
                  >
                    <div
                      className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center mb-2 relative service-icon shadow-sm",
                        service.color || categoryColors[category]?.bg || '#F5F5F5',
                        service.is_new && "pulse-effect"
                      )}
                    >
                      <div className={service.icon_color || categoryColors[category]?.icon || '#757575'}>
                        {renderIcon(service.icon || 'Box', "h-6 w-6")}
                      </div>
                      {service.is_new && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1 rounded-full">Baru</div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-center max-w-[80px] leading-tight">
                      {service.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </MobileLayout>
  );
};

export default PPOBAllServicesPage;
