import { Alert, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { BottomSheetScreen } from '@/components/BottomSheetScreen';
import { ActionButton, SectionCard } from '@/components/ui';
import { formatTime, getLongDateLabel } from '@/lib/date';
import {
  buildQuickMessage,
  getStatusLabel,
  openNavigation,
  sendQuickMessage,
} from '@/lib/routeFlow';
import { useRouteFlow } from '@/providers/RouteFlowProvider';
import { useToast } from '@/providers/ToastProvider';
import { RootStackParamList } from '@/types/navigation';
import { RideStatus } from '@/types/ride';

type Props = NativeStackScreenProps<RootStackParamList, 'RideDetail'>;

const statusActions: RideStatus[] = [
  'scheduled',
  'in_progress',
  'completed',
  'canceled',
  'canceled_paid',
];

export function RideDetailScreen({ navigation, route }: Props) {
  const {
    state,
    getOccurrenceView,
    updateOccurrenceStatus,
    cancelOccurrence,
    cancelOccurrenceWithPay,
    deleteSeriesFromOccurrence,
  } = useRouteFlow();

  const { showToast } = useToast();
  const view = getOccurrenceView(route.params.occurrenceId);

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

  if (!view) {
    return (
      <BottomSheetScreen onClose={() => navigation.goBack()}>
        <View>
          <SectionCard title="Ride not found">
            <Text className="text-sm leading-6 text-slate-300">
              This occurrence no longer exists.
            </Text>
          </SectionCard>
        </View>
      </BottomSheetScreen>
    );
  }

  const legTitle =
    view.group.tripType === 'round_trip'
      ? view.activeLeg.legType === 'return'
        ? 'Return leg'
        : 'Outbound leg'
      : 'Single trip';
  const pairedLabel =
    view.pairedLeg?.legType === 'return' ? 'Paired return' : 'Paired outbound';
  const isRecurringSeries = view.group.recurrenceType !== 'none';

  return (
    <BottomSheetScreen onClose={() => navigation.goBack()}>
      <View>
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-300">
              Ride detail
            </Text>
            <Text className="mt-2 text-4xl font-semibold text-white">{view.group.riderName}</Text>
            <Text className="mt-3 text-base leading-7 text-slate-300">
              {getLongDateLabel(view.occurrence.serviceDate)}. {legTitle}.
            </Text>
          </View>

          <SectionCard title="Route">
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name={view.activeLeg.legType === 'return' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                size={14}
                color="#67e8f9"
              />
              <Text className="text-sm font-semibold uppercase tracking-[1.5px] text-slate-400">
                {view.activeLeg.legType === 'return' ? 'Return' : 'Pick-up'}
              </Text>
            </View>
            <View className="mt-2 flex-row gap-2">
              <View className="h-5 justify-center">
                <Ionicons name="location-outline" size={15} color="#67e8f9" />
              </View>
              <Text className="flex-1 text-base text-white">
                {formatTime(view.activeLeg.pickupTime)} — {view.activeLeg.pickupAddress}
              </Text>
            </View>
            <View className="mt-1 flex-row gap-2">
              <View className="h-5 justify-center">
                <Ionicons name="flag-outline" size={15} color="#94a3b8" />
              </View>
              <Text className="flex-1 text-sm text-slate-400">{view.activeLeg.dropoffAddress}</Text>
            </View>

            {view.pairedLeg ? (
              <View className="mt-5">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="swap-horizontal-outline" size={14} color="#94a3b8" />
                  <Text className="text-sm font-semibold uppercase tracking-[1.5px] text-slate-400">
                    {pairedLabel}
                  </Text>
                </View>
                <View className="mt-2 flex-row gap-2">
                  <View className="h-5 justify-center">
                    <Ionicons name="time-outline" size={15} color="#67e8f9" />
                  </View>
                  <Text className="flex-1 text-base text-white">
                    {formatTime(view.pairedLeg.pickupTime)} — {view.pairedLeg.pickupAddress}
                  </Text>
                </View>
                <View className="mt-1 flex-row gap-2">
                  <View className="h-5 justify-center">
                    <Ionicons name="flag-outline" size={15} color="#94a3b8" />
                  </View>
                  <Text className="flex-1 text-sm text-slate-400">{view.pairedLeg.dropoffAddress}</Text>
                </View>
              </View>
            ) : null}
          </SectionCard>

          <SectionCard title="Actions">
            <View className="gap-3">
              <ActionButton
                label="Navigate"
                kind="primary"
                icon="navigate-outline"
                onPress={() => openNavigation(view, state.preferences)}
              />
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <ActionButton
                    icon="car-outline"
                    onPress={() =>
                      sendQuickMessage(view.group.phone, buildQuickMessage('on_my_way', view))
                    }
                  />
                </View>
                <View className="flex-1">
                  <ActionButton
                    icon="checkmark-circle-outline"
                    onPress={() =>
                      sendQuickMessage(view.group.phone, buildQuickMessage('picked_up', view))
                    }
                  />
                </View>
                <View className="flex-1">
                  <ActionButton
                    icon="time-outline"
                    onPress={() => sendQuickMessage(view.group.phone, buildQuickMessage('eta', view))}
                  />
                </View>
              </View>
            </View>
          </SectionCard>

          <SectionCard title="Status">
            <Text className="mb-4 text-sm leading-6 text-slate-300">
              Current status: {getStatusLabel(view.occurrence.status)}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {statusActions.map((status) => (
                <View key={status}>
                  <ActionButton
                    label={getStatusLabel(status)}
                    kind={view.occurrence.status === status ? 'primary' : 'secondary'}
                    onPress={() =>
                      runRideAction(
                        () => updateOccurrenceStatus(view.occurrence.id, status),
                        'Ride status updated',
                        'Status update failed',
                        `${view.group.riderName} is now ${getStatusLabel(status).toLowerCase()}.`
                      )
                    }
                  />
                </View>
              ))}
            </View>
          </SectionCard>

          <SectionCard title="Manage Ride">
            <View className="gap-3">
              <ActionButton
                label="Edit Ride"
                icon="create-outline"
                onPress={() => navigation.navigate('RideForm', { groupId: view.group.id })}
              />
              <ActionButton
                label="Cancel Ride"
                kind="danger"
                onPress={() =>
                  Alert.alert('Cancel Ride', 'This ride will be marked canceled.', [
                    { text: 'Keep it', style: 'cancel' },
                    {
                      text: 'Cancel Ride',
                      style: 'destructive',
                      onPress: () =>
                        void runRideAction(
                          () => cancelOccurrence(view.occurrence.id),
                          'Ride canceled',
                          'Cancel ride failed',
                          `${view.group.riderName} was marked canceled.`,
                          () => navigation.goBack()
                        ),
                    },
                  ])
                }
              />
              <ActionButton
                label="Cancel Ride with Pay"
                kind="danger"
                onPress={() =>
                  Alert.alert(
                    'Cancel Ride with Pay',
                    'This ride will be marked canceled, but the payment will still count.',
                    [
                      { text: 'Keep it', style: 'cancel' },
                      {
                        text: 'Cancel with pay',
                        style: 'destructive',
                        onPress: () =>
                          void runRideAction(
                            () => cancelOccurrenceWithPay(view.occurrence.id),
                            'Ride canceled with pay',
                            'Cancel with pay failed',
                            `${view.group.riderName} was canceled and payment was kept.`,
                            () => navigation.goBack()
                          ),
                      },
                    ]
                  )
                }
              />
              {isRecurringSeries ? (
                <ActionButton
                  label="Delete Entire Series"
                  kind="danger"
                  onPress={() =>
                    Alert.alert(
                      'Delete Entire Series',
                      'This ride and all future rides in this series will be removed from the schedule. Earlier ride history will stay intact.',
                      [
                        { text: 'Keep it', style: 'cancel' },
                        {
                          text: 'Delete Series',
                          style: 'destructive',
                          onPress: () =>
                            void runRideAction(
                              () => deleteSeriesFromOccurrence(view.occurrence.id),
                              'Series deleted',
                              'Delete series failed',
                              `${view.group.riderName}'s selected ride and future rides were removed.`,
                              () => navigation.goBack()
                            ),
                        },
                      ]
                    )
                  }
                />
              ) : null}
            </View>
          </SectionCard>
        </ScrollView>
      </View>
    </BottomSheetScreen>
  );
}
