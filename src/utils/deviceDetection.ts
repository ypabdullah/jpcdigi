/**
 * Utility functions for device detection
 */

/**
 * Check if the current device is a mobile device
 * @returns boolean indicating if the device is mobile
 */
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Regular expression to detect mobile devices
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  return mobileRegex.test(userAgent);
};

/**
 * Check if browser notifications are supported
 * @returns boolean indicating if notifications are supported
 */
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

/**
 * Check if service workers are supported
 * @returns boolean indicating if service workers are supported
 */
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

/**
 * Determine the best notification method based on device and browser capabilities
 * @returns 'browser' | 'whatsapp' | 'none'
 */
export const getBestNotificationMethod = (): 'browser' | 'whatsapp' | 'none' => {
  const isMobile = isMobileDevice();
  const notificationsSupported = isNotificationSupported();
  
  if (isMobile) {
    // For mobile devices, prefer WhatsApp
    return 'whatsapp';
  } else if (notificationsSupported) {
    // For desktop with notification support
    return 'browser';
  } else {
    // No good notification method available
    return 'none';
  }
};
