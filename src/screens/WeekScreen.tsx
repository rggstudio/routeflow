import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RideCard } from '@/components/RideCard';
import { ActionButton, Screen, SectionCard } from '@/components/ui';
import {
  addDays,
  getDayLabel,
  getLongDateLabel,
  getStartOfWeek,
  getWeekRangeLabel,
  toIsoDate,
} from '@/lib/date';
import { useRouteFlow } from '@/providers/RouteFlowProvider';
import { RootStackParamList } from '@/types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export function WeekScreen({ navigation }: Props) {
  const today = toIsoDate(new Date());
  const initialWeekStart = getStartOfWeek(new Date());
  const [weekStart, setWeekStart] = useState(toIsoDate(initialWeekStart));
  const [selectedDate, setSelectedDate] = useState(today);
  const { getOccurrencesForWeek } = useRouteFlow();
  const rides = getOccurrencesForWeek(weekStart).filter((ride) => ride.occurrence.serviceDate === selectedDate);
  const days = Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(new Date(`${weekStart}T00:00:00`), index)));

  const shiftWeek = (direction: -1 | 1) => {
    const nextWeekStart = toIsoDate(addDays(new Date(`${weekStart}T00:00:00`), direction * 7));

    setWeekStart(nextWeekStart);
    setSelectedDate(nextWeekStart);
  };

  return (
    <Screen>
      <View className="mb-6">
        <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-300">
          Weekly schedule
        </Text>
        <Text className="mt-2 text-4xl font-semibold text-white">Plan one week at a time</Text>
        <Text className="mt-3 text-base leading-7 text-slate-300">
          Move forward week by week, review every day in that window, and cancel any occurrence before it sneaks up on you.
        </Text>
      </View>

      <SectionCard title="Week navigator">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <ActionButton
              label="Previous week"
              icon="chevron-back-outline"
              onPress={() => shiftWeek(-1)}
            />
          </View>
          <View className="flex-1">
            <ActionButton
              label="Next week"
              icon="chevron-forward-outline"
              onPress={() => shiftWeek(1)}
            />
          </View>
        </View>
        <Text className="mt-4 text-center text-sm font-semibold uppercase tracking-[1.8px] text-cyan-100">
          {getWeekRangeLabel(weekStart)}
        </Text>
      </SectionCard>

      <SectionCard title="Pick a day">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 4 }}
        >
          <View className="flex-row gap-2">
            {days.map((day) => (
              <Pressable
                key={day}
                className={`w-[72px] rounded-3xl border px-3 py-3 active:opacity-80 ${
                  day === selectedDate
                    ? 'border-cyan-300 bg-cyan-400/15'
                    : 'border-white/10 bg-white/5'
                }`}
                onPress={() => setSelectedDate(day)}
              >
                <Text
                  className={`text-center text-xs font-semibold uppercase tracking-[1.4px] ${
                    day === selectedDate ? 'text-cyan-100' : 'text-slate-400'
                  }`}
                >
                  {getDayLabel(day)}
                </Text>
                <Text
                  className={`mt-2 text-center text-lg font-semibold ${
                    day === selectedDate ? 'text-white' : 'text-slate-200'
                  }`}
                >
                  {day.slice(8)}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SectionCard>

      <View className="mb-3">
        <Text className="text-xl font-semibold text-white">{getLongDateLabel(selectedDate)}</Text>
        <Text className="mt-1 text-sm text-slate-400">{rides.length} rides scheduled</Text>
      </View>

      {rides.length > 0 ? (
        rides.map((ride) => (
          <RideCard
            key={ride.occurrence.id}
            ride={ride}
            statusStyle="weekly"
            onPress={() =>
              navigation.navigate({
                name: 'RideDetail',
                params: { occurrenceId: ride.occurrence.id },
              })
            }
          />
        ))
      ) : (
        <SectionCard title="No rides on this day">
          <Text className="text-sm leading-6 text-slate-300">
            This day is open. Add a ride or create a recurring trip that fills the week automatically.
          </Text>
        </SectionCard>
      )}
    </Screen>
  );
}
