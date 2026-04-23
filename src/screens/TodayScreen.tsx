import { ReactNode, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { CancelRideWithPayModal } from '@/components/CancelRideWithPayModal';
import { RideCard } from '@/components/RideCard';
import { ActionButton, Screen, SectionCard, StatTile } from '@/components/ui';
import {
  combineDateAndTime,
  formatTime,
  getLongDateLabel,
  getRelativeCountdown,
  todayIso,
} from '@/lib/date';
import { buildQuickMessage, openNavigation, sendQuickMessage } from '@/lib/routeFlow';
import { useRouteFlow } from '@/providers/RouteFlowProvider';
import { useToast } from '@/providers/ToastProvider';
import { RootStackParamList } from '@/types/navigation';
import { RideOccurrenceView } from '@/types/ride';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

function getNextRideEyebrow(isoDate: string, time: string, now: Date) {
  const countdown = getRelativeCountdown(isoDate, time, now);

  if (countdown.startsWith('Starts in ')) {
    return 'Next ride in ' + countdown.replace('Starts in ', '');
  }

  return 'Next ride ' + countdown.toLowerCase();
}

function isRideStatusUpdateOverdue(ride: RideOccurrenceView, now: Date) {
  return combineDateAndTime(ride.occurrence.serviceDate, ride.activeLeg.pickupTime).getTime() < now.getTime();
}

type HomeRideSpotlightProps = {
  ride: RideOccurrenceView;
  eyebrow: string;
  title: string;
  today: string;
  todaysRides: RideOccurrenceView[];
  onNavigate: () => void;
  secondaryAction: {
    label: string;
    kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
    icon?: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  footerActions?: ReactNode;
  statusTone?: 'default' | 'in_progress' | 'attention';
};

function HomeRideSpotlight({
  ride,
  eyebrow,
  title,
  today,
  todaysRides,
  onNavigate,
  secondaryAction,
  footerActions,
  statusTone = 'default',
}: HomeRideSpotlightProps) {
  const isInProgress = statusTone === 'in_progress';
  const isAttention = statusTone === 'attention';
  const wrapperClassName = isInProgress
    ? 'mb-4 overflow-hidden rounded-[28px] border border-emerald-400/45 bg-emerald-950/70'
    : isAttention
      ? 'mb-4 overflow-hidden rounded-[28px] border border-amber-300/55 bg-amber-950/35'
      : '';
  const wrapperStyle = isAttention
    ? {
        shadowColor: '#facc15',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.32,
        shadowRadius: 24,
        elevation: 10,
      }
    : undefined;
  const cardClassName = isInProgress || isAttention ? 'mb-0 border-transparent bg-transparent' : undefined;
  const pickupIconColor = isAttention ? '#fcd34d' : '#bbf7d0';
  const dropoffIconColor = isAttention ? '#fde68a' : '#dcfce7';
  const dropoffTextClassName = isAttention
    ? 'flex-1 text-sm leading-6 text-amber-100/90'
    : 'flex-1 text-sm leading-6 text-emerald-100/90';
  const dateIconColor = isInProgress ? '#bbf7d0' : isAttention ? '#fcd34d' : '#67e8f9';
  const dateTextClassName = isInProgress
    ? 'text-base font-semibold text-emerald-100'
    : isAttention
      ? 'text-base font-semibold text-amber-100'
      : 'text-base font-semibold text-cyan-200';
  const rideIndexTextClassName = isInProgress
    ? 'text-sm text-emerald-100/85'
    : isAttention
      ? 'text-sm text-amber-100/85'
      : 'text-sm text-slate-400';
  const rideIndexIconColor = isInProgress ? '#bbf7d0' : isAttention ? '#fcd34d' : '#64748b';

  const cardContent = (
    <SectionCard eyebrow={eyebrow} title={title} className={cardClassName}>
      <View className="gap-1.5">
        <View className="flex-row gap-2">
          <View className="h-6 justify-center">
            <Ionicons name="location-outline" size={15} color={pickupIconColor} />
          </View>
          <Text className="flex-1 text-sm leading-6 text-slate-100">{ride.activeLeg.pickupAddress}</Text>
        </View>
        <View className="flex-row gap-2">
          <View className="h-6 justify-center">
            <Ionicons name="flag-outline" size={15} color={dropoffIconColor} />
          </View>
          <Text className={dropoffTextClassName}>{ride.activeLeg.dropoffAddress}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-2">
        <Ionicons name="calendar-outline" size={15} color={dateIconColor} />
        <Text className={dateTextClassName}>{getLongDateLabel(ride.occurrence.serviceDate)}</Text>
      </View>

      {ride.occurrence.serviceDate === today ? (
        <View className="mt-2 flex-row items-center gap-2">
          <Ionicons name="layers-outline" size={14} color={rideIndexIconColor} />
          <Text className={rideIndexTextClassName}>
            {'Ride ' + Math.max(1, todaysRides.findIndex((item) => item.occurrence.id === ride.occurrence.id) + 1) + ' of ' + Math.max(1, todaysRides.length)}
          </Text>
        </View>
      ) : null}

      <View className="mt-5 gap-3">
        <ActionButton label="Navigate" kind="primary" icon="navigate-outline" onPress={onNavigate} />
        <ActionButton
          label={secondaryAction.label}
          kind={secondaryAction.kind}
          icon={secondaryAction.icon}
          onPress={secondaryAction.onPress}
        />
        {footerActions ?? (
          <View className="flex-row gap-2">
            <View className="flex-1">
              <ActionButton
                icon="car-outline"
                onPress={() => sendQuickMessage(ride.group.phone, buildQuickMessage('on_my_way', ride))}
              />
            </View>
            <View className="flex-1">
              <ActionButton
                icon="time-outline"
                onPress={() =>
                  sendQuickMessage(ride.group.phone, buildQuickMessage('five_min_away', ride))
                }
              />
            </View>
            <View className="flex-1">
              <ActionButton
                icon="checkmark-circle-outline"
                onPress={() => sendQuickMessage(ride.group.phone, buildQuickMessage('picked_up', ride))}
              />
            </View>
          </View>
        )}
      </View>
    </SectionCard>
  );

  if (isInProgress || isAttention) {
    return (
      <View className={wrapperClassName} style={wrapperStyle}>
        {cardContent}
      </View>
    );
  }

  return cardContent;
}

export function TodayScreen({ navigation }: Props) {
  const {
    state,
    getOccurrencesForDate,
    getCanceledOccurrencesForDate,
    getUpcomingOccurrences,
    updateOccurrenceStatus,
    cancelOccurrence,
    cancelOccurrenceWithPay,
  } = useRouteFlow();
  const { showToast } = useToast();
  const [now, setNow] = useState(() => new Date());
  const [paidCancelRide, setPaidCancelRide] = useState<RideOccurrenceView | null>(null);
  const today = todayIso();
  const todaysRides = getOccurrencesForDate(today);
  const canceledTodayRides = getCanceledOccurrencesForDate(today);
  const upcomingRides = getUpcomingOccurrences();
  const inProgressRide = todaysRides.find((ride) => ride.occurrence.status === 'in_progress') ?? null;
  const overdueScheduledRide =
    todaysRides.find(
      (ride) =>
        ride.occurrence.status === 'scheduled' &&
        ride.occurrence.id !== inProgressRide?.occurrence.id &&
        isRideStatusUpdateOverdue(ride, now)
    ) ?? null;
  const nextRide =
    overdueScheduledRide ??
    upcomingRides.find(
      (ride) =>
        ride.occurrence.status === 'scheduled' &&
        ride.occurrence.id !== inProgressRide?.occurrence.id
    ) ??
    null;
  const isNextRideOverdue = nextRide ? isRideStatusUpdateOverdue(nextRide, now) : false;
  const todaysRideLabel = todaysRides.length === 1 ? 'ride' : 'rides';
  const laterTodayRides = todaysRides.filter(
    (ride) => ride.occurrence.status !== 'completed' && ride.occurrence.status !== 'in_progress'
  );
  const completedTodayRides = todaysRides.filter((ride) => ride.occurrence.status === 'completed');

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const runRideAction = async (
    action: () => Promise<void>,
    successTitle: string,
    errorTitle: string,
    successMessage?: string,
    onSuccess?: () => void
  ) => {
    try {
      await action();
      showToast({ title: successTitle, message: successMessage });
      onSuccess?.();
    } catch (error) {
      Alert.alert(errorTitle, error instanceof Error ? error.message : 'Try again.');
    }
  };

  const confirmCancelRide = (ride: RideOccurrenceView) => {
    Alert.alert('Cancel ride', 'This ride will be marked canceled.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel ride',
        style: 'destructive',
        onPress: () =>
          void runRideAction(
            () => cancelOccurrence(ride.occurrence.id),
            'Ride canceled',
            'Cancel ride failed',
            ride.group.riderName + ' was marked canceled.'
          ),
      },
    ]);
  };

  const confirmCancelRideWithPay = (ride: RideOccurrenceView) => {
    setPaidCancelRide(ride);
  };

  const submitCancelRideWithPay = (payAmount: number) => {
    if (!paidCancelRide) {
      return;
    }

    void runRideAction(
      () => cancelOccurrenceWithPay(paidCancelRide.occurrence.id, payAmount),
      'Ride canceled with pay',
      'Cancel with pay failed',
      `${paidCancelRide.group.riderName} was canceled and $${payAmount.toFixed(2)} was kept.`,
      () => setPaidCancelRide(null)
    );
  };

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
          {getLongDateLabel(today)}. You have {todaysRides.length} {todaysRideLabel} on the board today.
        </Text>
      </View>

      <View className="mb-4 flex-row gap-3">
        <StatTile label="Today" value={String(todaysRides.length) + ' ' + todaysRideLabel} />
        <StatTile label="Completed" value={String(completedTodayRides.length)} tone="positive" />
        {canceledTodayRides.length > 0 ? (
          <StatTile label="Canceled" value={String(canceledTodayRides.length)} tone="negative" />
        ) : null}
      </View>

      {inProgressRide ? (
        <HomeRideSpotlight
          ride={inProgressRide}
          statusTone="in_progress"
          eyebrow="In progress"
          title={inProgressRide.group.riderName + ' - ' + formatTime(inProgressRide.activeLeg.pickupTime)}
          today={today}
          todaysRides={todaysRides}
          onNavigate={() => openNavigation(inProgressRide, state.preferences)}
          secondaryAction={{
            label: 'Completed',
            kind: 'secondary',
            icon: 'checkmark-done-outline',
            onPress: () =>
              void runRideAction(
                () => updateOccurrenceStatus(inProgressRide.occurrence.id, 'completed'),
                'Ride completed',
                'Complete ride failed',
                inProgressRide.group.riderName + ' was marked completed.'
              ),
          }}
        />
      ) : null}

      {nextRide ? (
        <HomeRideSpotlight
          ride={nextRide}
          statusTone={isNextRideOverdue ? 'attention' : 'default'}
          eyebrow={
            isNextRideOverdue
              ? 'Update the ride status'
              : getNextRideEyebrow(nextRide.occurrence.serviceDate, nextRide.activeLeg.pickupTime, now)
          }
          title={nextRide.group.riderName + ' - ' + formatTime(nextRide.activeLeg.pickupTime)}
          today={today}
          todaysRides={todaysRides}
          onNavigate={() => openNavigation(nextRide, state.preferences)}
          secondaryAction={{
            label: 'Picked Up',
            kind: 'secondary',
            icon: 'checkmark-circle-outline',
            onPress: () =>
              void runRideAction(
                () => updateOccurrenceStatus(nextRide.occurrence.id, 'in_progress'),
                'Ride started',
                'Start ride failed',
                nextRide.group.riderName + ' is now in progress.'
              ),
          }}
          footerActions={
            isNextRideOverdue ? (
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <ActionButton label="CANCEL RIDE" kind="danger" onPress={() => confirmCancelRide(nextRide)} />
                </View>
                <View className="flex-1">
                  <ActionButton
                    label="CANCEL W/ PAY"
                    kind="danger"
                    onPress={() => confirmCancelRideWithPay(nextRide)}
                  />
                </View>
              </View>
            ) : undefined
          }
        />
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

      {laterTodayRides.length > 0 ? (
        laterTodayRides.map((ride) => (
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
            Start with one-time rides or build a recurring route in a few taps.
            </Text>
          </SectionCard>
      )}

      <View className="mb-3 mt-2 flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-white">Completed today</Text>
      </View>

      {completedTodayRides.length > 0 ? (
        completedTodayRides.map((ride) => (
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
        <SectionCard title="No completed rides yet">
          <Text className="text-sm leading-6 text-slate-300">
            Completed rides will show up here once you finish them.
          </Text>
        </SectionCard>
      )}

      {canceledTodayRides.length > 0 ? (
        <>
          <View className="mb-3 mt-2 flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-white">Canceled today</Text>
          </View>
          {canceledTodayRides.map((ride) => (
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
          ))}
        </>
      ) : null}

      <CancelRideWithPayModal
        visible={!!paidCancelRide}
        riderName={paidCancelRide?.group.riderName ?? ''}
        defaultAmount={paidCancelRide?.effectivePay ?? 0}
        onClose={() => setPaidCancelRide(null)}
        onSubmit={submitCancelRideWithPay}
      />
    </Screen>
  );
}
