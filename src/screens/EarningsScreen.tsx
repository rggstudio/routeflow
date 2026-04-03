import { useState } from 'react';
import { Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ActionButton, Screen, SectionCard, StatTile } from '@/components/ui';
import { addDays, getFullDateLabel, getStartOfWeek, getWeekRangeLabel, toIsoDate } from '@/lib/date';
import { useRouteFlow } from '@/providers/RouteFlowProvider';
import { RootStackParamList } from '@/types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

function getWeekTone(totalEarnings: number) {
  if (totalEarnings >= 300) {
    return 'Great week';
  }

  if (totalEarnings >= 150) {
    return 'Steady week';
  }

  return 'Slow week';
}

export function EarningsScreen({ navigation }: Props) {
  const thisWeek = getStartOfWeek(new Date());
  const [weekStart, setWeekStart] = useState(toIsoDate(thisWeek));
  const { getWeekMetrics } = useRouteFlow();
  const metrics = getWeekMetrics(weekStart);

  return (
    <Screen>
      <View className="mb-6">
        <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-300">
          Weekly earnings
        </Text>
        <Text className="mt-2 text-4xl font-semibold text-white">
          ${metrics.totalEarnings.toFixed(2)}
        </Text>
        <Text className="mt-3 text-base leading-7 text-slate-300">
          {getWeekRangeLabel(weekStart)}. {getWeekTone(metrics.totalEarnings)}.
        </Text>
      </View>

      <SectionCard title="Week selector">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <ActionButton
              label="Previous week"
              icon="chevron-back-outline"
              onPress={() =>
                setWeekStart(toIsoDate(addDays(new Date(`${weekStart}T00:00:00`), -7)))
              }
            />
          </View>
          <View className="flex-1">
            <ActionButton
              label="Next week"
              icon="chevron-forward-outline"
              onPress={() =>
                setWeekStart(toIsoDate(addDays(new Date(`${weekStart}T00:00:00`), 7)))
              }
            />
          </View>
        </View>
      </SectionCard>

      <View className="mb-4 flex-row gap-3">
        <StatTile
          label="# of rides"
          value={`${metrics.totalRides}`}
          style={{ flex: 0.9 }}
          labelClassName="text-[10px] tracking-[1.2px]"
          valueClassName="text-xl"
        />
        <StatTile
          label="Completed"
          value={`${metrics.completedRides}`}
          tone="positive"
          style={{ flex: 1.15 }}
          labelClassName="text-[10px] tracking-[1.2px]"
          valueClassName="text-xl"
        />
        <StatTile
          label="Canceled"
          value={`${metrics.canceledRides}`}
          tone="warning"
          labelClassName="text-[10px] tracking-[1.2px]"
          valueClassName="text-xl"
        />
      </View>

      <SectionCard title="Ride breakdown">
        {metrics.rides.length > 0 ? (
          metrics.rides.map((ride) => (
            <View
              key={ride.occurrence.id}
              className="mb-3 flex-row items-center justify-between rounded-3xl bg-white/5 px-4 py-4"
            >
              <View className="flex-1 pr-4">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="person-circle-outline" size={15} color="#94a3b8" />
                  <Text className="font-semibold text-white">{ride.group.riderName}</Text>
                </View>
                <View className="mt-1 flex-row items-center gap-1.5">
                  <Ionicons name="time-outline" size={13} color="#64748b" />
                  <Text className="text-sm text-slate-400">
                    {getFullDateLabel(ride.occurrence.serviceDate)} at {ride.outboundLeg.pickupTime}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="cash-outline" size={14} color="#a5f3fc" />
                <Text className="text-base font-semibold text-cyan-200">
                  ${ride.effectivePay.toFixed(2)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text className="text-sm leading-6 text-slate-300">
            No rides in this week yet. RouteFlow will show totals as soon as the schedule fills in.
          </Text>
        )}
      </SectionCard>

      <ActionButton
        label="Share weekly report"
        kind="primary"
        icon="share-outline"
        onPress={() =>
          navigation.navigate({ name: 'WeeklyReport', params: { weekStart } })
        }
      />
    </Screen>
  );
}
