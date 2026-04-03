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
    cancelSeries,
  } = useRouteFlow();

  const { showToast } = useToast();
  const view = getOccurrenceView(route.params.occurrenceId);

  const runRideAction = async (
    action: () => Promise<void>,
    successTitle: string,
    errorTitle: string,
    successMessage?: string
  ) => {
    try {
      await action();
      showToast({ title: successTitle, message: successMessage });
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
              {getLongDateLabel(view.occurrence.serviceDate)}.{' '}
              {view.group.tripType === 'round_trip' ? 'Round trip' : 'Single trip'}.
            </Text>
          </View>

          <SectionCard title="Route">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="arrow-up-circle-outline" size={14} color="#67e8f9" />
              <Text className="text-sm font-semibold uppercase tracking-[1.5px] text-slate-400">
                Pick-up
              </Text>
            </View>
            <View className="mt-2 flex-row gap-2">
              <View className="h-5 justify-center">
                <Ionicons name="location-outline" size={15} color="#67e8f9" />
              </View>
              <Text className="flex-1 text-base text-white">
                {formatTime(view.outboundLeg.pickupTime)} — {view.outboundLeg.pickupAddress}
              </Text>
            </View>
            <View className="mt-1 flex-row gap-2">
              <View className="h-5 justify-center">
                <Ionicons name="flag-outline" size={15} color="#94a3b8" />
              </View>
              <Text className="flex-1 text-sm text-slate-400">{view.outboundLeg.dropoffAddress}</Text>
            </View>

            {view.returnLeg ? (
              <View className="mt-5">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="arrow-down-circle-outline" size={14} color="#94a3b8" />
                  <Text className="text-sm font-semibold uppercase tracking-[1.5px] text-slate-400">
                    Return
                  </Text>
                </View>
                <View className="mt-2 flex-row gap-2">
                  <View className="h-5 justify-center">
                    <Ionicons name="location-outline" size={15} color="#67e8f9" />
                  </View>
                  <Text className="flex-1 text-base text-white">
                    {formatTime(view.returnLeg.pickupTime)} — {view.returnLeg.pickupAddress}
                  </Text>
                </View>
                <View className="mt-1 flex-row gap-2">
                  <View className="h-5 justify-center">
                    <Ionicons name="flag-outline" size={15} color="#94a3b8" />
                  </View>
                  <Text className="flex-1 text-sm text-slate-400">{view.returnLeg.dropoffAddress}</Text>
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

          <SectionCard title="Manage ride">
            <View className="gap-3">
              <ActionButton
                label="Edit ride"
                icon="create-outline"
                onPress={() => navigation.navigate('RideForm', { groupId: view.group.id })}
              />
              <ActionButton
                label="Cancel this occurrence"
                kind="danger"
                onPress={() =>
                  Alert.alert('Cancel occurrence', 'This ride will be marked canceled.', [
                    { text: 'Keep it', style: 'cancel' },
                    {
                      text: 'Cancel ride',
                      style: 'destructive',
                      onPress: () =>
                        void runRideAction(
                          () => cancelOccurrence(view.occurrence.id),
                          'Ride canceled',
                          'Cancel ride failed',
                          `${view.group.riderName} was marked canceled.`
                        ),
                    },
                  ])
                }
              />
              <ActionButton
                label="Cancel ride with pay"
                kind="danger"
                onPress={() =>
                  Alert.alert(
                    'Cancel ride with pay',
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
                            `${view.group.riderName} was canceled and payment was kept.`
                          ),
                      },
                    ]
                  )
                }
              />
              <ActionButton
                label="Cancel entire series"
                kind="danger"
                onPress={() =>
                  Alert.alert('Cancel series', 'Every occurrence in this series will be canceled.', [
                    { text: 'Keep it', style: 'cancel' },
                    {
                      text: 'Cancel series',
                      style: 'destructive',
                      onPress: () =>
                        void runRideAction(
                          () => cancelSeries(view.group.id),
                          'Series canceled',
                          'Cancel series failed',
                          `All scheduled rides for ${view.group.riderName} were canceled.`
                        ),
                    },
                  ])
                }
              />
            </View>
          </SectionCard>
        </ScrollView>
      </View>
    </BottomSheetScreen>
  );
}
