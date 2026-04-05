import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { env } from '@/config/env';
import { supabase } from '@/lib/supabase';

let GoogleSignin: {
  configure: (opts: object) => void;
  hasPlayServices: (opts: object) => Promise<void>;
  signIn: () => Promise<{ data?: { idToken?: string | null } }>;
  signOut: () => Promise<void>;
} | null = null;

let GoogleStatusCodes: { SIGN_IN_CANCELLED: string } | null = null;

try {
  // This native module is only available in custom dev builds, not Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const gsModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = gsModule.GoogleSignin;
  GoogleStatusCodes = gsModule.statusCodes;
} catch {
  // Native module unavailable — Google Sign-In is disabled in this environment.
}

WebBrowser.maybeCompleteAuthSession();

if (Platform.OS !== 'web' && env.isGoogleSignInConfigured && GoogleSignin) {
  GoogleSignin.configure({
    iosClientId: env.googleIosClientId,
    scopes: ['email', 'profile'],
  });
}

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

        // ── Apple (native iOS only) ──────────────────────────────────────────
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

        // ── Google native SDK (custom dev build / production) ─────────────────
        if (provider === 'google' && Platform.OS !== 'web' && GoogleSignin && env.isGoogleSignInConfigured) {
          try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const response = await GoogleSignin.signIn();
            const idToken = response.data?.idToken;

            if (!idToken) {
              throw new Error('Google Sign-In did not return an ID token.');
            }

            const { error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: idToken,
            });

            if (error) {
              throw error;
            }
          } catch (err: unknown) {
            if (
              typeof err === 'object' &&
              err !== null &&
              'code' in err &&
              GoogleStatusCodes !== null &&
              (err as { code: string }).code === GoogleStatusCodes.SIGN_IN_CANCELLED
            ) {
              throw new Error('Google Sign-In was cancelled.');
            }
            throw err;
          }

          return;
        }

        // ── Web OAuth flow (all providers on web) ────────────────────────────
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

        // ── Generic native OAuth fallback (non-Google native providers) ──────
        const redirectTo = makeRedirectUri({
          scheme: 'routeflow',
          path: 'auth/callback',
        });

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
        const queryParams = callbackUrl.searchParams;
        const hashParams = new URLSearchParams(callbackUrl.hash.replace(/^#/, ''));

        const authError =
          queryParams.get('error_description') ??
          queryParams.get('error') ??
          hashParams.get('error_description') ??
          hashParams.get('error');

        if (authError) {
          throw new Error(authError);
        }

        const authCode = queryParams.get('code') ?? hashParams.get('code');
        if (authCode) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
          if (exchangeError) throw exchangeError;
          return;
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          return;
        }

        throw new Error('No authorization code or token was returned from the provider.');
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

        if (Platform.OS !== 'web' && GoogleSignin) {
          try {
            await GoogleSignin.signOut();
          } catch {
            // If Google Sign-In wasn't used, this is a no-op
          }
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
