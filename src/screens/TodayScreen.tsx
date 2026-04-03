import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { RideCard } from '@/components/RideCard';
import { ActionButton, Screen, SectionCard, StatTile } from '@/components/ui';
import {
  formatTime,
  getLongDateLabel,
  getRelativeCountdown,
  todayIso,
} from '@/lib/date';
import { buildQuickMessage, openNavigation, sendQuickMessage } from '@/lib/routeFlow';
import { useRouteFlow } from '@/providers/RouteFlowProvider';
import { RootStackParamList } from '@/types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

function getNextRideEyebrow(isoDate: string, time: string, now: Date) {
  const countdown = getRelativeCountdown(isoDate, time, now);

  if (countdown.startsWith('Starts in ')) {
    return `Next ride in ${countdown.replace('Starts in ', '')}`;
  }

  return `Next ride ${countdown.toLowerCase()}`;
}

export function TodayScreen({ navigation }: Props) {
  const { state, getOccurrencesForDate, getUpcomingOccurrences } = useRouteFlow();
  const [now, setNow] = useState(() => new Date());
  const today = todayIso();
  const todaysRides = getOccurrencesForDate(today);
  const upcomingRides = getUpcomingOccurrences();
  const nextRide = upcomingRides[0] ?? null;

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <Screen>
      <View className="mb-6">
        <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-300">
          Daily command center
        </Text>
        <Text className="mt-2 text-4xl font-semibold text-white">
          Hey {state.profile.name.split(' ')[0]}
        </Text>
        <Text className="mt-3 text-base leading-7 text-slate-300">
          {getLongDateLabel(today)}. You have {todaysRides.length} rides on the board today.
        </Text>
      </View>

      <View className="mb-4 flex-row gap-3">
        <StatTile label="Today" value={`${todaysRides.length} rides`} />
        <StatTile
          label="Completed"
          value={`${todaysRides.filter((ride) => ride.occurrence.status === 'completed').length}`}
          tone="positive"
        />
      </View>

      {nextRide ? (
        <SectionCard
          eyebrow={getNextRideEyebrow(
            nextRide.occurrence.serviceDate,
            nextRide.outboundLeg.pickupTime,
            now
          )}
          title={`${nextRide.group.riderName} - ${formatTime(nextRide.outboundLeg.pickupTime)}`}
        >
          <View className="gap-1.5">
            <View className="flex-row gap-2">
              <View className="h-6 justify-center">
                <Ionicons name="location-outline" size={15} color="#67e8f9" />
              </View>
              <Text className="flex-1 text-sm leading-6 text-slate-300">
                {nextRide.outboundLeg.pickupAddress}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <View className="h-6 justify-center">
                <Ionicons name="flag-outline" size={15} color="#94a3b8" />
              </View>
              <Text className="flex-1 text-sm leading-6 text-slate-400">
                {nextRide.outboundLeg.dropoffAddress}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={15} color="#67e8f9" />
            <Text className="text-base font-semibold text-cyan-200">
              {getLongDateLabel(nextRide.occurrence.serviceDate)}
            </Text>
          </View>

          {nextRide.occurrence.serviceDate === today && (
            <View className="mt-2 flex-row items-center gap-2">
              <Ionicons name="layers-outline" size={14} color="#64748b" />
              <Text className="text-sm text-slate-400">
                {`Ride ${Math.max(1, todaysRides.findIndex((ride) => ride.occurrence.id === nextRide.occurrence.id) + 1)} of ${Math.max(1, todaysRides.length)}`}
              </Text>
            </View>
          )}

          <View className="mt-5 gap-3">
            <ActionButton
              label="Navigate"
              kind="primary"
              icon="navigate-outline"
              onPress={() => openNavigation(nextRide, state.preferences)}
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <ActionButton
                  icon="car-outline"
                  onPress={() =>
                    sendQuickMessage(
                      nextRide.group.phone,
                      buildQuickMessage('on_my_way', nextRide)
                    )
                  }
                />
              </View>
              <View className="flex-1">
                <ActionButton
                  icon="time-outline"
                  onPress={() =>
                    sendQuickMessage(
                      nextRide.group.phone,
                      buildQuickMessage('five_min_away', nextRide)
                    )
                  }
                />
              </View>
              <View className="flex-1">
                <ActionButton
                  icon="checkmark-circle-outline"
                  onPress={() =>
                    sendQuickMessage(
                      nextRide.group.phone,
                      buildQuickMessage('picked_up', nextRide)
                    )
                  }
                />
              </View>
            </View>
          </View>
        </SectionCard>
      ) : (
        <SectionCard eyebrow="All clear" title="No next ride">
          <Text className="text-sm leading-6 text-slate-300">
            Nothing upcoming right now. Add a ride or check the week view to plan ahead.
          </Text>
        </SectionCard>
      )}

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-white">Later today</Text>
        <Pressable onPress={() => navigation.navigate({ name: 'RideForm', params: undefined })}>
          <Text className="font-semibold text-cyan-200">Add ride</Text>
        </Pressable>
      </View>

      {todaysRides.length > 0 ? (
        todaysRides.map((ride) => (
          <RideCard
            key={ride.occurrence.id}
            ride={ride}
            compact
            onPress={() =>
              navigation.navigate({
                name: 'RideDetail',
                params: { occurrenceId: ride.occurrence.id },
              })
            }
          />
        ))
      ) : (
        <SectionCard title="No rides scheduled">
          <Text className="text-sm leading-6 text-slate-300">
            Start with one-time rides or build a recurring weekday route in a few taps.
          </Text>
        </SectionCard>
      )}
    </Screen>
  );
}
