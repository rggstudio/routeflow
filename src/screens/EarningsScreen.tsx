import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { summarizeWeeklyRides } from '@/lib/weeklyRideSummary';
import { ActionButton, Screen, SectionCard, StatTile } from '@/components/ui';
import { addDays, formatTime, getFullDateLabel, getStartOfWeek, getWeekRangeLabel, toIsoDate } from '@/lib/date';
import { getStatusLabel } from '@/lib/routeFlow';
import { useRouteFlow } from '@/providers/RouteFlowProvider';
import { RootStackParamList } from '@/types/navigation';
import { RideStatus } from '@/types/ride';

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

function getRideDisplayAmount(status: RideStatus, amount: number) {
  return status === 'canceled' ? 0 : amount;
}

function getRideBreakdownClasses(status: RideStatus) {
  if (status === 'canceled') {
    return {
      container: 'border-rose-400/50 bg-rose-950/20',
      amount: 'text-rose-100',
      statusPill: 'bg-rose-500/20',
      statusText: 'text-rose-100',
    };
  }

  if (status === 'canceled_paid') {
    return {
      container: 'border-amber-400/50 bg-amber-950/20',
      amount: 'text-amber-100',
      statusPill: 'bg-amber-500/20',
      statusText: 'text-amber-100',
    };
  }

  if (status === 'completed') {
    return {
      container: 'border-emerald-400/40 bg-emerald-950/15',
      amount: 'text-emerald-100',
      statusPill: 'bg-emerald-500/20',
      statusText: 'text-emerald-100',
    };
  }

  return {
    container: 'border-white/10 bg-white/5',
    amount: 'text-cyan-200',
    statusPill: 'bg-sky-500/20',
    statusText: 'text-sky-100',
  };
}

export function EarningsScreen({ navigation }: Props) {
  const thisWeek = getStartOfWeek(new Date());
  const [weekStart, setWeekStart] = useState(toIsoDate(thisWeek));
  const { getWeekMetrics } = useRouteFlow();
  const metrics = getWeekMetrics(weekStart);
  const weeklySummaries = useMemo(() => summarizeWeeklyRides(metrics.rides), [metrics.rides]);
  const completedRideCount = weeklySummaries.filter((ride) => ride.status === 'completed').length;
  const canceledRideCount = weeklySummaries.filter(
    (ride) => ride.status === 'canceled' || ride.status === 'canceled_paid'
  ).length;

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
          value={`${weeklySummaries.length}`}
          style={{ flex: 0.9 }}
          labelClassName="text-[9px] tracking-[1.2px]"
          valueClassName="text-[19px]"
        />
        <StatTile
          label="Completed"
          value={`${completedRideCount}`}
          tone="positive"
          style={{ flex: 1.15 }}
          labelClassName="text-[9px] tracking-[1.2px]"
          valueClassName="text-[19px]"
        />
        <StatTile
          label="Canceled"
          value={`${canceledRideCount}`}
          tone="warning"
          labelClassName="text-[9px] tracking-[1.2px]"
          valueClassName="text-[19px]"
        />
      </View>

      <SectionCard title="Ride breakdown">
        {weeklySummaries.length > 0 ? (
          weeklySummaries.map((ride) => {
            const styles = getRideBreakdownClasses(ride.status);
            const displayAmount = getRideDisplayAmount(ride.status, ride.totalAmount);
            const timeLabel = ride.legTimes.map((time) => formatTime(time)).join(' / ');

            return (
              <View
                key={ride.key}
                className={`mb-3 rounded-3xl border px-4 py-4 ${styles.container}`}
              >
                <View className="flex-row items-start justify-between gap-4">
                  <View className="flex-1 pr-4">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="person-circle-outline" size={15} color="#94a3b8" />
                      <Text className="font-semibold text-white">{ride.riderName}</Text>
                    </View>
                    <View className="mt-1 flex-row items-center gap-1.5">
                      <Ionicons name="time-outline" size={13} color="#64748b" />
                      <Text className="text-sm text-slate-400">
                        {getFullDateLabel(ride.serviceDate)} at {timeLabel}
                      </Text>
                    </View>
                  </View>
                  <View className={`rounded-full px-3 py-1 ${styles.statusPill}`}>
                    <Text className={`text-xs font-semibold uppercase tracking-[1.4px] ${styles.statusText}`}>
                      {getStatusLabel(ride.status)}
                    </Text>
                  </View>
                </View>
                <View className="mt-4 flex-row items-center justify-between">
                  <Text className="text-sm text-slate-400">
                    {ride.rideCount > 1 ? `${ride.rideCount} legs` : '1 leg'}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="cash-outline" size={14} color="#a5f3fc" />
                    <Text className={`text-base font-semibold ${styles.amount}`}>
                      ${displayAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
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
