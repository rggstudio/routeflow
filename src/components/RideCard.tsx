import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { formatTime, getLongDateLabel } from '@/lib/date';
import { getStatusLabel } from '@/lib/routeFlow';
import { RideOccurrenceView } from '@/types/ride';

type RideCardProps = {
  ride: RideOccurrenceView;
  onPress?: () => void;
  compact?: boolean;
};

export function RideCard({ ride, onPress, compact = false }: RideCardProps) {
  const content = (
    <View className="rounded-[28px] border border-white/10 bg-slate-900/80 px-5 py-4">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="person-outline" size={14} color="#94a3b8" />
            <Text className="text-lg font-semibold text-white">{ride.group.riderName}</Text>
          </View>
          <View className="mt-1 flex-row items-center gap-1.5">
            <Ionicons name="time-outline" size={13} color="#64748b" />
            <Text className="text-sm text-slate-400">
              {getLongDateLabel(ride.occurrence.serviceDate)} at {formatTime(ride.outboundLeg.pickupTime)}
            </Text>
          </View>
        </View>
        <View className="rounded-full bg-white/5 px-3 py-1">
          <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-slate-300">
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
            {ride.outboundLeg.pickupAddress}
          </Text>
        </View>
        <View className="flex-row gap-1.5">
          <View className="h-6 justify-center">
            <Ionicons name="flag-outline" size={14} color="#94a3b8" />
          </View>
          <Text className="flex-1 text-sm leading-6 text-slate-400">
            {ride.outboundLeg.dropoffAddress}
          </Text>
        </View>
      </View>

      {ride.returnLeg ? (
        <View className="mt-2 flex-row gap-1.5">
          <View className="h-6 justify-center">
            <Ionicons name="repeat-outline" size={14} color="#64748b" />
          </View>
          <Text className="flex-1 text-sm leading-6 text-slate-400">
            Return at {formatTime(ride.returnLeg.pickupTime)} → {ride.returnLeg.dropoffAddress}
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
          <Text className="text-sm text-slate-400">
            {ride.group.tripType === 'round_trip' ? 'Round trip' : 'Single trip'}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="cash-outline" size={14} color="#a5f3fc" />
          <Text className="text-base font-semibold text-cyan-200">${ride.effectivePay.toFixed(2)}</Text>
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
