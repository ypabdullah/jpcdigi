import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase';
import type { Database } from '@/integrations/supabase/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const useUser = () => {
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;
          setUserProfile(profile as Profile);

          // Fetch user balance
          const { data: balanceData, error: balanceError } = await supabase
            .from('balances')
            .select('balance')
            .eq('user_id', user.id)
            .single();

          if (balanceError) throw balanceError;
          setBalance(balanceData?.balance || 0);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return { userProfile, balance, isLoading };
};
