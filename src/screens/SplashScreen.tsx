import { Alert, Image, Text, View } from 'react-native';
import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { SocialAuthButton } from '@/components/SocialAuthButton';
import { ActionButton, Screen } from '@/components/ui';
import { useSession } from '@/providers/SessionProvider';
import { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const valuePoints = [
  'Never lose a ride in your messages',
  'Track your weekly earnings automatically',
  'Handle recurring routes with ease',
  'Send quick updates like "On my way" in one tap',
];

export function SplashScreen({ navigation }: Props) {
  const { isLoading, signInWithOAuth } = useSession();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithOAuth('google');
    } catch (error) {
      Alert.alert(
        'Google sign-in failed',
        error instanceof Error ? error.message : 'Try again.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Screen avatarPlacement="none">
      <View className="min-h-full justify-center">
        <View className="items-center pt-6">
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 108, height: 108 }}
            resizeMode="contain"
          />
          <Text className="mt-5 text-xl font-semibold tracking-[0.6px] text-cyan-100">
            RouteFlow
          </Text>
          <Text className="mt-5 text-center text-4xl font-semibold text-white">
            Your rides. Finally organized.
          </Text>
          <Text className="mt-4 max-w-[330px] text-center text-base leading-7 text-slate-300">
            Track rides, cancellations, earnings, and communication; all in one place.
          </Text>
          <Text className="mt-3 text-center text-sm font-medium text-slate-400">
            No more searching texts. No more confusion.
          </Text>
        </View>

        <View className="mt-8">
          <SocialAuthButton
            provider="google"
            disabled={isLoading || isGoogleLoading}
            isLoading={isGoogleLoading}
            onPress={handleGoogleAuth}
          />
        </View>

        <View className="mt-8 rounded-[28px] border border-white/10 bg-slate-900/80 px-5 py-5">
          <View className="gap-4">
            {valuePoints.map((point) => (
              <View key={point} className="flex-row items-start gap-3">
                <View className="mt-0.5">
                  <Ionicons name="checkmark-circle" size={18} color="#67e8f9" />
                </View>
                <Text className="flex-1 text-sm leading-6 text-slate-200">{point}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-6 gap-3">
          <ActionButton
            label="Get Started - It's Free"
            kind="primary"
            onPress={() => navigation.navigate('Auth', { mode: 'sign_up' })}
          />
          <ActionButton
            label="Sign in"
            onPress={() => navigation.navigate('Auth', { mode: 'sign_in' })}
          />
        </View>
      </View>
    </Screen>
  );
}
