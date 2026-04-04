import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { formatTime, getLongDateLabel } from '@/lib/date';
import { getStatusLabel } from '@/lib/routeFlow';
import { RideOccurrenceView } from '@/types/ride';

type RideCardProps = {
  ride: RideOccurrenceView;
  onPress?: () => void;
  compact?: boolean;
  statusStyle?: 'default' | 'weekly';
};

export function RideCard({
  ride,
  onPress,
  compact = false,
  statusStyle = 'default',
}: RideCardProps) {
  const isWeeklyStyle = statusStyle === 'weekly';
  const isCanceled = ride.occurrence.status === 'canceled' || ride.occurrence.status === 'canceled_paid';
  const isCompleted = ride.occurrence.status === 'completed';
  const isScheduled = ride.occurrence.status === 'scheduled';
  const legLabel =
    ride.group.tripType === 'round_trip'
      ? ride.activeLeg.legType === 'return'
        ? 'Return leg'
        : 'Outbound leg'
      : 'Single trip';
  const pairedLabel = ride.pairedLeg
    ? ride.pairedLeg.legType === 'return'
      ? 'Paired return'
      : 'Paired outbound'
    : null;

  const cardClasses = isWeeklyStyle
    ? isCanceled
      ? 'border-rose-400/50 bg-rose-950/25'
      : isCompleted
        ? 'border-emerald-400/45 bg-emerald-950/20'
        : 'border-white/10 bg-slate-900/80'
    : 'border-white/10 bg-slate-900/80';

  const pillClasses = isWeeklyStyle
    ? isCanceled
      ? 'bg-rose-500/20'
      : isCompleted
        ? 'bg-emerald-500/20'
        : isScheduled
          ? 'bg-sky-500/20'
          : 'bg-white/5'
    : isCompleted
      ? 'bg-emerald-500/20'
      : 'bg-white/5';

  const pillTextClasses = isWeeklyStyle
    ? isCanceled
      ? 'text-rose-100'
      : isCompleted
        ? 'text-emerald-100'
        : isScheduled
          ? 'text-sky-100'
          : 'text-slate-300'
    : isCompleted
      ? 'text-emerald-100'
      : 'text-slate-300';

  const payAmount = isWeeklyStyle && ride.occurrence.status === 'canceled' ? 0 : ride.effectivePay;

  const content = (
    <View className={`rounded-[28px] border px-5 py-4 ${cardClasses}`}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="person-outline" size={14} color="#94a3b8" />
            <Text className="text-lg font-semibold text-white">{ride.group.riderName}</Text>
          </View>
          <View className="mt-1 flex-row items-center gap-1.5">
            <Ionicons name="time-outline" size={13} color="#64748b" />
            <Text className="text-sm text-slate-400">
              {getLongDateLabel(ride.occurrence.serviceDate)} at {formatTime(ride.activeLeg.pickupTime)}
            </Text>
          </View>
        </View>
        <View className={`rounded-full px-3 py-1 ${pillClasses}`}>
          <Text className={`text-xs font-semibold uppercase tracking-[1.4px] ${pillTextClasses}`}>
            {getStatusLabel(ride.occurrence.status)}
          </Text>
        </View>
      </View>

      <View className="mt-4 gap-1">
        <View className="flex-row gap-1.5">
          <View className="h-6 justify-center">
            <Ionicons name="location-outline" size={14} color="#67e8f9" />
          </View>
          <Text className="flex-1 text-sm leading-6 text-slate-300">
            {ride.activeLeg.pickupAddress}
          </Text>
        </View>
        <View className="flex-row gap-1.5">
          <View className="h-6 justify-center">
            <Ionicons name="flag-outline" size={14} color="#94a3b8" />
          </View>
          <Text className="flex-1 text-sm leading-6 text-slate-400">
            {ride.activeLeg.dropoffAddress}
          </Text>
        </View>
      </View>

      {ride.pairedLeg && pairedLabel ? (
        <View className="mt-2 flex-row gap-1.5">
          <View className="h-6 justify-center">
            <Ionicons name="swap-horizontal-outline" size={14} color="#64748b" />
          </View>
          <Text className="flex-1 text-sm leading-6 text-slate-400">
            {pairedLabel} at {formatTime(ride.pairedLeg.pickupTime)} → {ride.pairedLeg.dropoffAddress}
          </Text>
        </View>
      ) : null}

      <View className="mt-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Ionicons
            name={ride.group.tripType === 'round_trip' ? 'repeat-outline' : 'arrow-forward-outline'}
            size={13}
            color="#64748b"
          />
          <Text className="text-sm text-slate-400">{legLabel}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="cash-outline" size={14} color="#a5f3fc" />
          <Text className="text-base font-semibold text-cyan-200">${payAmount.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  if (!onPress) {
    return <View className={compact ? 'mb-3' : 'mb-4'}>{content}</View>;
  }

  return (
    <Pressable className={compact ? 'mb-3' : 'mb-4'} onPress={onPress}>
      {content}
    </Pressable>
  );
}
