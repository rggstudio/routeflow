import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';
import { Database } from '@/types/supabase';

const supabaseProjectRef = env.supabaseHost.split('.')[0] ?? '';
export const supabaseAuthStorageKey = supabaseProjectRef
  ? `sb-${supabaseProjectRef}-auth-token`
  : '';

export async function clearSupabaseSessionStorage() {
  if (!supabaseAuthStorageKey) {
    return;
  }

  await AsyncStorage.multiRemove([
    supabaseAuthStorageKey,
    `${supabaseAuthStorageKey}-code-verifier`,
    `${supabaseAuthStorageKey}-user`,
  ]);
}

export const supabase = env.isSupabaseConfigured
  ? createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        storageKey: supabaseAuthStorageKey,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
