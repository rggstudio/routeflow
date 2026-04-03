import { startTransition, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '@/components/ui';
import { useRouteFlow } from '@/providers/RouteFlowProvider';
import { AccountScreen } from '@/screens/AccountScreen';
import { EarningsScreen } from '@/screens/EarningsScreen';
import { TodayScreen } from '@/screens/TodayScreen';
import { WeekScreen } from '@/screens/WeekScreen';
import { RootStackParamList } from '@/types/navigation';

type DashboardTab = 'today' | 'week' | 'earnings' | 'account';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const tabs: { key: DashboardTab; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'account', label: 'Account' },
];

const leftTabs = tabs.slice(0, 2);
const rightTabs = tabs.slice(2);

function getTabIconName(tab: DashboardTab, selected: boolean): keyof typeof Ionicons.glyphMap {
  switch (tab) {
    case 'today':
      return selected ? 'home' : 'home-outline';
    case 'week':
      return selected ? 'calendar' : 'calendar-outline';
    case 'earnings':
      return selected ? 'wallet' : 'wallet-outline';
    case 'account':
      return selected ? 'person' : 'person-outline';
    default:
      return 'ellipse-outline';
  }
}

export function DashboardScreen({ navigation }: Props) {
  const [tab, setTab] = useState<DashboardTab>('today');
  const { isHydrated } = useRouteFlow();

  const renderCurrentTab = () => {
    switch (tab) {
      case 'today':
        return <TodayScreen navigation={navigation} />;
      case 'week':
        return <WeekScreen navigation={navigation} />;
      case 'earnings':
        return <EarningsScreen navigation={navigation} />;
      case 'account':
        return <AccountScreen />;
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      {isHydrated ? (
        renderCurrentTab()
      ) : (
        <Screen scroll={false}>
          <View className="flex-1 items-center justify-center">
            <Text className="text-lg font-semibold text-white">Loading RouteFlow...</Text>
            <Text className="mt-2 text-sm text-slate-400">
              Restoring your rides and preferences.
            </Text>
          </View>
        </Screen>
      )}

      <View className="absolute bottom-0 left-0 right-0 px-5 pb-6">
        <View className="items-center">
          <Pressable
            className="absolute -top-7 z-10 h-16 w-16 items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-300 shadow-2xl active:opacity-85"
            onPress={() => navigation.navigate({ name: 'RideForm', params: undefined })}
          >
            <Ionicons name="add" size={30} color="#020617" />
          </Pressable>
        </View>

        <View className="rounded-[34px] border border-slate-800 bg-slate-950 px-4 py-4">
          <View className="min-h-[44px] flex-row items-center">
            <View className="flex-1 flex-row items-center justify-evenly pr-7">
              {leftTabs.map((item) => (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  className="flex-1 items-center justify-center py-2"
                  onPress={() => {
                    startTransition(() => {
                      setTab(item.key);
                    });
                  }}
                >
                  <Ionicons
                    name={getTabIconName(item.key, tab === item.key)}
                    size={24}
                    color={tab === item.key ? '#cffafe' : '#94a3b8'}
                  />
                </Pressable>
              ))}
            </View>

            <View className="w-16" />

            <View className="flex-1 flex-row items-center justify-evenly pl-7">
              {rightTabs.map((item) => (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  className="flex-1 items-center justify-center py-2"
                  onPress={() => {
                    startTransition(() => {
                      setTab(item.key);
                    });
                  }}
                >
                  <Ionicons
                    name={getTabIconName(item.key, tab === item.key)}
                    size={24}
                    color={tab === item.key ? '#cffafe' : '#94a3b8'}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
