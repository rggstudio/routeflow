import { Image, Pressable, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AuthFormCard } from '@/components/AuthFormCard';
import { Screen } from '@/components/ui';
import { RootStackParamList } from '@/types/navigation';

const appVersion = (Constants.expoConfig?.version ?? '1.0.0') as string;

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;
type AuthMode = 'sign_in' | 'sign_up';

export function AuthScreen({ navigation, route }: Props) {
  const [activeMode, setActiveMode] = useState<AuthMode>(route.params?.mode ?? 'sign_in');

  useEffect(() => {
    setActiveMode(route.params?.mode ?? 'sign_in');
  }, [route.params?.mode]);

  return (
    <Screen avatarPlacement="none">
      <View className="min-h-full justify-center">
        <View className="pb-6 pt-6">
          <View className="mb-6">
            <Pressable
              className="self-start active:opacity-80"
              onPress={() => navigation.navigate('Splash')}
            >
              <Ionicons name="arrow-back-outline" size={18} color="#67e8f9" />
            </Pressable>
          </View>
          <View className="items-center">
            <Image
              source={require('../../assets/icon.png')}
              style={{ width: 108, height: 108, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Text className="mt-3 text-center text-4xl font-semibold text-white">
              Your rides. Finally organized.
            </Text>
            <Text className="mt-4 max-w-[320px] text-center text-base leading-7 text-slate-300">
              {activeMode === 'sign_in'
                ? 'Sign in to access your rides and earnings.'
                : 'Track rides, cancellations, and earnings; all in one place.'}
            </Text>
          </View>
        </View>

        <AuthFormCard
          title={activeMode === 'sign_in' ? 'Sign In' : 'Sign Up'}
          description=""
          initialMode={activeMode}
          onModeChange={setActiveMode}
          showModeToggle={false}
        />

        <View className="pt-4">
          <Text className="text-center text-xs font-medium uppercase tracking-[1.8px] text-slate-500">
            Version {appVersion}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
