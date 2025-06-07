import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Helper function to check if a value is defined
const isDefined = (value: any) => value !== undefined && value !== null && value !== '';

// Your web app's Firebase configuration
// For production, replace with your actual Firebase config values
// You can find these values in your Firebase project settings
// In Vite, environment variables are accessed through import.meta.env and must be prefixed with VITE_
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBLkK6LwseUvbA6oDTQTLd2Z4MpmH7NhgQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "jpccoal.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "jpccoal",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "jpccoal.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "427360291711",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:427360291711:web:90ee121cbc8cc64b8de84a",
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "BHH5-vMogiQiVgytRhYjTq6AtpObVKuZr1apoQbx9oD8zL8VywEhcXe5hooGzisOoJEVtPrWRWM6_N_Hoe3mE4U"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase messaging only if browser supports it
let messaging: any = null;
try {
  // Check if we're in a browser and it supports the required features
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(firebaseApp);
    console.log('Firebase messaging initialized successfully');
  } else {
    console.log('Firebase messaging not supported in this environment');
  }
} catch (error) {
  console.error('Error initializing Firebase messaging:', error);
}

// Initialize Firestore with offline persistence
const db = getFirestore(firebaseApp);

// Initialize Firestore with specific settings
const initializeFirestore = async () => {
  try {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      // Set the cache size to unlimited
      await enableIndexedDbPersistence(db)
        .then(() => {
          console.log('Firestore offline persistence enabled successfully');
        })
        .catch((error) => {
          if (error.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time
            console.log('Firebase persistence not enabled: Multiple tabs open');
          } else if (error.code === 'unimplemented') {
            // The current browser does not support all of the features required for persistence
            console.log('Firebase persistence not available in this browser');
          } else {
            console.error('Error initializing Firebase persistence:', error);
          }
        });
    }
  } catch (error) {
    console.error('Error setting up Firestore persistence:', error);
  }
};

// Run the initialization
initializeFirestore().catch(err => {
  console.error('Failed to initialize Firestore:', err);
});

// Helper function to check if notification permissions are supported
export const isNotificationSupported = () => {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
};

// Helper function to retry Firebase operations
export const retryFirebaseOperation = async (operation: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      console.log(`Firebase operation failed (attempt ${attempt + 1}/${maxRetries}):`, error.message);
      lastError = error;
      
      // Wait before retrying
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
};

// Function to request permission and get FCM token with enhanced error handling and validation
export const requestFCMToken = async () => {
  try {
    // Check if browser supports notifications
    if (!isNotificationSupported()) {
      console.log('This browser does not support notifications - likely a mobile device without notification support');
      return null;
    }
    
    // Add service worker check - FCM requires service workers
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers not supported in this browser, FCM token cannot be generated');
      return null;
    }
    
    // Make sure Firebase is properly initialized before continuing
    if (!firebaseApp || !messaging) {
      console.error('Firebase not properly initialized');
      return null;
    }
    
    // Check if notification permission is granted
    if (Notification.permission !== 'granted') {
      console.log('Requesting notification permission from user...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('User denied notification permission');
        return null;
      }
      console.log('Notification permission granted by user');
    }
    
    // Ensure service worker is registered
    try {
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        console.log('Firebase messaging service worker not registered, attempting to register now');
        await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
        console.log('Firebase messaging service worker registered');
      }
    } catch (swError) {
      console.error('Error registering service worker:', swError);
    }
    
    console.log('Generating FCM token with VAPID key...');
    
    // Get the FCM token with proper error handling
    try {
      if (!messaging) {
        console.error('Cannot get FCM token: Firebase messaging not initialized');
        return null;
      }
      
      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BHH5-vMogiQiVgytRhYjTq6AtpObVKuZr1apoQbx9oD8zL8VywEhcXe5hooGzisOoJEVtPrWRWM6_N_Hoe3mE4U'
      });
      
      if (currentToken) {
        // Log part of the token for debugging but hide most of it for security
        console.log('FCM token generated successfully:', currentToken.substring(0, 10) + '...' + currentToken.substring(currentToken.length - 5));
        
        // Store token in localStorage as backup
        try {
          localStorage.setItem('fcm_token', currentToken);
          localStorage.setItem('fcm_token_timestamp', new Date().toISOString());
        } catch (storageError) {
          console.warn('Could not store FCM token in localStorage:', storageError);
        }
        
        return currentToken;
      } else {
        console.warn('Firebase returned empty token');
        
        // Try to get from localStorage as fallback
        const storedToken = localStorage.getItem('fcm_token');
        if (storedToken) {
          console.log('Using previously stored FCM token from localStorage');
          return storedToken;
        }
        
        return null;
      }
    } catch (tokenError) {
      console.error('Error during FCM token generation:', tokenError);
      
      // Try to get from localStorage as fallback
      const storedToken = localStorage.getItem('fcm_token');
      if (storedToken) {
        console.log('Using previously stored FCM token from localStorage after error');
        return storedToken;
      }
      
      return null;
    }
  } catch (error) {
    console.error('Unexpected error in requestFCMToken:', error);
    return null;
  }
};

// Function to setup firebase cloud messaging
export const setupFCM = async (callback: (payload: any) => void) => {
  // Check if messaging is initialized
  if (!messaging) {
    console.log('Firebase messaging not initialized, skipping FCM setup');
    return;
  }
  
  // Add message event listener
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    callback(payload);
  });
};

export { firebaseApp, messaging, db };
