import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { UserProfile } from "@/data/models";
import { requestFCMToken } from "@/integrations/firebase/config";
import { storeFCMToken } from "@/integrations/firebase/notification-service";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isPhoneVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  checkPhoneVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  
  // Function to fetch user profile data from Supabase
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data as UserProfile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  // Function to create or update profile if missing
  const ensureProfileExists = async (userId: string, userData: Partial<UserProfile> = {}) => {
    try {
      // First check if profile exists
      let profile = await fetchProfile(userId);
      
      // If profile doesn't exist, create it
      if (!profile) {
        console.log('Profile not found, creating new profile for user:', userId);
        
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name: userData.name || '',
            email: userData.email || '',
            role: userData.role || 'customer', // Default role
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating profile:', error);
          return null;
        }
        
        profile = data as UserProfile;
      }
      
      return profile;
    } catch (error) {
      console.error('Error in ensureProfileExists:', error);
      return null;
    }
  };
  
  const refreshProfile = async () => {
    if (!user) return;
    // First try to fetch, then ensure it exists if not found
    let userProfile = await fetchProfile(user.id);
    if (!userProfile) {
      userProfile = await ensureProfileExists(user.id, {
        email: user.email,
        name: user.user_metadata?.name || ''
      });
    }
    if (userProfile) setProfile(userProfile);
  };
  
  // Set up auth state listener and check for existing session
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          setIsLoading(true);
          // Use setTimeout to prevent potential deadlocks with Supabase auth
          setTimeout(async () => {
            // Try to fetch profile first
            let userProfile = await fetchProfile(newSession.user.id);
            
            // If profile doesn't exist or RLS issues, try to ensure it exists
            if (!userProfile) {
              userProfile = await ensureProfileExists(newSession.user.id, {
                email: newSession.user.email,
                name: newSession.user.user_metadata?.name || ''
              });
            }
            
            setProfile(userProfile);
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );
    
    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        // Try to fetch profile first
        let userProfile = await fetchProfile(currentSession.user.id);
        
        // If profile doesn't exist or RLS issues, try to ensure it exists
        if (!userProfile) {
          userProfile = await ensureProfileExists(currentSession.user.id, {
            email: currentSession.user.email,
            name: currentSession.user.user_metadata?.name || ''
          });
        }
        
        // Check if profile exists and try to get/update FCM token
        if (userProfile) {
          try {
            // Always request and update FCM token on session check/login
            const fcmToken = await requestFCMToken();
            if (fcmToken) {
              // Store token in Supabase profile
              await storeFCMToken(currentSession.user.id, fcmToken);
              console.log('FCM token updated for returning user:', currentSession.user.id, 'Token:', fcmToken.substring(0, 10) + '...');
              
              // Update the local profile object with the new token
              userProfile.fcm_token = fcmToken;
              
              // Log device info for tracking
              const deviceInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                vendor: navigator.vendor,
                timestamp: new Date().toISOString(),
              };
              console.log('Device info for FCM token:', deviceInfo);
            }
          } catch (fcmError) {
            console.error('Error generating/storing FCM token on session check:', fcmError);
            // Non-critical error, continue with login
          }
        }
        
        setProfile(userProfile);
      }
      
      setIsLoading(false);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Untuk mencegah terlalu sering pengecekan (debouncing)
  let lastPhoneVerificationCheck = 0;
  let cachedVerificationResult = false;

  // Check if user's phone is verified with debouncing untuk mencegah throttling
  const checkPhoneVerification = async (): Promise<boolean> => {
    if (!user) return false;
    
    // Gunakan cache jika pengecekan terakhir kurang dari 5 detik yang lalu
    const now = Date.now();
    const DEBOUNCE_TIME = 5000; // 5 seconds
    
    if (now - lastPhoneVerificationCheck < DEBOUNCE_TIME) {
      console.log('Using cached phone verification result:', cachedVerificationResult);
      return cachedVerificationResult;
    }
    
    try {
      lastPhoneVerificationCheck = now;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_phone_verified, phone_verified_at')
        .eq('id', user.id)
        .single();
      
      if (error || !data) {
        console.error('Error checking phone verification:', error);
        cachedVerificationResult = false;
        setIsPhoneVerified(false);
        return false;
      }
      
      const isVerified = data.is_phone_verified === true;
      cachedVerificationResult = isVerified;
      
      // Hanya update state jika berubah untuk mengurangi re-render
      if (isPhoneVerified !== isVerified) {
        setIsPhoneVerified(isVerified);
      }
      
      return isVerified;
    } catch (error) {
      console.error('Error in checkPhoneVerification:', error);
      cachedVerificationResult = false;
      setIsPhoneVerified(false);
      return false;
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Load user profile data
        const userProfile = await fetchProfile(data.user.id);
        if (userProfile) {
          setProfile(userProfile);
        }
        
        // Check phone verification status
        await checkPhoneVerification();

        // Selalu perbarui token FCM saat login sesuai dengan memori terakhir
        if ("Notification" in window && "serviceWorker" in navigator) {
          try {
            // Selalu coba mendapatkan token baru saat login
            const fcmToken = await requestFCMToken();
            
            if (fcmToken) {
              // Store FCM token in local storage and user profile
              localStorage.setItem("fcmToken", fcmToken);
              await storeFCMToken(data.user.id, fcmToken);
              
              // Update profile state dengan token FCM baru jika profile telah diambil
              if (profile) {
                setProfile(prev => prev ? {
                  ...prev,
                  fcm_token: fcmToken,
                  last_token_update: new Date().toISOString()
                } : prev);
              }
              
              console.log('FCM token updated for user on login:', data.user.id, 'Token:', fcmToken.substring(0, 10) + '...');
            } else {
              console.log('No FCM token could be generated, notifications may not work');
            }
          } catch (fcmError) {
            console.error('Error generating/storing FCM token:', fcmError);
            // Don't throw error, as this is not critical for login
          }
        }
      }
      
      // The session and user state will be updated by the auth listener
    } catch (error: any) {
      console.error("Login error:", error);
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // First register the user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (signUpError) {
        throw signUpError;
      }
      
      // Manually create profile after successful registration
      if (data.user) {
        await ensureProfileExists(data.user.id, {
          email,
          name,
          role: 'customer' // Default role for new users
        });
        
        // Generate and store FCM token for notifications with complete device info
        try {
          const fcmToken = await requestFCMToken();
          if (fcmToken) {
            // Store token in Supabase profile
            await storeFCMToken(data.user.id, fcmToken);
            
            // Collect device information for logging only
            const deviceInfo = {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              appName: navigator.appName,
              vendor: navigator.vendor,
              appVersion: navigator.appVersion,
              language: navigator.language,
              screen: {
                width: window.screen.width,
                height: window.screen.height,
                colorDepth: window.screen.colorDepth,
                pixelDepth: window.screen.pixelDepth
              },
              registrationTime: new Date().toISOString()
            };
            
            // Log device info but don't store in the database
            console.log('New user device info:', deviceInfo);
              
            console.log('FCM token generated and stored for new user:', data.user.id, 'Token:', fcmToken.substring(0, 10) + '...');
            console.log('Device info stored:', deviceInfo);
            
            // If profile was created, make sure it has the token and updated info
            const userProfile = await fetchProfile(data.user.id);
            if (userProfile) {
              setProfile({
                ...userProfile,
                fcm_token: fcmToken
              });
            }
          }
        } catch (fcmError) {
          console.error('Error generating/storing FCM token during registration:', fcmError);
          // Non-critical error, continue with registration
        }
      }
      
      // The session and user state will be updated by the auth listener
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      // The session and user state will be updated by the auth listener
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  

  
  // Check verification status when user or profile changes
  useEffect(() => {
    if (user && profile) {
      checkPhoneVerification();
    } else {
      setIsPhoneVerified(false);
    }
  }, [user, profile]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isLoading,
      isPhoneVerified,
      login,
      register,
      logout,
      refreshProfile,
      checkPhoneVerification
    }}>
      {children}
    </AuthContext.Provider>
  );
}
