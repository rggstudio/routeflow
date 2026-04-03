import { ScrollView, Text, View } from 'react-native';

import { StatusCard } from '@/components/StatusCard';
import { env } from '@/config/env';

export function BackendScreen() {
  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View className="mb-8 gap-3">
          <Text className="text-3xl font-bold text-white">Supabase backend</Text>
          <Text className="text-base leading-7 text-slate-300">
            The client is wired for a hosted Postgres database and persistent auth sessions on
            mobile. A starter SQL migration is included under the `supabase` folder for the MVP.
          </Text>
        </View>

        <StatusCard
          title="Environment"
          description={
            env.isSupabaseConfigured
              ? 'Your Expo public Supabase variables are available to the app.'
              : 'Create a `.env.local` file from `.env.example` and add your Supabase project values.'
          }
          tone={env.isSupabaseConfigured ? 'ready' : 'setup'}
        />

        <StatusCard
          title="Postgres schema"
          description="A starter migration defines `profiles`, `routes`, and `stops` tables with basic RLS policies so the MVP can grow around route operations."
          tone="ready"
        />

        <StatusCard
          title="Auth integration"
          description="The Supabase client already uses AsyncStorage for persisted sessions, so adding a sign-in screen later will plug into the existing provider."
          tone="setup"
        />

        <StatusCard
          title="Future services"
          description="Storage and Realtime are intentionally left as the next layer so the MVP stays lean while the app foundation remains extensible."
          tone="future"
        />
      </ScrollView>
    </View>
  );
}
