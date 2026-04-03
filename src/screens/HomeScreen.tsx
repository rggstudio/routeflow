import { ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StatusCard } from '@/components/StatusCard';
import { env } from '@/config/env';
import { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View className="mb-8 gap-3">
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-brand-300">
            RouteFlow Starter
          </Text>
          <Text className="text-4xl font-bold text-white">Expo MVP scaffold for mobile.</Text>
          <Text className="text-base leading-7 text-slate-300">
            This project is wired for Expo, TypeScript, NativeWind, React Navigation, and a
            Supabase-backed MVP with room to grow into auth, storage, and realtime features.
          </Text>
        </View>

        <StatusCard
          title="Frontend foundation"
          description="Expo, TypeScript, React Navigation, NativeWind, gesture handling, and safe-area support are configured and ready."
          tone="ready"
        />

        <StatusCard
          title="Backend setup"
          description={
            env.isSupabaseConfigured
              ? 'Supabase environment variables are present, so the app can initialize the client and persist auth sessions.'
              : 'Add your Supabase URL and anon key to a local env file to activate the backend client.'
          }
          tone={env.isSupabaseConfigured ? 'ready' : 'setup'}
          actionLabel="Open backend overview"
          onPress={() => navigation.navigate('Backend')}
        />

        <StatusCard
          title="Auth"
          description="Session state is scaffolded through a provider so email/password, OTP, or social sign-in can be added without restructuring the app."
          tone="setup"
          actionLabel="Open account screen"
          onPress={() => navigation.navigate('Account')}
        />

        <StatusCard
          title="Storage"
          description="Reserved for future Supabase Storage integration when you need uploads such as route documents, proofs, or images."
          tone="future"
        />

        <StatusCard
          title="Realtime"
          description="Reserved for future live route updates, driver tracking, dispatch changes, or collaborative status updates through Supabase Realtime."
          tone="future"
        />
      </ScrollView>
    </View>
  );
}
