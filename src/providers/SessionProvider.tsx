import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { env } from '@/config/env';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type SocialAuthProvider = 'apple' | 'google';

type SessionContextValue = {
  session: Session | null;
  isConfigured: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: SocialAuthProvider) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

type SessionProviderProps = {
  children: ReactNode;
};

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(env.isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    const client = supabase;

    const bootstrapUser = async (nextSession: Session | null) => {
      setSession(nextSession);

      if (!nextSession) {
        setIsLoading(false);
        return;
      }

      const fallbackName =
        typeof nextSession.user.user_metadata.full_name === 'string'
          ? nextSession.user.user_metadata.full_name
          : (nextSession.user.email?.split('@')[0] ?? null);

      await client.from('profiles').upsert(
        {
          id: nextSession.user.id,
          full_name: fallbackName,
          phone: null,
        },
        {
          onConflict: 'id',
          ignoreDuplicates: true,
        }
      );

      await client.from('driver_preferences').upsert(
        {
          driver_id: nextSession.user.id,
          default_navigation_app: 'google_maps',
          notifications_enabled: true,
        },
        {
          onConflict: 'driver_id',
          ignoreDuplicates: true,
        }
      );

      setIsLoading(false);
    };

    client.auth.getSession().then(({ data }) => {
      void bootstrapUser(data.session);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      void bootstrapUser(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isConfigured: env.isSupabaseConfigured,
      isLoading,
      signIn: async (email, password) => {
        if (!supabase) {
          throw new Error('Supabase is not configured.');
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }
      },
      signInWithOAuth: async (provider) => {
        if (!supabase) {
          throw new Error('Supabase is not configured.');
        }

        if (provider === 'apple' && Platform.OS === 'ios') {
          const isAppleAuthAvailable = await AppleAuthentication.isAvailableAsync();

          if (!isAppleAuthAvailable) {
            throw new Error('Apple Sign In is unavailable on this device.');
          }

          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });

          if (!credential.identityToken) {
            throw new Error('Apple did not return an identity token.');
          }

          const {
            data: { user },
            error,
          } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: credential.identityToken,
          });

          if (error) {
            throw error;
          }

          const fullName = [
            credential.fullName?.givenName,
            credential.fullName?.middleName,
            credential.fullName?.familyName,
          ]
            .filter(Boolean)
            .join(' ')
            .trim();

          if (fullName) {
            const { error: userUpdateError } = await supabase.auth.updateUser({
              data: {
                full_name: fullName,
              },
            });

            if (userUpdateError) {
              throw userUpdateError;
            }

            if (user?.id) {
              const { error: profileError } = await supabase.from('profiles').upsert(
                {
                  id: user.id,
                  full_name: fullName,
                  phone: null,
                },
                {
                  onConflict: 'id',
                }
              );

              if (profileError) {
                throw profileError;
              }
            }
          }

          return;
        }

        if (Platform.OS === 'web') {
          const redirectTo = window.location.origin;
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo,
            },
          });

          if (error) {
            throw error;
          }

          return;
        }

        const redirectTo = makeRedirectUri({
          scheme: 'routeflow',
          path: 'auth/callback',
        });

        console.log('[auth] redirectTo:', redirectTo);

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          throw error;
        }

        if (!data?.url) {
          throw new Error('Supabase did not return an authentication URL.');
        }

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

        if (result.type !== 'success' || !result.url) {
          throw new Error('Authentication was cancelled.');
        }

        const callbackUrl = new URL(result.url);
        const authCode = callbackUrl.searchParams.get('code');
        const authError =
          callbackUrl.searchParams.get('error_description') ??
          callbackUrl.searchParams.get('error');

        if (authError) {
          throw new Error(authError);
        }

        if (!authCode) {
          throw new Error('No authorization code was returned from the provider.');
        }

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);

        if (exchangeError) {
          throw exchangeError;
        }
      },
      signUp: async (email, password) => {
        if (!supabase) {
          throw new Error('Supabase is not configured.');
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }
      },
      signOut: async () => {
        if (!supabase) {
          return;
        }

        await supabase.auth.signOut();
      },
    }),
    [isLoading, session]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return context;
}
