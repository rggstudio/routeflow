import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ActionButton, Screen } from '@/components/ui';
import { buildQuickMessage, callPhoneNumber, openNavigationApp, sendQuickMessage } from '@/lib/routeFlow';
import { useRouteFlow } from '@/providers/RouteFlowProvider';
import { useToast } from '@/providers/ToastProvider';
import { RootStackParamList } from '@/types/navigation';
import { NavigationApp } from '@/types/ride';

type Props = NativeStackScreenProps<RootStackParamList, 'TripNavigation'>;

type IssueType = 'no_show' | 'not_released' | 'dropoff_no_adult' | 'issue';

const issueOptions: { type: IssueType; label: string }[] = [
  { type: 'no_show', label: 'No-show' },
  { type: 'not_released', label: 'Not released' },
  { type: 'dropoff_no_adult', label: 'Drop-off no adult' },
  { type: 'issue', label: 'Other issue' },
];

const navOptions: { app: NavigationApp; label: string }[] = [
  { app: 'waze', label: 'Waze' },
  { app: 'apple_maps', label: 'Apple Maps' },
  { app: 'google_maps', label: 'Google Maps' },
];

function formatRouteInstruction(destination: string) {
  if (!destination.trim()) {
    return 'No destination address found';
  }

  return destination;
}

export function TripNavigationScreen({ navigation, route }: Props) {
  const { getOccurrenceView, updateOccurrenceStatus, recordOccurrenceNote } = useRouteFlow();
  const { showToast } = useToast();
  const [isBusy, setIsBusy] = useState(false);
  const [isIssueSheetVisible, setIsIssueSheetVisible] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<IssueType>('issue');
  const [issueNote, setIssueNote] = useState('');
  const view = getOccurrenceView(route.params.tripId);
  const activeLeg = useMemo(() => {
    if (!view) {
      return null;
    }

    return view.legs.find((leg) => leg.id === route.params.stopId) ?? view.activeLeg;
  }, [route.params.stopId, view]);

  const runAction = async (
    action: () => Promise<void>,
    successTitle: string,
    errorTitle: string,
    successMessage?: string,
    onSuccess?: () => void
  ) => {
    try {
      setIsBusy(true);
      await action();
      showToast({ title: successTitle, message: successMessage });
      onSuccess?.();
    } catch (error) {
      Alert.alert(errorTitle, error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsBusy(false);
    }
  };

  if (!view || !activeLeg) {
    return (
      <Screen scroll={false} avatarPlacement="none">
        <View className="flex-1 justify-center">
          <View className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5">
            <Text className="text-2xl font-semibold text-white">This trip could not be found.</Text>
            <Text className="mt-3 text-base leading-7 text-slate-300">
              Return to Today and refresh your active rides.
            </Text>
            <View className="mt-5">
              <ActionButton label="Back to Today" kind="primary" onPress={() => navigation.navigate('Dashboard')} />
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  const destinationAddress = activeLeg.dropoffAddress;
  const hasDestination = destinationAddress.trim().length > 0;
  const hasPhone = view.group.phone.trim().length > 0;

  const recordArrived = () =>
    runAction(
      () =>
        recordOccurrenceNote(
          view.occurrence.id,
          `Arrived at dropoff for ${view.group.riderName}.`,
          {
            event_type: 'arrived_dropoff',
            trip_leg_id: activeLeg.id,
            destination_address: destinationAddress,
          }
        ),
      'Arrived recorded',
      'Arrival failed',
      `${view.group.riderName}'s arrival was added to the ride audit trail.`
    );

  const completeRide = () =>
    runAction(
      () => updateOccurrenceStatus(view.occurrence.id, 'completed'),
      'Ride completed',
      'Dropoff failed',
      `${view.group.riderName} was marked dropped off.`,
      () => navigation.navigate('Dashboard')
    );

  const submitIssue = () => {
    const selectedIssue = issueOptions.find((option) => option.type === selectedIssueType);
    const label = selectedIssue?.label ?? 'Issue';
    const note = issueNote.trim()
      ? `${label}: ${issueNote.trim()}`
      : label;

    void runAction(
      () =>
        recordOccurrenceNote(view.occurrence.id, note, {
          event_type: selectedIssueType,
          trip_leg_id: activeLeg.id,
          destination_address: destinationAddress,
        }),
      'Issue recorded',
      'Issue failed',
      'The issue was added to the ride audit trail.',
      () => {
        setIssueNote('');
        setSelectedIssueType('issue');
        setIsIssueSheetVisible(false);
      }
    );
  };

  const openExternalNavigationPicker = () => {
    Alert.alert(
      'Open external navigation',
      'Use this only when you need turn-by-turn directions outside RouteFlow.',
      [
        { text: 'Cancel', style: 'cancel' },
        ...navOptions.map((option) => ({
          text: option.label,
          onPress: () => {
            void openNavigationApp(view, option.app);
          },
        })),
      ]
    );
  };

  return (
    <Screen scroll={false} avatarPlacement="none" showBottomFade={false}>
      <View className="flex-1">
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable
            className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:opacity-80"
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Ionicons name="chevron-back" size={22} color="#e2e8f0" />
          </Pressable>
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-cyan-300">
            Trip command
          </Text>
          <View className="h-11 w-11" />
        </View>

        <View className="flex-row items-center gap-3 rounded-2xl border border-cyan-300/20 bg-slate-900/85 px-4 py-2">
          <Text className="text-[10px] font-semibold uppercase tracking-[1.4px] text-cyan-200">
            Next stop
          </Text>
          <Text className="flex-1 text-xs font-medium text-slate-200" numberOfLines={1}>
            {formatRouteInstruction(destinationAddress)}
          </Text>
        </View>

        <View className="mb-4 mt-3 min-h-[260px] flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-slate-900">
          <View className="absolute inset-0 bg-slate-950" />
          <View className="absolute left-8 right-8 top-1/2 h-1 rounded-full bg-cyan-300/35" />
          <View className="absolute left-8 top-1/2 -mt-5 h-10 w-10 items-center justify-center rounded-full border border-cyan-200 bg-cyan-300">
            <Ionicons name="car-sport-outline" size={20} color="#020617" />
          </View>
          <View className="absolute right-8 top-1/2 -mt-5 h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-300">
            <Ionicons name="flag-outline" size={20} color="#052e16" />
          </View>
          <View className="absolute left-5 right-5 top-5 rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3">
            <Text className="font-semibold text-white">
              {hasDestination ? 'Route preview' : 'No destination address found'}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-400">
              {hasDestination
                ? 'Current location and live route line will appear here in the embedded map SDK version.'
                : 'Ride details are still available below. Use Issue, Call, or Message if needed.'}
            </Text>
          </View>
          <Pressable
            className="absolute bottom-5 right-5 h-12 w-12 items-center justify-center rounded-full bg-white/10 active:opacity-80"
            onPress={() =>
              showToast({
                title: 'Recenter ready',
                message: 'Live driver location will be added with the embedded map SDK.',
              })
            }
          >
            <Ionicons name="locate-outline" size={22} color="#ffffff" />
          </Pressable>
        </View>

        <View className="rounded-t-[30px] border border-white/10 bg-slate-900 px-5 pb-5 pt-4">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
            <View className="mb-4">
              <Text className="text-3xl font-semibold text-white">{view.group.riderName}</Text>
              <Text className="mt-2 text-base leading-6 text-slate-300">{destinationAddress || 'No destination address found.'}</Text>
              {view.group.notes ? (
                <Text className="mt-3 text-sm leading-6 text-amber-100">{view.group.notes}</Text>
              ) : null}
            </View>

            <View className="mb-4 flex-row gap-2">
              <View className="flex-1 rounded-3xl bg-white/5 px-4 py-3">
                <Text className="text-xs uppercase tracking-[1.4px] text-slate-500">Distance</Text>
                <Text className="mt-2 font-semibold text-white">Unavailable</Text>
              </View>
              <View className="flex-1 rounded-3xl bg-white/5 px-4 py-3">
                <Text className="text-xs uppercase tracking-[1.4px] text-slate-500">ETA</Text>
                <Text className="mt-2 font-semibold text-white">Unavailable</Text>
              </View>
            </View>

            <View className="gap-3">
              <ActionButton
                label="Dropped Off"
                kind="primary"
                icon="checkmark-done-outline"
                disabled={isBusy}
                onPress={completeRide}
              />
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <ActionButton label="Arrived" icon="location-outline" disabled={isBusy} onPress={recordArrived} />
                </View>
                <View className="flex-1">
                  <ActionButton
                    label="Call"
                    icon="call-outline"
                    disabled={!hasPhone || isBusy}
                    onPress={() => callPhoneNumber(view.group.phone)}
                  />
                </View>
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <ActionButton
                    label="Message"
                    icon="chatbubble-outline"
                    disabled={isBusy}
                    onPress={() => sendQuickMessage(view.group.phone, buildQuickMessage('eta', view))}
                  />
                </View>
                <View className="flex-1">
                  <ActionButton
                    label="Issue"
                    kind="danger"
                    icon="warning-outline"
                    disabled={isBusy}
                    onPress={() => setIsIssueSheetVisible(true)}
                  />
                </View>
              </View>
              <ActionButton
                label="External Nav"
                kind="ghost"
                icon="navigate-outline"
                disabled={isBusy}
                onPress={openExternalNavigationPicker}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      <Modal transparent animationType="slide" visible={isIssueSheetVisible}>
        <View className="flex-1 justify-end bg-black/55">
          <Pressable className="flex-1" onPress={() => setIsIssueSheetVisible(false)} />
          <View className="rounded-t-[32px] border border-white/10 bg-slate-950 p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-2xl font-semibold text-white">Ride issue</Text>
              <Pressable
                className="rounded-full bg-white/10 p-2"
                onPress={() => setIsIssueSheetVisible(false)}
              >
                <Ionicons name="close" size={18} color="#cbd5e1" />
              </Pressable>
            </View>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {issueOptions.map((option) => (
                <Pressable
                  key={option.type}
                  className={`rounded-full border px-4 py-2 ${
                    selectedIssueType === option.type
                      ? 'border-cyan-300 bg-cyan-400/15'
                      : 'border-white/10 bg-white/5'
                  }`}
                  onPress={() => setSelectedIssueType(option.type)}
                >
                  <Text className={selectedIssueType === option.type ? 'font-semibold text-cyan-100' : 'font-semibold text-slate-300'}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              className="min-h-[92px] rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              multiline
              placeholder="Optional note"
              placeholderTextColor="#64748b"
              textAlignVertical="top"
              value={issueNote}
              onChangeText={setIssueNote}
            />
            <View className="mt-4">
              <ActionButton label="Record Issue" kind="primary" disabled={isBusy} onPress={submitIssue} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
