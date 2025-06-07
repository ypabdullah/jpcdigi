import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component that handles post-verification refresh after WhatsApp verification
 * It should be mounted in the main App component to detect when user returns to home page
 * after successful WhatsApp verification and refresh the page once
 */
export function WhatsAppVerificationHandler() {
  const location = useLocation();
  
  useEffect(() => {
    // Check if we're on the home page
    if (location.pathname === '/') {
      // Check if we have the success flag
      const hasVerificationSuccess = localStorage.getItem('whatsapp_verification_success') === 'true';
      
      if (hasVerificationSuccess) {
        // Remove the flag immediately to prevent multiple refreshes
        localStorage.removeItem('whatsapp_verification_success');
        
        // Refresh the page once with a slight delay
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
  }, [location.pathname]);
  
  return null; // This component doesn't render anything
}
