import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { ActionButton, InputField, SectionCard } from '@/components/ui';
import { SocialAuthButton } from '@/components/SocialAuthButton';
import { SocialAuthProvider, useSession } from '@/providers/SessionProvider';

type AuthMode = 'sign_in' | 'sign_up';

type AuthFormCardProps = {
  title?: string;
  description?: string;
  initialMode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  showModeToggle?: boolean;
};

export function AuthFormCard({
  title = 'Welcome back',
  description = 'Create your account to sync your rides and track earnings.',
  initialMode = 'sign_in',
  onModeChange,
  showModeToggle = true,
}: AuthFormCardProps) {
  const { isLoading, signIn, signInWithOAuth, signUp } = useSession();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSocialProvider, setActiveSocialProvider] = useState<SocialAuthProvider | null>(null);

  useEffect(() => {
    setMode(initialMode);
    onModeChange?.(initialMode);
  }, [initialMode, onModeChange]);

  const isSignIn = mode === 'sign_in';
  const isBusy = isSubmitting || isLoading || activeSocialProvider !== null;
  const socialProviders: SocialAuthProvider[] =
    Platform.OS === 'ios' ? ['apple', 'google'] : ['google'];

  const setAuthMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    onModeChange?.(nextMode);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (isSignIn) {
        await signIn(email, password);
        return;
      }

      await signUp(email, password);
      Alert.alert(
        'Account created',
        'Your account was created. If email confirmation is enabled, check your inbox before signing in.'
      );
    } catch (error) {
      Alert.alert(
        isSignIn ? 'Sign in failed' : 'Sign up failed',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialAuth = async (provider: SocialAuthProvider) => {
    try {
      setActiveSocialProvider(provider);
      await signInWithOAuth(provider);
    } catch (error) {
      Alert.alert(
        'Social sign-in failed',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setActiveSocialProvider(null);
    }
  };

  return (
    <SectionCard title={title}>
      {description ? (
        <Text className="mb-4 text-sm leading-6 text-slate-300">{description}</Text>
      ) : null}

      {showModeToggle ? (
        <View className="mb-4 flex-row gap-2">
          <View className="flex-1">
            <Pressable
              className={`rounded-full border px-4 py-2 active:opacity-80 ${
                isSignIn ? 'border-cyan-300 bg-cyan-400/15' : 'border-white/10 bg-white/5'
              }`}
              onPress={() => setAuthMode('sign_in')}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  isSignIn ? 'text-white' : 'text-slate-300'
                }`}
              >
                Sign in
              </Text>
            </Pressable>
          </View>
          <View className="flex-1">
            <Pressable
              className={`rounded-full border px-4 py-2 active:opacity-80 ${
                !isSignIn ? 'border-cyan-300 bg-cyan-400/15' : 'border-white/10 bg-white/5'
              }`}
              onPress={() => setAuthMode('sign_up')}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  !isSignIn ? 'text-white' : 'text-slate-300'
                }`}
              >
                Sign up
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View className="mb-5 gap-3">
        {socialProviders.map((provider) => {
          const isActive = activeSocialProvider === provider;

          return (
            <SocialAuthButton
              key={provider}
              provider={provider}
              disabled={isBusy}
              isLoading={isActive}
              onPress={() => handleSocialAuth(provider)}
            />
          );
        })}
      </View>

      <View className="mb-5 mt-2 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-white/10" />
        <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-slate-500">or</Text>
        <View className="h-px flex-1 bg-white/10" />
      </View>

      <InputField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />
      <InputField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Minimum 6 characters"
        secureTextEntry
      />

      <View className="gap-3">
        <ActionButton
          label={
            isSubmitting || isLoading
              ? isSignIn
                ? 'Signing in...'
                : 'Creating account...'
              : isSignIn
                ? 'Sign in'
                : 'Create account'
          }
          kind="primary"
          onPress={handleSubmit}
        />
        <View className="flex-row items-center justify-center">
          <Text className="text-center text-sm text-slate-400">
            {isSignIn ? "Don't have an account? " : 'Have an account already? '}
          </Text>
          <Pressable onPress={() => setAuthMode(isSignIn ? 'sign_up' : 'sign_in')}>
            <Text className="text-sm font-semibold text-cyan-300">
              {isSignIn ? 'Sign up' : 'Sign in'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SectionCard>
  );
}
